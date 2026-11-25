import { WeaponConfig, WeaponLibrary } from '../weapons/WeaponLibrary';

export class WeaponSlots {
  slots: (WeaponConfig | null)[] = [null, null, null, null, null, null, null, null, null];
  currentSlot = 0;

  constructor() {
    this.slots[8] = WeaponLibrary.ragdollGun;
  }

  assign(slot: number, weaponId: string | null) {
    if (slot === 8) return;
    if (slot < 0 || slot > 7) return;
    if (weaponId === null) { this.slots[slot] = null; return; }
    const w = WeaponLibrary.find(weaponId);
    if (w) this.slots[slot] = w;
  }

  select(slot: number) {
    if (slot < 0 || slot > 8) return;
    this.currentSlot = slot;
  }

  current(): WeaponConfig | null {
    return this.slots[this.currentSlot];
  }

  toJSON() {
    return this.slots.map(s => (s ? s.id : null)).slice(0, 8);
  }

  loadFrom(json: (string | null)[]) {
    for (let i = 0; i < 8 && i < json.length; i++) {
      this.assign(i, json[i]);
    }
  }
}
