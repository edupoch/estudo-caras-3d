import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";

// Modelo de cara
import modeloGLB from "../../modelos/First_Face_Scan.glb";

let camera, scene, renderer;
let conWireframe = false;
let conTextura = true;

init();

function init() {
  const container = document.getElementById("container");
  container.innerHTML = "";

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.25,
    20
  );
  camera.position.set(0, 0, 1.5);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const loader = new GLTFLoader();
  loader.load(modeloGLB, function (gltf) {
    const modelo = gltf.scene;
    modelo.traverse((o) => {
      if (o.isMesh) {
        o.material.metalness = !conTextura;
        o.material.wireframe = conWireframe;
      }
    });
    modelo.scale.set(5, 5, 5);
    modelo.rotation.y = Math.PI / 2.5;
    scene.add(modelo);
  });

  let ambientLight = new THREE.AmbientLight(0x323232, 100);
  scene.add(ambientLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //   renderer.toneMapping = THREE.ACESFilmicToneMapping;
  //   renderer.toneMappingExposure = 1;
  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render); // use if there is no animation loop
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.target.set(0, 0, -0.2);
  controls.update();

  let gui = new GUI();
  gui
    .add({ wireframe: conWireframe }, "wireframe")
    .name("Con wireframe")
    .onChange(function (value) {
      conWireframe = value;
      scene.traverse(function (child) {
        if (child.isMesh) {
          child.material.wireframe = value;
        }
      });
    });
  gui
    .add({ metalness: conTextura }, "metalness")
    .name("Con textura")
    .onChange(function (value) {
      conTextura = !value;
      scene.traverse(function (child) {
        if (child.isMesh) {
          child.material.metalness = conTextura;
        }
      });
    });

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  render();
}
