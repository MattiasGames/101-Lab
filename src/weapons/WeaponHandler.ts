import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { WeaponConfig } from './WeaponLibrary';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RagdollManager } from '../ragdoll/RagdollManager';

export class WeaponHandler {
  phys: PhysicsWorld;
  ragdollManager: RagdollManager;
  lastFire = 0;

  constructor(phys: PhysicsWorld, rm: RagdollManager) {
    this.phys = phys;
    this.ragdollManager = rm;
  }

  fire(weapon: WeaponConfig, camera: THREE.PerspectiveCamera): { hit: boolean; info?: string } {
    const now = performance.now();
    if (now - this.lastFire < weapon.fireRate) return { hit: false };
    this.lastFire = now;

    if (weapon.type === 'ranged') return this.fireRaycast(weapon, camera, 1);
    if (weapon.type === 'melee') return this.fireRaycast(weapon, camera, 1);
    return { hit: false };
  }

  fireRagdollGun(camera: THREE.PerspectiveCamera): { hit: boolean } {
    const now = performance.now();
    if (now - this.lastFire < 250) return { hit: false };
    this.lastFire = now;

    const origin = new CANNON.Vec3(camera.position.x, camera.position.y, camera.position.z);
    const dirThree = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const dir = new CANNON.Vec3(dirThree.x, dirThree.y, dirThree.z);
    const to = new CANNON.Vec3(
      origin.x + dir.x * 100,
      origin.y + dir.y * 100,
      origin.z + dir.z * 100
    );

    const ray = new CANNON.Ray(origin, to);
    const res = new CANNON.RaycastResult();
    ray.intersectWorld(this.phys.world, { result: res, skipBackfaces: true });

    let spawnPos: CANNON.Vec3;
    if (res.hasHit) {
      spawnPos = new CANNON.Vec3(res.hitPointWorld.x, res.hitPointWorld.y + 0.8, res.hitPointWorld.z);
    } else {
      spawnPos = new CANNON.Vec3(origin.x + dir.x * 8, origin.y + dir.y * 8 + 0.8, origin.z + dir.z * 8);
    }

    const spawned = this.ragdollManager.spawn(spawnPos);
    // Add a small pop
    for (const b of spawned.ragdoll.bodies) {
      b.velocity.set(dir.x * 3, 3, dir.z * 3);
    }
    return { hit: true };
  }

  private fireRaycast(weapon: WeaponConfig, camera: THREE.PerspectiveCamera, count: number): { hit: boolean; info?: string } {
    const origin = new CANNON.Vec3(camera.position.x, camera.position.y, camera.position.z);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    let anyHit = false;
    let hitInfo = '';

    for (let i = 0; i < count; i++) {
      const dirThree = forward.clone();
      if (weapon.spread) {
        dirThree.x += (Math.random() - 0.5) * weapon.spread * 2;
        dirThree.y += (Math.random() - 0.5) * weapon.spread * 2;
        dirThree.z += (Math.random() - 0.5) * weapon.spread * 2;
        dirThree.normalize();
      }
      const dir = new CANNON.Vec3(dirThree.x, dirThree.y, dirThree.z);
      const to = new CANNON.Vec3(
        origin.x + dir.x * weapon.range,
        origin.y + dir.y * weapon.range,
        origin.z + dir.z * weapon.range
      );
      const ray = new CANNON.Ray(origin, to);
      const res = new CANNON.RaycastResult();
      ray.intersectWorld(this.phys.world, { result: res, skipBackfaces: true });
      if (!res.hasHit || !res.body) continue;

      const owner = this.ragdollManager.findOwner(res.body);
      if (!owner) continue;

      const part = this.ragdollManager.findPart(owner, res.body);
      if (!part) continue;

      const hitPoint = new CANNON.Vec3(res.hitPointWorld.x, res.hitPointWorld.y, res.hitPointWorld.z);
      const impulseDir = new CANNON.Vec3(dirThree.x, dirThree.y, dirThree.z);
      this.ragdollManager.damage(owner, part, weapon.damage, impulseDir, weapon.impulse, hitPoint);
      anyHit = true;
      hitInfo = part;
    }
    return { hit: anyHit, info: hitInfo };
  }
}
