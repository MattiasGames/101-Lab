import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  world: CANNON.World;
  ragdollMaterial: CANNON.Material;
  environmentMaterial: CANNON.Material;

  constructor() {
    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    (this.world.solver as CANNON.GSSolver).iterations = 12;
    this.world.allowSleep = true;
    this.world.defaultContactMaterial.friction = 0.4;
    this.world.defaultContactMaterial.restitution = 0.1;

    this.ragdollMaterial = new CANNON.Material('ragdoll');
    this.environmentMaterial = new CANNON.Material('env');
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.ragdollMaterial, this.environmentMaterial,
      { friction: 0.5, restitution: 0.05 }
    ));
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.ragdollMaterial, this.ragdollMaterial,
      { friction: 0.4, restitution: 0.05 }
    ));
  }

  step(dt: number) {
    this.world.step(1 / 60, dt, 3);
  }
}
