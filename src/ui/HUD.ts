import { WeaponSlots } from '../player/WeaponSlots';

let hudEl: HTMLElement | null = null;
let msgEl: HTMLElement | null = null;
let slotsRef: WeaponSlots | null = null;
let msgTimer: number | null = null;

export function initHUD(slots: WeaponSlots) {
  hudEl = document.getElementById('hud');
  msgEl = document.getElementById('msg');
  slotsRef = slots;
  refreshHUD();
}

export function refreshHUD() {
  if (!hudEl || !slotsRef) return;
  const parts: string[] = [];
  for (let i = 0; i < 9; i++) {
    const w = slotsRef.slots[i];
    const label = w ? w.name : (i === 8 ? '?' : 'Hand');
    const active = i === slotsRef.currentSlot ? ' active' : '';
    parts.push(`<span class="slot${active}">${i + 1}: ${label}</span>`);
  }
  hudEl.innerHTML = parts.join('');
}

export function showMessage(text: string) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.opacity = '1';
  if (msgTimer !== null) window.clearTimeout(msgTimer);
  msgTimer = window.setTimeout(() => {
    if (msgEl) msgEl.style.opacity = '0';
  }, 1000);
}
