import * as CANNON from 'cannon-es';
import { Ragdoll } from './RagdollFactory';

const KP = 20;
const KD = 5;
const MAX_TORQUE = 50;

export class RagdollController {
  ragdoll: Ragdoll;
  enabled = true;
  staggerTimer = 0;

  constructor(ragdoll: Ragdoll) {
    this.ragdoll = ragdoll;
  }

  update(dt: number) {
    if (!this.ragdoll.alive || !this.enabled) return;
    if (this.staggerTimer > 0) this.staggerTimer -= dt;

    const pelvis = this.ragdoll.parts.pelvis.body;
    const strength = this.staggerTimer > 0 ? 0.1 : 1.0;
    
    this.applyUprightTorque(pelvis, strength);
  }

  private applyUprightTorque(body: CANNON.Body, strength: number) {
    const q = body.quaternion;
    const up = new CANNON.Vec3(0, 1, 0);
    const localUp = q.vmult(new CANNON.Vec3(0, 1, 0));
    
    const axis = localUp.cross(up);
    const angle = Math.acos(Math.max(-1, Math.min(1, localUp.dot(up))));
    const angVel = body.angularVelocity;
    
    // Heavily damped PD Controller
    const torqueX = (axis.x * angle * KP - angVel.x * KD) * strength;
    const torqueZ = (axis.z * angle * KP - angVel.z * KD) * strength;
    
    const clamp = (v: number) => Math.max(-MAX_TORQUE, Math.min(MAX_TORQUE, v));
    body.torque.x += clamp(torqueX);
    body.torque.z += clamp(torqueZ);
    body.torque.y += -angVel.y * KD * strength;
  }

  applyStagger(seconds: number) {
    this.staggerTimer = Math.max(this.staggerTimer, seconds);
  }

  goLimp() {
    this.enabled = false;
  }
}
