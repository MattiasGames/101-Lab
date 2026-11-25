import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export type PartName = 'head' | 'torso' | 'pelvis' | 'lArm' | 'rArm' | 'lLeg' | 'rLeg';

export interface RagdollPart {
  name: PartName;
  body: CANNON.Body;
  mesh: THREE.Mesh;
  damageMultiplier: number;
  health: number;
  maxHealth: number;
}

export interface Ragdoll {
  parts: Record<PartName, RagdollPart>;
  bodies: CANNON.Body[];
  constraints: CANNON.Constraint[];
  meshes: THREE.Mesh[];
  ownerId: number;
  alive: boolean;
  hitFlash: number;
}

let ragdollIdCounter = 0;

function makeBox(size: [number, number, number], pos: CANNON.Vec3, mass: number, material: CANNON.Material): CANNON.Body {
  const half = new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2);
  const body = new CANNON.Body({
    mass,
    shape: new CANNON.Box(half),
    position: pos,
    material,
    linearDamping: 0.02,
    angularDamping: 0.1,
    allowSleep: true,
  });
  body.sleepSpeedLimit = 0.15;
  body.sleepTimeLimit = 1.0;
  return body;
}

function makeMesh(w: number, h: number, d: number, color: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createRagdoll(phys: PhysicsWorld, scene: THREE.Scene, origin: CANNON.Vec3): Ragdoll {
  const mat = phys.ragdollMaterial;
  const world = phys.world;
  const id = ragdollIdCounter++;

  const skinColor = 0xd9a86a;
  const torsoColor = 0x4060a0;

  const pelvisSize: [number, number, number] = [0.30, 0.18, 0.20];
  const torsoSize: [number, number, number] = [0.38, 0.42, 0.22];
  const headSize: [number, number, number] = [0.22, 0.24, 0.22];
  const armSize: [number, number, number] = [0.13, 0.42, 0.13];
  const legSize: [number, number, number] = [0.15, 0.52, 0.15];

  const pelvisPos = origin.clone();
  const torsoPos = origin.clone().vadd(new CANNON.Vec3(0, 0.30, 0));
  const headPos = origin.clone().vadd(new CANNON.Vec3(0, 0.62, 0));
  const lArmPos = origin.clone().vadd(new CANNON.Vec3(0.26, 0.28, 0));
  const rArmPos = origin.clone().vadd(new CANNON.Vec3(-0.26, 0.28, 0));
  const lLegPos = origin.clone().vadd(new CANNON.Vec3(0.11, -0.35, 0));
  const rLegPos = origin.clone().vadd(new CANNON.Vec3(-0.11, -0.35, 0));

  const pelvis = makeBox(pelvisSize, pelvisPos, 4, mat);
  const torso = makeBox(torsoSize, torsoPos, 6, mat);
  const head = makeBox(headSize, headPos, 1.5, mat);
  const lArm = makeBox(armSize, lArmPos, 1.2, mat);
  const rArm = makeBox(armSize, rArmPos, 1.2, mat);
  const lLeg = makeBox(legSize, lLegPos, 2.5, mat);
  const rLeg = makeBox(legSize, rLegPos, 2.5, mat);

  const bodies = { pelvis, torso, head, lArm, rArm, lLeg, rLeg };
  Object.values(bodies).forEach(b => world.addBody(b));

  const constraints: CANNON.Constraint[] = [];

  function addConstraint(
    bA: CANNON.Body, bB: CANNON.Body,
    pivotA: CANNON.Vec3, pivotB: CANNON.Vec3,
    axisA: CANNON.Vec3, axisB: CANNON.Vec3,
    maxAngle = Math.PI / 3
  ) {
    const c = new CANNON.ConeTwistConstraint(bA, bB, {
      pivotA, pivotB, axisA, axisB,
      maxForce: 1e6,
      collideConnected: false,
    });
    // @ts-ignore - max angle tuning for stability
    c.angle = maxAngle;
    // @ts-ignore
    c.twistAngle = maxAngle;
    world.addConstraint(c);
    constraints.push(c);
    return c;
  }

  // Spine
  addConstraint(pelvis, torso,
    new CANNON.Vec3(0, 0.09, 0), new CANNON.Vec3(0, -0.21, 0),
    new CANNON.Vec3(0, 1, 0), new CANNON.Vec3(0, 1, 0),
    Math.PI / 8);

  // Neck
  addConstraint(torso, head,
    new CANNON.Vec3(0, 0.21, 0), new CANNON.Vec3(0, -0.12, 0),
    new CANNON.Vec3(0, 1, 0), new CANNON.Vec3(0, 1, 0),
    Math.PI / 4);

  // Shoulders
  addConstraint(torso, lArm,
    new CANNON.Vec3(0.19, 0.15, 0), new CANNON.Vec3(0, 0.21, 0),
    new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(0, -1, 0),
    Math.PI / 2.2);
  addConstraint(torso, rArm,
    new CANNON.Vec3(-0.19, 0.15, 0), new CANNON.Vec3(0, 0.21, 0),
    new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(0, -1, 0),
    Math.PI / 2.2);

  // Hips
  addConstraint(pelvis, lLeg,
    new CANNON.Vec3(0.11, -0.09, 0), new CANNON.Vec3(0, 0.26, 0),
    new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(0, -1, 0),
    Math.PI / 3);
  addConstraint(pelvis, rLeg,
    new CANNON.Vec3(-0.11, -0.09, 0), new CANNON.Vec3(0, 0.26, 0),
    new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(0, -1, 0),
    Math.PI / 3);

  const pelvisMesh = makeMesh(...pelvisSize, skinColor);
  const torsoMesh = makeMesh(...torsoSize, torsoColor);
  const headMesh = makeMesh(...headSize, skinColor);
  const lArmMesh = makeMesh(...armSize, skinColor);
  const rArmMesh = makeMesh(...armSize, skinColor);
  const lLegMesh = makeMesh(...legSize, 0x303040);
  const rLegMesh = makeMesh(...legSize, 0x303040);

  const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.05, 0.03, 0.12);
  eyeR.position.set(0.05, 0.03, 0.12);
  headMesh.add(eyeL, eyeR);

  const meshes = [pelvisMesh, torsoMesh, headMesh, lArmMesh, rArmMesh, lLegMesh, rLegMesh];
  meshes.forEach(m => scene.add(m));

  const parts: Record<PartName, RagdollPart> = {
    pelvis: { name: 'pelvis', body: pelvis, mesh: pelvisMesh, damageMultiplier: 1.0, health: 100, maxHealth: 100 },
    torso:  { name: 'torso',  body: torso,  mesh: torsoMesh,  damageMultiplier: 1.0, health: 100, maxHealth: 100 },
    head:   { name: 'head',   body: head,   mesh: headMesh,   damageMultiplier: 2.5, health: 100, maxHealth: 100 },
    lArm:   { name: 'lArm',   body: lArm,   mesh: lArmMesh,   damageMultiplier: 0.5, health: 100, maxHealth: 100 },
    rArm:   { name: 'rArm',   body: rArm,   mesh: rArmMesh,   damageMultiplier: 0.5, health: 100, maxHealth: 100 },
    lLeg:   { name: 'lLeg',   body: lLeg,   mesh: lLegMesh,   damageMultiplier: 0.6, health: 100, maxHealth: 100 },
    rLeg:   { name: 'rLeg',   body: rLeg,   mesh: rLegMesh,   damageMultiplier: 0.6, health: 100, maxHealth: 100 },
  };

  return {
    parts,
    bodies: [pelvis, torso, head, lArm, rArm, lLeg, rLeg],
    constraints,
    meshes,
    ownerId: id,
    alive: true,
    hitFlash: 0,
  };
}

export function syncRagdollMeshes(r: Ragdoll) {
  for (const key in r.parts) {
    const p = r.parts[key as PartName];
    p.mesh.position.copy(p.body.position as any);
    p.mesh.quaternion.copy(p.body.quaternion as any);
  }
}
