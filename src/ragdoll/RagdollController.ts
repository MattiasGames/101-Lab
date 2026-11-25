import * as CANNON from 'cannon-es';
import { Ragdoll } from './RagdollFactory';

const KP = 140;
const KD = 18;
const MAX_TORQUE = 90;

export class RagdollController {
  ragdoll: Ragdoll;
  enabled = true;
  grabTarget: CANNON.Vec3 | null = null;
  grabbedBody: CANNON.Body | null = null;
  staggerTimer = 0;

  constructor(ragdoll: Ragdoll) {
    this.ragdoll = ragdoll;
  }

  update(dt: number) {
    if (!this.ragdoll.alive) return;

    if (this.staggerTimer > 0) this.staggerTimer -= dt;

    const pelvis = this.ragdoll.parts.pelvis.body;

    if (this.grabTarget && this.grabbedBody) {
      const gb = this.grabbedBody;
      const target = this.grabTarget;
      const dx = target.x - gb.position.x;
      const dy = target.y - gb.position.y;
      const dz = target.z - gb.position.z;
      const stiffness = 60;
      const damping = 12;
      gb.applyForce(
        new CANNON.Vec3(
          dx * stiffness - gb.velocity.x * damping,
          dy * stiffness - gb.velocity.y * damping,
          dz * stiffness - gb.velocity.z * damping,
        ),
        gb.position
      );
      this.applyUprightTorque(pelvis, 0.25);
      return;
    }

    if (!this.enabled) return;

    const strength = this.staggerTimer > 0 ? 0.35 : 1.0;
    this.applyUprightTorque(pelvis, strength);

    const lLeg = this.ragdoll.parts.lLeg.body;
    const rLeg = this.ragdoll.parts.rLeg.body;
    const footDamp = 0.6;
    lLeg.angularVelocity.scale(footDamp, lLeg.angularVelocity);
    rLeg.angularVelocity.scale(footDamp, rLeg.angularVelocity);
  }

  private applyUprightTorque(body: CANNON.Body, strength: number) {
    const current = body.quaternion;
    const q = new CANNON.Quaternion(current.x, current.y, current.z, current.w);
    q.conjugate(q);
    const w = Math.max(-1, Math.min(1, q.w));
    const angle = 2 * Math.acos(w);
    let sx = q.x, sy = q.y, sz = q.z;
    const sinHalf = Math.sqrt(1 - w * w);
    if (sinHalf > 1e-5) {
      sx /= sinHalf; sy /= sinHalf; sz /= sinHalf;
    }
    const errX = sx * angle;
    const errZ = sz * angle;
    const angVel = body.angularVelocity;
    const tx = (errX * KP - angVel.x * KD) * strength;
    const tz = (errZ * KP - angVel.z * KD) * strength;
    const clamp = (v: number) => Math.max(-MAX_TORQUE, Math.min(MAX_TORQUE, v));
    body.torque.x += clamp(tx);
    body.torque.z += clamp(tz);
    body.torque.y += -angVel.y * KD * 0.5 * strength;
  }

  applyStagger(seconds: number) {
    this.staggerTimer = Math.max(this.staggerTimer, seconds);
  }

  goLimp() {
    this.enabled = false;
  }
}
