import { WeaponLibrary } from '../weapons/WeaponLibrary';
import { WeaponSlots } from '../player/WeaponSlots';

const STORAGE_KEY = 'lab101_loadout';

export class StartMenu {
  slots: WeaponSlots;
  onStart: () => void;

  constructor(slots: WeaponSlots, onStart: () => void) {
    this.slots = slots;
    this.onStart = onStart;
    this.build();
  }

  build() {
    const slotList = document.getElementById('slotList')!;
    const weaponList = document.getElementById('weaponList')!;

    // Load saved loadout (safely)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) this.slots.loadFrom(parsed);
      }
    } catch (e) {
      console.warn("Could not load saved loadout");
    }

    slotList.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const row = document.createElement('div');
      row.className = 'slotRow';
      if (i === 8) row.classList.add('locked');

      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = String(i + 1);
      row.appendChild(num);

      const select = document.createElement('select');
      select.disabled = i === 8;
      
      const noneOpt = document.createElement('option');
      noneOpt.value = '';
      noneOpt.textContent = '— Empty (Hand / Punch / Grab) —';
      select.appendChild(noneOpt);

      if (i === 8) {
        const opt = document.createElement('option');
        opt.value = 'ragdollGun';
        opt.textContent = 'Ragdoll Gun (locked)';
        opt.selected = true;
        select.appendChild(opt);
      } else {
        for (const w of WeaponLibrary.all) {
          const opt = document.createElement('option');
          opt.value = w.id;
          opt.textContent = w.name;
          if (this.slots.slots[i]?.id === w.id) opt.selected = true;
          select.appendChild(opt);
        }
        
        // Save when changed
        select.addEventListener('change', () => {
          this.slots.assign(i, select.value === '' ? null : select.value);
          this.persist();
        });
      }
      row.appendChild(select);
      slotList.appendChild(row);
    }

    weaponList.innerHTML = '';
    for (const w of WeaponLibrary.all) {
      const card = document.createElement('div');
      card.className = 'weaponCard';
      card.innerHTML = `
        <div class="name">${w.name}</div>
        <div class="stats">
          ${w.type.toUpperCase()} • DMG ${w.damage} • RATE ${w.fireRate}ms • RNG ${w.range}m
        </div>
      `;
      weaponList.appendChild(card);
    }

    // Ragdoll gun card
    const rg = document.createElement('div');
    rg.className = 'weaponCard';
    rg.style.borderColor = '#7cf';
    rg.innerHTML = `
      <div class="name">Ragdoll Gun (Slot 9)</div>
      <div class="stats">SPECIAL • Spawns a new active ragdoll at impact</div>
    `;
    weaponList.appendChild(rg);

    // Attach the start button event
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.onclick = () => {
        this.persist();
        this.onStart();
      };
    }
  }

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slots.toJSON()));
    } catch (e) {}
  }
}
