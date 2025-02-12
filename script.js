class ScreenRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.stream = null;
    this.timerInterval = null;
    this.startTime = 0;
    this.pausedTime = 0;

    // DOM Elements
    this.startButton = document.getElementById("startButton");
    this.pauseButton = document.getElementById("pauseButton");
    this.resumeButton = document.getElementById("resumeButton");
    this.stopButton = document.getElementById("stopButton");
    this.recordedVideo = document.getElementById("recordedVideo");
    this.timerDisplay = document.getElementById("timer");
    this.shareContainer = document.getElementById("shareContainer");
    this.downloadBtn = document.getElementById("downloadBtn");
    this.copyLinkBtn = document.getElementById("copyLinkBtn");

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.startButton.addEventListener("click", () => this.startRecording());
    this.pauseButton.addEventListener("click", () => this.pauseRecording());
    this.resumeButton.addEventListener("click", () => this.resumeRecording());
    this.stopButton.addEventListener("click", () => this.stopRecording());
    this.downloadBtn.addEventListener("click", () => this.downloadRecording());
    this.copyLinkBtn.addEventListener("click", () => this.copyShareLink());
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false
      });

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        this.startTime = Date.now() - this.pausedTime;
        this.startTimer();
        this.updateButtonStates();
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.stopTimer();
        this.processRecording();
        this.updateButtonStates();
      };

      this.mediaRecorder.start();
    } catch (error) {
      this.showToast("Failed to start recording: " + error.message);
    }
  }

  pauseRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.pausedTime = Date.now() - this.startTime;
      this.stopTimer();
      this.updateButtonStates();
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.startTime = Date.now() - this.pausedTime;
      this.startTimer();
      this.updateButtonStates();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }

  processRecording() {
    const blob = new Blob(this.recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    this.recordedVideo.src = url;
    this.shareContainer.style.display = "block";
  }

  downloadRecording() {
    const blob = new Blob(this.recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `screen-recording-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  copyShareLink() {
    const blob = new Blob(this.recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    navigator.clipboard
      .writeText(url)
      .then(() => this.showToast("Link copied to clipboard!"))
      .catch((err) => this.showToast("Failed to copy link: " + err.message));
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.timerDisplay.textContent = this.formatTime(elapsed);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  updateButtonStates() {
    this.startButton.disabled = this.isRecording;
    this.pauseButton.disabled = !this.isRecording || this.isPaused;
    this.resumeButton.disabled = !this.isPaused;
    this.stopButton.disabled = !this.isRecording;
  }

  showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.style.display = "block";

    setTimeout(() => {
      toast.style.display = "none";
      document.body.removeChild(toast);
    }, 3000);
  }
}

// Initialize the screen recorder when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new ScreenRecorder();
});