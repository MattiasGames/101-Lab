import { WeaponLibrary } from '../weapons/WeaponLibrary';
import { WeaponSlots } from '../player/WeaponSlots';

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
    
    // Safety check
    if (!slotList || !weaponList) {
      console.error("HTML elements missing!");
      return;
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
      noneOpt.textContent = '— Empty —';
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
          if (this.slots.slots[i] && this.slots.slots[i]!.id === w.id) opt.selected = true;
          select.appendChild(opt);
        }
        
        select.addEventListener('change', () => {
          this.slots.assign(i, select.value === '' ? null : select.value);
        });
      }
      row.appendChild(select);
      slotList.appendChild(row);
    }

    weaponList.innerHTML = '';
    for (const w of WeaponLibrary.all) {
      const card = document.createElement('div');
      card.className = 'weaponCard';
      card.innerHTML = `<div class="name">${w.name}</div><div class="stats">DMG ${w.damage}</div>`;
      weaponList.appendChild(card);
    }

    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.onclick = () => {
        this.onStart();
      };
    }
  }
}
