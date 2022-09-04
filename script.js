import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as dat from 'lil-gui'
import gsap from 'gsap';
import { html, css, LitElement } from 'lit';

const conceptCarInit = (canvas) => {
  /**
   * Base
   */
  // Debug
  const gui = new dat.GUI()

  /**
   * Sizes
   */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({
      canvas: canvas
  })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // envmap
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  const environmentMap = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;

  // Scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color( 0xd9dfe0 );
  scene.environmentMap = environmentMap;

  // apply envmap to all materials
  const updateAllMaterials = () => {
    scene.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.envMap = environmentMap;
        child.material.envMapIntensity = 1.9;
      }
    })
  }

  /**
   * Modals
   */
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three/examples/js/libs/draco/');

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  /**
   * Radar
   */
  const radarParams = {
    color: 0x28cc51,
    scale: 2
  };
  const radar = new THREE.Mesh(
    new THREE.CircleGeometry(1, 50),
    new THREE.MeshBasicMaterial({
      color: radarParams.color,
      wireframe: false
    })
  );
  radar.visible = false
  radar.rotation.x = Math.PI * -0.5;
  radar.scale.set(radarParams.scale, radarParams.scale, radarParams.scale);
  const radarFolder = gui.addFolder('Radar')
  radarFolder.add(radar, 'visible');
  radarFolder.add(radar.material, 'wireframe');
  radarFolder.addColor(radarParams, 'color').onChange(() => {
    radar.material.color.set(radarParams.color)
  });
  radarFolder.add(radarParams, 'scale').min(0).max(10).onChange(() => {
    radar.scale.set(radarParams.scale, radarParams.scale, radarParams.scale);
  });
  scene.add(radar);

  /**
   * Floor
   */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
  )
  floor.receiveShadow = true
  floor.rotation.x = - Math.PI * 0.5
  // scene.add(floor)

  window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })

  /**
   * Camera
   */
  // Base camera
  const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 100)
  camera.position.set(2, 2, 2)
  scene.add(camera)
  window.camera = camera;

  // Controls
  const controls = new OrbitControls(camera, canvas)
  // controls.enabled = false;
  // controls.target.set(0, 0, 0);
  // controls.enableDamping = true
  // controls.enableZoom = false;
  // controls.enablePan = true;
  // controls.panSpeed = .05;
  // controls.enableRotate = true;
  // controls.autoRotateSpeed = .5;
  // controls.autoRotate = true;
  // controls.maxDistance = 2;
  // controls.minDistance = 1;
  // controls.minPolarAngle = Math.PI / 3.5;
  // controls.maxPolarAngle = Math.PI / 2.1;
  // controls.minAzimuthAngle = Math.PI / 4;
  // controls.maxAzimuthAngle = Math.PI / 1.5;


  /**
   * Animate
   */
  const clock = new THREE.Clock()
  let previousTime = 0

  document.addEventListener('mousemove', onDocumentMouseMove );
  document.addEventListener('mouseout', onDocumentMouseOut );

  let mouseX = 0;
  let mouseY = 0;
  let mouseXNormalized = 0;
  let mouseYNormalized = 0;

  const options = {
    autoRotateDampening: .001,
  }

  function onDocumentMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    mouseXNormalized = ( mouseX - sizes.width / 2 );
    mouseYNormalized = ( mouseY - sizes.height / 2 );
  }

  function onDocumentMouseOut(event) {
    mouseX = 0;
    controls.autoRotateSpeed = .5;
  }

  const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    controls.autoRotateSpeed = mouseXNormalized * options.autoRotateDampening;
    // camera.position.y += mouseYNormalized * 0.000005;
    // camera.position.z += mouseYNormalized * -0.000005;

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
  }

  class Movie {
    constructor() {
      this.scene;
      this.scenes = ['intro', 'overhead', 'inside'];
      this.init();
      this._initialized = false;
      this._activeTL;
    }

    init() {
      // load model
      if (true) {
        gltfLoader.load('./models/Car/gltf-heavy-compression/scene.gltf', (gltf) => {
          gltf.scene.scale.set(0.005, 0.005, 0.005);
          scene.add(gltf.scene);
          updateAllMaterials();
          this._initialized = true;
          this.nextScene();
        });
      }
      else {
        this._initialized = true;
        this.nextScene('intro');
      }
    }

    nextScene(scene = null) {
      // if the user specified the
      if (scene) {
        if (this.scenes.includes(scene)) {
          this.scene = scene;
        }
        else {
          this.console.warn('There is no scene with that name available.')
        }
      }
      else if (!this.scene) {
        this.scene = 'intro';
      }
      else {
        // if there is a next item
        const nextIndex = this.scenes.findIndex(i => i === this.scene) + 1;
        if (this.scenes.length > nextIndex) {
          this.scene = this.scenes[nextIndex];
          console.log(this.scene);
        }
        // if not, go to the begining
        else {
          this.scene = 'intro';
        }
      }
      this.update();
    }

    update() {
      this._activeTL?.kill();

      if (this.scene === 'intro') {
        this._activeTL = gsap.timeline();
        this._activeTL
          .to(camera.position, {
            x: 2,
            y: 1,
            z: 0,
            duration: 4,
            ease: 'power2.out',
            onended: () => {
              controls.autoRotate = true
            }
          })
      }
      else if (this.scene === 'overhead') {
        controls.autoRotate = false
        this._activeTL = gsap.timeline();
        this._activeTL 
          .to(camera.position, {
            x: 0.1,
            y: 2 + ((1 / sizes.width) * 1000),
            z: 0,
            duration: 2,
            ease: 'power2.out',
            onended: () => {
              controls.autoRotate = false
              radar.visible = true
            },
          })
      }
    }
  }
  tick()
  return {
    scene,
    camera,
    movie: new Movie()
  };
}

class RhConceptCar extends LitElement {
  static styles = css`
    [part=base] {
      display: block;
      position: relative;
    }

    [part*=section] {
      position: absolute;
      top: 0;
    }
  `;

  constructor() {
    super();
    this._instance = null;
  }

  firstUpdated() {
    const canvas = this.renderRoot.querySelector('canvas');
    this._instance = conceptCarInit(canvas);
  }

  render() {
    return html`
      <div part="base">
        <canvas part="canvas"></canvas>
        <div part="overhead section">
          <button @click=${this._changeScene.bind(this)} data-scene="intro">intro</button>
          <button @click=${this._changeScene.bind(this)} data-scene="overhead">overhead</button>
        </div>
      </div>`
  }

  _changeScene(e) {
    this._instance.movie.nextScene(e.target?.dataset?.scene);
  }
}

customElements.define('rh-concept-car', RhConceptCar);
