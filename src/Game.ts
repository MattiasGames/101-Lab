import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { FPSController } from './player/FPSController';
import { WeaponSlots } from './player/WeaponSlots';
import { Interaction } from './player/Interaction';
import { WeaponHandler } from './weapons/WeaponHandler';
import { RagdollManager } from './ragdoll/RagdollManager';
import { buildMap } from './world/Map';
import { StartMenu } from './ui/StartMenu';
import { initHUD, refreshHUD } from './ui/HUD';

export class Game {
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  phys!: PhysicsWorld;
  fps!: FPSController;
  slots!: WeaponSlots;
  ragdolls!: RagdollManager;
  weapons!: WeaponHandler;
  interaction!: Interaction;
  clock = new THREE.Clock();
  started = false;
  paused = false;

  start() {
    console.log("Game starting...");
    
    try {
      const canvas = document.getElementById('app') as HTMLCanvasElement;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 500);

      this.phys = new PhysicsWorld();
      buildMap(this.scene, this.phys);

      this.slots = new WeaponSlots();
      this.ragdolls = new RagdollManager(this.phys, this.scene);
      this.weapons = new WeaponHandler(this.phys, this.ragdolls);
      this.fps = new FPSController(this.camera, this.phys);
      this.interaction = new Interaction(this.phys, this.ragdolls, this.slots, this.weapons, this.fps);

      this.ragdolls.spawn(new CANNON.Vec3(0, 2, -3));

      console.log("Initializing Menu...");
      new StartMenu(this.slots, () => {
        console.log("Start button clicked!");
        this.started = true;
        
        const menu = document.getElementById('menu');
        if (menu) menu.style.display = 'none';
        
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'block';
        
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';
        
        initHUD(this.slots);
        refreshHUD();
        
        document.body.requestPointerLock();
      });

      this.bindEvents();

      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });

      this.loop();
      console.log("Game started successfully.");
    } catch (error) {
      console.error("CRITICAL ERROR during startup:", error);
      alert("Game crashed! Check the console (F12) or look at the error in the code.");
    }
  }

  bindEvents() {
    document.addEventListener('pointerlockchange', () => {
      const pauseEl = document.getElementById('pause')!;
      if (document.pointerLockElement) {
        pauseEl.classList.remove('show');
        this.paused = false;
      } else if (this.started) {
        pauseEl.classList.add('show');
        this.paused = true;
      }
    });

    document.getElementById('pause')!.addEventListener('click', () => {
      document.body.requestPointerLock();
    });

    window.addEventListener('mousedown', e => {
      if (!document.pointerLockElement) return;
      if (e.button === 0) this.interaction.onLeftDown();
      if (e.button === 2) this.interaction.onRightDown();
    });
    
    window.addEventListener('mouseup', e => {
      if (e.button === 2) this.interaction.onRightUp();
    });
    window.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', e => {
      if (!this.started || this.paused) return;
      const digit = e.code.match(/^Digit([1-9])$/);
      if (digit) {
        const n = parseInt(digit[1]) - 1;
        this.slots.select(n);
        refreshHUD();
      }
    });
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.started && !this.paused) {
      this.phys.step(dt);
      this.fps.update(dt);
      this.interaction.update();
      this.ragdolls.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
  };
}
