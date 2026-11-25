import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { createRagdoll, Ragdoll, PartName, syncRagdollMeshes } from './RagdollFactory';
import { RagdollController } from './RagdollController';
import { applyDamage } from './DamageSystem';

interface ManagedRagdoll {
  ragdoll: Ragdoll;
  controller: RagdollController;
}

const MAX_RAGDOLLS = 12;

export class RagdollManager {
  phys: PhysicsWorld;
  scene: THREE.Scene;
  items: ManagedRagdoll[] = [];

  constructor(phys: PhysicsWorld, scene: THREE.Scene) {
    this.phys = phys;
    this.scene = scene;
  }

  spawn(pos: CANNON.Vec3): ManagedRagdoll {
    if (this.items.length >= MAX_RAGDOLLS) {
      this.removeOldest();
    }
    
    // FIX: Spawn slightly higher so they don't clip into the floor and explode
    const safePos = new CANNON.Vec3(pos.x, pos.y + 1.5, pos.z);
    
    const ragdoll = createRagdoll(this.phys, this.scene, safePos);
    const controller = new RagdollController(ragdoll);
    const item = { ragdoll, controller };
    this.items.push(item);
    return item;
  }

  removeOldest() {
    const item = this.items.shift();
    if (!item) return;
    this.destroy(item);
  }

  destroy(item: ManagedRagdoll) {
    for (const b of item.ragdoll.bodies) this.phys.world.removeBody(b);
    for (const c of item.ragdoll.constraints) this.phys.world.removeConstraint(c);
    for (const m of item.ragdoll.meshes) {
      this.scene.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }

  update(dt: number) {
    for (const item of this.items) {
      item.controller.update(dt);
      syncRagdollMeshes(item.ragdoll);
    }
  }

  findOwner(body: CANNON.Body): ManagedRagdoll | null {
    for (const item of this.items) {
      if (item.ragdoll.bodies.includes(body)) return item;
    }
    return null;
  }

  findPart(owner: ManagedRagdoll, body: CANNON.Body): PartName | null {
    for (const key in owner.ragdoll.parts) {
      const k = key as PartName;
      if (owner.ragdoll.parts[k].body === body) return k;
    }
    return null;
  }

  damage(owner: ManagedRagdoll, part: PartName, amount: number, dir: CANNON.Vec3, strength: number, hitPoint: CANNON.Vec3) {
    const res = applyDamage(owner.ragdoll, part, amount, dir, strength, hitPoint);
    if (res.killed) {
      owner.controller.goLimp();
    } else if (part === 'torso' || part === 'pelvis') {
      owner.controller.applyStagger(0.8);
    } else {
      owner.controller.applyStagger(0.3);
    }
  }
}
