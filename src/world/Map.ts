import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export function buildMap(scene: THREE.Scene, phys: PhysicsWorld) {
  // Lights
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x202028, 0.9);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(20, 30, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -40;
  dir.shadow.camera.right = 40;
  dir.shadow.camera.top = 40;
  dir.shadow.camera.bottom = -40;
  scene.add(dir);

  scene.background = new THREE.Color(0x0a0f14);
  scene.fog = new THREE.Fog(0x0a0f14, 40, 90);

  const boxSize = 40;
  const wallHeight = 8;

  // Floor
  const floorGeo = new THREE.BoxGeometry(boxSize, 0.5, boxSize);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.9 });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(0, -0.25, 0);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(boxSize / 2, 0.25, boxSize / 2)),
    position: new CANNON.Vec3(0, -0.25, 0),
    material: phys.environmentMaterial,
  });
  phys.world.addBody(floorBody);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.85 });
  const addWall = (x: number, z: number, w: number, d: number) => {
    const geo = new THREE.BoxGeometry(w, wallHeight, d);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(x, wallHeight / 2, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, wallHeight / 2, d / 2)),
      position: new CANNON.Vec3(x, wallHeight / 2, z),
      material: phys.environmentMaterial,
    });
    phys.world.addBody(body);
  };
  const half = boxSize / 2;
  addWall(0, -half, boxSize, 0.6);
  addWall(0,  half, boxSize, 0.6);
  addWall(-half, 0, 0.6, boxSize);
  addWall( half, 0, 0.6, boxSize);

  // A few pillars for interest
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a5068, roughness: 0.6 });
  const pillarPositions = [
    [-10, -10], [10, -10], [-10, 10], [10, 10], [0, 0]
  ];
  for (const [x, z] of pillarPositions) {
    const size = 1.2;
    const geo = new THREE.BoxGeometry(size, 5, size);
    const mesh = new THREE.Mesh(geo, pillarMat);
    mesh.position.set(x, 2.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(size / 2, 2.5, size / 2)),
      position: new CANNON.Vec3(x, 2.5, z),
      material: phys.environmentMaterial,
    });
    phys.world.addBody(body);
  }
}
