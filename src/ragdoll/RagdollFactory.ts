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
}

export interface Ragdoll {
  parts: Record<PartName, RagdollPart>;
  bodies: CANNON.Body[];
  constraints: CANNON.Constraint[];
  meshes: THREE.Mesh[];
  alive: boolean;
}

function makeBox(size: [number, number, number], pos: CANNON.Vec3, mass: number, material: CANNON.Material): CANNON.Body {
  const body = new CANNON.Body({
    mass,
    shape: new CANNON.Box(new CANNON.Vec3(size[0]/2, size[1]/2, size[2]/2)),
    position: pos,
    material,
    linearDamping: 0.1,
    angularDamping: 0.5,
  });
  return body;
}

function makeMesh(w: number, h: number, d: number, color: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

export function createRagdoll(phys: PhysicsWorld, scene: THREE.Scene, origin: CANNON.Vec3): Ragdoll {
  const mat = phys.ragdollMaterial;
  const world = phys.world;

  const pelvisSize: [number, number, number] = [0.3, 0.2, 0.2];
  const torsoSize: [number, number, number] = [0.4, 0.4, 0.2];
  const headSize: [number, number, number] = [0.2, 0.2, 0.2];
  const armSize: [number, number, number] = [0.1, 0.4, 0.1];
  const legSize: [number, number, number] = [0.15, 0.5, 0.15];

  const pelvisPos = origin.clone();
  const torsoPos = origin.clone().vadd(new CANNON.Vec3(0, 0.3, 0));
  const headPos = origin.clone().vadd(new CANNON.Vec3(0, 0.6, 0));
  const lArmPos = origin.clone().vadd(new CANNON.Vec3(0.25, 0.3, 0));
  const rArmPos = origin.clone().vadd(new CANNON.Vec3(-0.25, 0.3, 0));
  const lLegPos = origin.clone().vadd(new CANNON.Vec3(0.1, -0.35, 0));
  const rLegPos = origin.clone().vadd(new CANNON.Vec3(-0.1, -0.35, 0));

  const pelvis = makeBox(pelvisSize, pelvisPos, 5, mat);
  const torso = makeBox(torsoSize, torsoPos, 5, mat);
  const head = makeBox(headSize, headPos, 2, mat);
  const lArm = makeBox(armSize, lArmPos, 1, mat);
  const rArm = makeBox(armSize, rArmPos, 1, mat);
  const lLeg = makeBox(legSize, lLegPos, 2, mat);
  const rLeg = makeBox(legSize, rLegPos, 2, mat);

  const bodies = [pelvis, torso, head, lArm, rArm, lLeg, rLeg];
  bodies.forEach(b => world.addBody(b));

  const constraints: CANNON.Constraint[] = [];
  function addJoint(b1: CANNON.Body, b2: CANNON.Body, p1: CANNON.Vec3, p2: CANNON.Vec3) {
    const c = new CANNON.PointToPointConstraint(b1, p1, b2, p2, 1e6);
    world.addConstraint(c);
    constraints.push(c);
  }

  addJoint(pelvis, torso, new CANNON.Vec3(0, 0.1, 0), new CANNON.Vec3(0, -0.2, 0));
  addJoint(torso, head, new CANNON.Vec3(0, 0.2, 0), new CANNON.Vec3(0, -0.1, 0));
  addJoint(torso, lArm, new CANNON.Vec3(0.2, 0.15, 0), new CANNON.Vec3(0, 0.2, 0));
  addJoint(torso, rArm, new CANNON.Vec3(-0.2, 0.15, 0), new CANNON.Vec3(0, 0.2, 0));
  addJoint(pelvis, lLeg, new CANNON.Vec3(0.1, -0.1, 0), new CANNON.Vec3(0, 0.25, 0));
  addJoint(pelvis, rLeg, new CANNON.Vec3(-0.1, -0.1, 0), new CANNON.Vec3(0, 0.25, 0));

  const pelvisMesh = makeMesh(...pelvisSize, 0x4060a0);
  const torsoMesh = makeMesh(...torsoSize, 0xd9a86a);
  const headMesh = makeMesh(...headSize, 0xd9a86a);
  const lArmMesh = makeMesh(...armSize, 0xd9a86a);
  const rArmMesh = makeMesh(...armSize, 0xd9a86a);
  const lLegMesh = makeMesh(...legSize, 0x303040);
  const rLegMesh = makeMesh(...legSize, 0x303040);

  const meshes = [pelvisMesh, torsoMesh, headMesh, lArmMesh, rArmMesh, lLegMesh, rLegMesh];
  meshes.forEach(m => scene.add(m));

  const parts: Record<PartName, RagdollPart> = {
    pelvis: { name: 'pelvis', body: pelvis, mesh: pelvisMesh, damageMultiplier: 1.0, health: 100 },
    torso:  { name: 'torso',  body: torso,  mesh: torsoMesh,  damageMultiplier: 1.0, health: 100 },
    head:   { name: 'head',   body: head,   mesh: headMesh,   damageMultiplier: 2.5, health: 100 },
    lArm:   { name: 'lArm',   body: lArm,   mesh: lArmMesh,   damageMultiplier: 0.5, health: 100 },
    rArm:   { name: 'rArm',   body: rArm,   mesh: rArmMesh,   damageMultiplier: 0.5, health: 100 },
    lLeg:   { name: 'lLeg',   body: lLeg,   mesh: lLegMesh,   damageMultiplier: 0.6, health: 100 },
    rLeg:   { name: 'rLeg',   body: rLeg,   mesh: rLegMesh,   damageMultiplier: 0.6, health: 100 },
  };

  return { parts, bodies, constraints, meshes, alive: true };
}

export function syncRagdollMeshes(r: Ragdoll) {
  for (const key in r.parts) {
    const p = r.parts[key as PartName];
    p.mesh.position.copy(p.body.position as any);
    p.mesh.quaternion.copy(p.body.quaternion as any);
  }
}
