import * as THREE from "three";

import { uniform, skinning } from "three/tsl";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { VertexTangentsHelper } from "three/addons/helpers/VertexTangentsHelper.js";
import { GUI } from "dat.gui";

// Modelo de cara
import modeloGLB from "../../modelos/First_Face_Scan.glb";

let camera, scene, renderer;
let modelo;
let conWireframe = false;

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
  camera.position.set(0, 0, 3.5);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  // scene.background = new THREE.Color(0x000000);

  const loader = new GLTFLoader();
  loader.load(modeloGLB, function (gltf) {
    modelo = gltf.scene;
    modelo.traverse((child) => {
      if (child.isMesh) {
        child.material.wireframe = conWireframe;
      }
    });

    modelo.scale.set(5, 5, 5);
    modelo.rotation.y = Math.PI / 2.5;
    modelo.position.x = 0;
    scene.add(modelo);

    const mesh = modelo.children[0];
    const meshGeometry = mesh.geometry;

    // Wireframe
    const wireframe = new THREE.WireframeGeometry(meshGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
    });
    let line = new THREE.LineSegments(wireframe, lineMaterial);
    line.scale.set(5, 5, 5);
    line.rotation.y = Math.PI / 2.5;
    line.position.x = 2;
    scene.add(line);

    // Puntos
    const positions = meshGeometry.attributes.position.array;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    const material = new THREE.PointsMaterial({ size: 0.01, color: 0x000000 });

    const pointCloud = new THREE.Points(geometry, material);

    pointCloud.scale.set(5, 5, 5);
    pointCloud.rotation.y = Math.PI / 2.5;
    pointCloud.position.x = -2.2;
    scene.add(pointCloud);
  });

  let ambientLight = new THREE.AmbientLight(0x323232, 100);
  scene.add(ambientLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Melloramos o tono da foto
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

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
      modelo.traverse(function (child) {
        if (child.isMesh) {
          child.material.wireframe = value;
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
