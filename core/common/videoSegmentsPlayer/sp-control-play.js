class SPControlPlay extends HTMLElement {
  getType() {
    return 'min';
  }

  static get observedAttributes() {
    return ['disabled'];
  }

  constructor() {
    super();

    this.isPlaying = false;
  }

  connectedCallback() {
    let self = this;
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.innerHTML += `<style>${this.css()}</style><div class="vsp-play-btn"></div>`;
    self.button = this.shadow.querySelector('.vsp-play-btn');
  }

  play() {
    this.button.classList.add('paused');
    this.isPlaying = true;
  }

  pause() {
    this.button.classList.remove('paused');
    this.isPlaying = false;
  }

  disable(disabled) {
    this.button.classList.toggle('disabled', disabled);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'disabled') {
      this.disable(newValue === 'true');
    }
  }

  css() {
    return `
      .vsp-play-btn {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        transition: all ease-in-out 0.2s;
        cursor:pointer;
      }
      .vsp-play-btn::after {
        display: block;
        content: '';
        width: 100%;
        height: 100%;
        background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTggNXYxNGwxMS03eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==) no-repeat;
        background-position: center;
        background-size: 80%;
      }
      .vsp-play-btn:hover {
        background: #444;
      }
      .vsp-play-btn.paused::after {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYgMTloNFY1SDZ6bTgtMTR2MTRoNFY1eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==);
      }
      .vsp-play-btn.disabled {
        pointer-events: none;
      }
    `;
  }
}

window.customElements.define('sp-control-play', SPControlPlay);
