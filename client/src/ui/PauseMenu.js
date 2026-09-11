export class PauseMenu {
  constructor(root, { onResume, onLeave, onSensitivity, getSensitivity }) {
    this.root = document.createElement('div');
    this.root.className = 'pausemenu hidden';
    root.appendChild(this.root);
    this.root.innerHTML = `
      <div class="pausemenu-panel panel">
        <h2>MENU</h2>
        <label class="field-label">Mouse Sensitivity</label>
        <input type="range" id="sens-slider" min="0.2" max ="3" step="0.05" value="${getSensitivity()}" />
        <div class="pausemenu-actions">
          <button id="resume-btn" class="primary">Resume</button>
          <button id="leave-btn" class="danger">Leave Match</button>
        </div>
      </div>`;
    this.root.querySelector('#resume-btn').onclick = onResume;
    this.root.querySelector('#leave-btn').onclick = onLeave;
    this.root.querySelector('#sens-slider').oninput = (e) => onSensitivity(parseFloat(e.target.value));
    this.open = false;
  }

  show() { this.open = true; this.root.classList.remove('hidden'); }
  hide() { this.open = false; this.root.classList.add('hidden'); }
  toggle() { this.open ? this.hide() : this.show(); }
}
