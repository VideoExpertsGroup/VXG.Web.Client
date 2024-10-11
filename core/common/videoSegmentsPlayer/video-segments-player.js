class VideoSegmentsPlayer {

  constructor(selector, segments, options) {
    this.root = document.querySelector(selector);
    this.options = options || {};

    this.players = [];
    this.currentTime = 0;
    this.currentSegment = 0;

    this.isPlaying = false;

    this.setSegments(segments);

    this.timer = setInterval(this.onTimeout.bind(this), 30);
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.root) {
      this.root.innerHTML = '';
    }
  }

  setSegments(segments) {
    this.segments = segments;
    this.totalTime = segments.reduce((sum, segment) => sum + (segment.to - segment.from), 0);
    for (let i = 0; i < segments.length; i++) {
      segments[i].duration = segments[i].to - segments[i].from;
      segments[i].offset = i === 0 ? 0 : segments[i - 1].offset + segments[i - 1].duration;
    }

    this.currentTime = 0;
    this.currentSegment = 0;
    this.render();
    this.seekTo(0);
  }

  render() {
    if (!this.root) {
      throw `Can't find the root element`;
    }

    const self = this;
    let playersHtml = '';
    self.segments.forEach((segment, i) => {
      playersHtml += `<video class="${self.currentSegment === i ? 'active' : ''}" src="${segment.src}"></video>`;
    });

    self.root.innerHTML = `
      <div class="video-segments-player">
        <div class="players">${playersHtml}</div>
        <div class="controller">
          <div class="controls">
            <sp-control-play class="control"></sp-control-play>
            <div class="playtime">0:00 / 0:00</div>
          </div>
          <input class="timeline" type="range" min="0" max="${self.totalTime}" step="0.01" value="0">
        </div>
      </div>
    `;

    self.players = self.root.querySelectorAll('.players video');
    self.activePlayer = self.players[self.currentSegment];

    self.playerBtn = self.root.querySelector('sp-control-play');
    self.playerBtn.addEventListener('click', () => {
      if (!self.isPlaying) {
        self.onPlay();
      } else {
        self.onPause();
      }
    });
    self.playerBtn.disable(!this.totalTime);

    self.timeline = self.root.querySelector('.timeline');
    self.timeline.addEventListener('input', (e) => {
      const value = Number(e.target.value) || 0;
      this.onPause();
      this.seekTo(value);
    });

    self.timeLabel = self.root.querySelector('.playtime');

    this.displayPlaytime();
  }

  formatPlaytime(time) {
    const s = Math.floor(time % 60);
    const m = Math.floor(time / 60) % 60;
    const h = Math.floor(time / 3600);
    return `${h ? `${h}:` : ''}${m}:${s.toString().padStart(2, '0')}`;
  }

  displayPlaytime() {
    this.timeLabel.innerHTML = `${this.formatPlaytime(this.currentTime)} / ${this.formatPlaytime(this.totalTime)}`;
  }

  setPlaytime(time) {
    this.currentTime = time;
    this.displayPlaytime();
    this.timeline.value = time;
  }

  onPlay() {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    if (this.currentTime >= this.totalTime) {
      this.currentTime = 0;
    }
    this.seekTo(this.currentTime);
    if (this.activePlayer) {
      this.activePlayer.play();
    }
    this.playerBtn.play();
  }

  onPause() {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    if (this.activePlayer) {
      this.activePlayer.pause();
    }
    this.playerBtn.pause();
  }

  onTimeout() {
    if (!this.isPlaying) {
      return;
    }

    this.seekTo(this.currentTime + 0.03);
  }

  seekTo(time) {
    this.setPlaytime(time);
    let segmentId = this.segments.findIndex((segment) => segment.offset <= time && segment.offset + segment.duration > time);
    if (segmentId === -1) {
      segmentId = time < 0 ? 0 : this.segments.length - 1;
      if (this.isPlaying) {
        this.onPause();
      }
    }
    if (segmentId !== this.currentSegment) {
      if (this.activePlayer) {
        this.activePlayer.pause();
        this.activePlayer.classList.remove('active');
      }
      this.currentSegment = segmentId;
      this.activePlayer = this.players[this.currentSegment];
      if (this.activePlayer) {
        this.activePlayer.classList.add('active');
        if (this.isPlaying) {
          this.activePlayer.play();
        }
      }
    }
    this.syncTime(0.5);
  }

  syncTime(threshold = 0.5, force = false) {
    if (!this.activePlayer) {
      return;
    }

    const segment = this.segments[this.currentSegment];
    const playTime = this.activePlayer.currentTime - segment.from + segment.offset;
    const diff = Math.abs(playTime - this.currentTime);

    if (force || diff > threshold) {
      this.activePlayer.currentTime = this.currentTime - segment.offset + segment.from;
    }
  }
}

window.customElements.define('video-segments-player', VideoSegmentsPlayer);
