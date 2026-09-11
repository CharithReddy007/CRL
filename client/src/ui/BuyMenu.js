import { net } from '../net.js';
import { C2S, WEAPONS, WEAPON_CLASSES, ARMOR_LIGHT, ARMOR_HEAVY } from '@crl/shared';

const CATEGORIES = [
  { slot: 'secondary', class: WEAPON_CLASSES.PISTOL, label: 'Pistols' },
  { slot: 'primary', class: WEAPON_CLASSES.SMG, label: 'SMGs' },
  { slot: 'primary', class: WEAPON_CLASSES.RIFLE, label: 'Rifles' },
  { slot: 'primary', class: WEAPON_CLASSES.SHOTGUN, label: 'Shotguns' },
  { slot: 'primary', class: WEAPON_CLASSES.SNIPER, label: 'Snipers' },
  { slot: 'primary', class: WEAPON_CLASSES.HEAVY, label: 'Heavy' },
];

export class BuyMenu {
  constructor(root) {
    this.root = document.createElement('div');
    this.root.className = 'buymenu hidden';
    root.appendChild(this.root);
    this.open = false;
    this.credits = 0;
    this.weapons = {};
    this.render();
  }

  render() {
    const rows = CATEGORIES.map((cat) => {
      const items = Object.values(WEAPONS).filter((w) => w.class === cat.class);
      return `<div class="buy-cat">
        <div class="buy-cat-label">${cat.label}</div>
        <div class="buy-items">
          ${items.map((w) => `<button class="buy-item" data-slot="${cat.slot}" data-id="${w.id}">
            <span class="bi-name">${w.name}</span><span class="bi-cost">¤${w.cost}</span>
          </button>`).join('')}
        </div>
      </div>`;
    }).join('');
    this.root.innerHTML = `
      <div class="buymenu-panel panel">
        <div class="buymenu-header">
          <h2>BUY MENU</h2>
          <div class="buymenu-credits">¤<span id="bm-credits">0</span></div>
        </div>
        <div class="buymenu-cols">
          <div class="buymenu-weapons">${rows}</div>
          <div class="buymenu-armor">
            <div class="buy-cat-label">Armor</div>
            <button class="buy-item" data-slot="armor" data-id="light"><span class="bi-name">Light Vest</span><span class="bi-cost">¤${ARMOR_LIGHT.cost}</span></button>
            <button class="buy-item" data-slot="armor" data-id="heavy"><span class="bi-name">Heavy Vest</span><span class="bi-cost">¤${ARMOR_HEAVY.cost}</span></button>
          </div>
        </div>
        <div class="buymenu-footer">Press <b>B</b> or <b>Esc</b> to close</div>
      </div>`;
    this.root.querySelectorAll('.buy-item').forEach((btn) => {
      btn.onclick = () => net.send(C2S.BUY, { slot: btn.dataset.slot, itemId: btn.dataset.id });
    });
  }

  setCredits(c) {
    this.credits = c;
    this.root.querySelector('#bm-credits').textContent = c;
    this.root.querySelectorAll('.buy-item').forEach((btn) => {
      const id = btn.dataset.id;
      const cost = btn.dataset.slot === 'armor'
        ? (id === 'heavy' ? ARMOR_HEAVY.cost : ARMOR_LIGHT.cost)
        : WEAPONS[id].cost;
      btn.disabled = cost > c;
    });
  }

  setOwned(weapons, armorType) {
    this.root.querySelectorAll('.buy-item').forEach((btn) => {
      const owned = btn.dataset.slot === 'armor' ? armorType === btn.dataset.id : weapons[btn.dataset.slot] === btn.dataset.id;
      btn.classList.toggle('owned', owned);
    });
  }

  show() { this.open = true; this.root.classList.remove('hidden'); }
  hide() { this.open = false; this.root.classList.add('hidden'); }
  toggle() { this.open ? this.hide() : this.show(); }
}
