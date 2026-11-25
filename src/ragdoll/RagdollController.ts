import * as CANNON from 'cannon-es';
import { Ragdoll } from './RagdollFactory';

const KP = 400;
const KD = 40;
const MAX_TORQUE = 500;

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

    // Dampen leg movement so they act as stands instead of slipping
    const lLeg = this.ragdoll.parts.lLeg.body;
    const rLeg = this.ragdoll.parts.rLeg.body;
    const footDamp = 0.9;
    lLeg.angularVelocity.scale(footDamp, lLeg.angularVelocity);
    rLeg.angularVelocity.scale(footDamp, rLeg.angularVelocity);
    lLeg.velocity.x *= 0.5;
    rLeg.velocity.x *= 0.5;
    lLeg.velocity.z *= 0.5;
    rLeg.velocity.z *= 0.5;
  }

  private applyUprightTorque(body: CANNON.Body, strength: number) {
    // Get current orientation
    const q = body.quaternion;
    
    // Calculate error to Y-Up
    // We want to align the body's local Up (0,1,0) with world Up (0,1,0)
    const up = new CANNON.Vec3(0, 1, 0);
    const localUp = q.vmult(new CANNON.Vec3(0, 1, 0));
    
    // Cross product gives the axis of rotation needed to align them
    const axis = localUp.cross(up);
    const angle = Math.acos(Math.max(-1, Math.min(1, localUp.dot(up))));
    
    const angVel = body.angularVelocity;
    
    // PD Control
    const torqueX = (axis.x * angle * KP - angVel.x * KD) * strength;
    const torqueZ = (axis.z * angle * KP - angVel.z * KD) * strength;
    
    const clamp = (v: number) => Math.max(-MAX_TORQUE, Math.min(MAX_TORQUE, v));
    body.torque.x += clamp(torqueX);
    body.torque.z += clamp(torqueZ);
    body.torque.y += -angVel.y * KD * 0.5 * strength;
  }

  applyStagger(seconds: number) {
    this.staggerTimer = Math.max(this.staggerTimer, seconds);
  }

  goLimp() {
    this.enabled = false;
  }
}
