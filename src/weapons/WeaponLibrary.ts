export type WeaponType = 'melee' | 'ranged' | 'special' | 'ragdollGun';

export interface WeaponConfig {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  fireRate: number;
  range: number;
  impulse: number;
  spread?: number;
}

export const WeaponLibrary = {
  all: [
    { id: 'pistol',    name: 'Pistol',        type: 'ranged', damage: 25, fireRate: 350,  range: 80,  impulse: 3 },
    { id: 'smg',       name: 'SMG',           type: 'ranged', damage: 14, fireRate: 100,  range: 60,  impulse: 1.5, spread: 0.02 },
    { id: 'shotgun',   name: 'Shotgun',       type: 'ranged', damage: 12, fireRate: 800,  range: 30,  impulse: 6, spread: 0.08 },
    { id: 'rifle',     name: 'Assault Rifle', type: 'ranged', damage: 20, fireRate: 120,  range: 100, impulse: 2.5, spread: 0.012 },
    { id: 'sniper',    name: 'Sniper',        type: 'ranged', damage: 90, fireRate: 1500, range: 200, impulse: 10 },
    { id: 'bat',       name: 'Baseball Bat',  type: 'melee',  damage: 30, fireRate: 500,  range: 2.2, impulse: 8 },
    { id: 'katana',    name: 'Katana',        type: 'melee',  damage: 55, fireRate: 600,  range: 2.4, impulse: 5 },
    { id: 'hammer',    name: 'Sledgehammer',  type: 'melee',  damage: 70, fireRate: 1000, range: 2.5, impulse: 14 },
  ] as WeaponConfig[],

  ragdollGun: {
    id: 'ragdollGun',
    name: 'Ragdoll Gun',
    type: 'ragdollGun',
    damage: 0,
    fireRate: 250,
    range: 100,
    impulse: 0,
  } as WeaponConfig,

  find(id: string): WeaponConfig | undefined {
    if (id === 'ragdollGun') return this.ragdollGun;
    return this.all.find(w => w.id === id);
  },
};
