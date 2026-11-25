import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { RagdollManager } from '../ragdoll/RagdollManager';
import { WeaponSlots } from './WeaponSlots';
import { WeaponHandler } from '../weapons/WeaponHandler';
import { FPSController } from './FPSController';
import { showMessage } from '../ui/HUD';

export class Interaction {
  phys: PhysicsWorld;
  ragdolls: RagdollManager;
  slots: WeaponSlots;
  weapons: WeaponHandler;
  fps: FPSController;
  grabbing = false;
  grabbedOwner: any = null;

  constructor(
    phys: PhysicsWorld,
    ragdolls: RagdollManager,
    slots: WeaponSlots,
    weapons: WeaponHandler,
    fps: FPSController
  ) {
    this.phys = phys;
    this.ragdolls = ragdolls;
    this.slots = slots;
    this.weapons = weapons;
    this.fps = fps;
  }

  onLeftDown() {
    if (!document.pointerLockElement) return;
    const current = this.slots.current();
    if (!current) {
      this.punch();
      return;
    }
    if (current.type === 'ragdollGun') {
      this.weapons.fireRagdollGun(this.fps.camera);
      return;
    }
    const r = this.weapons.fire(current, this.fps.camera);
    if (r.hit) showMessage(`HIT ${r.info ?? ''}`);
  }

  onRightDown() {
    if (!document.pointerLockElement) return;
    // Try to grab ragdoll
    const origin = new CANNON.Vec3(
      this.fps.camera.position.x,
      this.fps.camera.position.y,
      this.fps.camera.position.z
    );
    const fwd = this.fps.getForward();
    const dir = new CANNON.Vec3(fwd.x, fwd.y, fwd.z);
    const to = new CANNON.Vec3(origin.x + dir.x * 3.5, origin.y + dir.y * 3.5, origin.z + dir.z * 3.5);
    const ray = new CANNON.Ray(origin, to);
    const res = new CANNON.RaycastResult();
    ray.intersectWorld(this.phys.world, { result: res, skipBackfaces: true });
    if (res.hasHit && res.body) {
      const owner = this.ragdolls.findOwner(res.body);
      if (owner) {
        const part = this.ragdolls.findPart(owner, res.body);
        if (part) {
          owner.controller.grabbedBody = owner.ragdoll.parts[part].body;
          owner.controller.grabTarget = new CANNON.Vec3();
          this.grabbing = true;
          this.grabbedOwner = owner;
          showMessage(`GRABBED ${part}`);
        }
      }
    }
  }

  onRightUp() {
    if (this.grabbedOwner) {
      this.grabbedOwner.controller.grabbedBody = null;
      this.grabbedOwner.controller.grabTarget = null;
      this.grabbedOwner = null;
    }
    this.grabbing = false;
  }

  private punch() {
    const origin = new CANNON.Vec3(
      this.fps.camera.position.x,
      this.fps.camera.position.y,
      this.fps.camera.position.z
    );
    const fwd = this.fps.getForward();
    const dir = new CANNON.Vec3(fwd.x, fwd.y, fwd.z);
    const to = new CANNON.Vec3(origin.x + dir.x * 1.8, origin.y + dir.y * 1.8, origin.z + dir.z * 1.8);
    const ray = new CANNON.Ray(origin, to);
    const res = new CANNON.RaycastResult();
    ray.intersectWorld(this.phys.world, { result: res, skipBackfaces: true });
    if (!res.hasHit || !res.body) return;
    const owner = this.ragdolls.findOwner(res.body);
    if (!owner) return;
    const part = this.ragdolls.findPart(owner, res.body);
    if (!part) return;
    const hitPoint = new CANNON.Vec3(res.hitPointWorld.x, res.hitPointWorld.y, res.hitPointWorld.z);
    this.ragdolls.damage(owner, part, 15, dir, 8, hitPoint);
    showMessage(`PUNCH ${part}`);
  }

  update() {
    if (this.grabbing && this.grabbedOwner && this.grabbedOwner.controller.grabbedBody) {
      const fwd = this.fps.getForward();
      const target = this.grabbedOwner.controller.grabTarget as CANNON.Vec3;
      target.set(
        this.fps.camera.position.x + fwd.x * 2.2,
        this.fps.camera.position.y + fwd.y * 2.2,
        this.fps.camera.position.z + fwd.z * 2.2
      );
    }
  }
}
