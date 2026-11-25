import { Ragdoll, PartName } from './RagdollFactory';
import * as CANNON from 'cannon-es';

export interface DamageResult {
  killed: boolean;
  partName: PartName;
}

export function applyDamage(
  ragdoll: Ragdoll,
  part: PartName,
  amount: number,
  impulseDir: CANNON.Vec3,
  impulseStrength: number,
  hitPoint: CANNON.Vec3
): DamageResult {
  const p = ragdoll.parts[part];
  const effective = amount * p.damageMultiplier;
  p.health -= effective;

  const imp = impulseDir.scale(impulseStrength);
  p.body.applyImpulse(imp, hitPoint.vsub(p.body.position));

  ragdoll.hitFlash = 0.12;

  let killed = false;
  if (part === 'head' && p.health <= 0) {
    ragdoll.alive = false;
    killed = true;
  }

  return { killed, partName: part };
}
