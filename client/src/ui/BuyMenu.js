import { net } from '../net.js';
import { C2S, WEAPONS, WEAPON_CLASSES, ARMOR_LIGHT, ARMOR_HEAVY, GRENADES } from '@crl/shared';

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
    this.armorType = null;
    this.boughtThisBuy = { primary: false, secondary: false, armor: false };
    this.grenades = { FRAG1: 0, SMOKE1: 0 };
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
        <div class="buymenu-loadout">
          <div class="loadout-slot" data-slot="primary"><span class="ls-label">Primary</span><span class="ls-item">—</span><button class="ls-sell" data-slot="primary">Sell</button></div>
          <div class="loadout-slot" data-slot="secondary"><span class="ls-label">Secondary</span><span class="ls-item">—</span><button class="ls-sell" data-slot="secondary">Sell</button></div>
          <div class="loadout-slot" data-slot="armor"><span class="ls-label">Armor</span><span class="ls-item">—</span><button class="ls-sell" data-slot="armor">Sell</button></div>
        </div>
        <div class="buymenu-cols">
          <div class="buymenu-weapons">${rows}</div>
          <div class="buymenu-armor">
            <div class="buy-cat-label">Armor</div>
            <button class="buy-item" data-slot="armor" data-id="light"><span class="bi-name">Light Vest</span><span class="bi-cost">¤${ARMOR_LIGHT.cost}</span></button>
            <button class="buy-item" data-slot="armor" data-id="heavy"><span class="bi-name">Heavy Vest</span><span class="bi-cost">¤${ARMOR_HEAVY.cost}</span></button>
            <div class="buy-cat-label" style="margin-top:14px">Grenades &middot; 4 / 5</div>
            ${Object.values(GRENADES).map((g) => `<button class="buy-item grenade-item" data-slot="grenade" data-id="${g.id}">
              <span class="bi-name">${g.name}<span class="bi-owned"></span></span><span class="bi-cost">¤${g.cost}</span>
            </button>`).join('')}
          </div>
        </div>
        <div class="buymenu-footer">Press <b>B</b> or <b>Esc</b> to close &middot; Sell refunds only what you bought this buy phase</div>
      </div>`;
    this.root.querySelectorAll('.buy-item').forEach((btn) => {
      btn.onclick = () => net.send(C2S.BUY, { slot: btn.dataset.slot, itemId: btn.dataset.id });
    });
    this.root.querySelectorAll('.ls-sell').forEach((btn) => {
      btn.onclick = () => net.send(C2S.SELL, { slot: btn.dataset.slot });
    });
  }

  itemCost(slot, id) {
    if (slot === 'armor') return id === 'heavy' ? ARMOR_HEAVY.cost : ARMOR_LIGHT.cost;
    if (slot === 'grenade') return GRENADES[id].cost;
    return WEAPONS[id].cost;
  }

  setCredits(c) {
    this.credits = c;
    this.root.querySelector('#bm-credits').textContent = c;
    this.root.querySelectorAll('.buy-item').forEach((btn) => {
      const { slot, id } = btn.dataset;
      const atCap = slot === 'grenade' && (this.grenades[id] || 0) >= GRENADES[id].maxCarry;
      btn.disabled = this.itemCost(slot, id) > c || atCap;
    });
  }

  setOwned(weapons, armorType, boughtThisBuy, grenades) {
    this.weapons = weapons;
    this.armorType = armorType;
    if (boughtThisBuy) this.boughtThisBuy = boughtThisBuy;
    if (grenades) this.grenades = grenades;
    this.root.querySelectorAll('.buy-item').forEach((btn) => {
      const { slot, id } = btn.dataset;
      if (slot === 'grenade') {
        const count = this.grenades[id] || 0;
        btn.classList.toggle('owned', count > 0);
        btn.querySelector('.bi-owned').textContent = count > 0 ? ` (${count})` : '';
        btn.disabled = this.itemCost(slot, id) > this.credits || count >= GRENADES[id].maxCarry;
        return;
      }
      const owned = slot === 'armor' ? armorType === id : weapons[slot] === id;
      btn.classList.toggle('owned', owned);
    });
    const armorLabel = { light: 'Light Vest', heavy: 'Heavy Vest' };
    this.root.querySelectorAll('.loadout-slot').forEach((el) => {
      const slot = el.dataset.slot;
      const itemId = slot === 'armor' ? armorType : weapons[slot];
      const name = slot === 'armor' ? armorLabel[armorType] : (itemId && WEAPONS[itemId]?.name);
      el.querySelector('.ls-item').textContent = name || '— empty —';
      const sellBtn = el.querySelector('.ls-sell');
      sellBtn.disabled = !itemId || !this.boughtThisBuy[slot];
    });
  }

  show() { this.open = true; this.root.classList.remove('hidden'); }
  hide() { this.open = false; this.root.classList.add('hidden'); }
  toggle() { this.open ? this.hide() : this.show(); }
}
