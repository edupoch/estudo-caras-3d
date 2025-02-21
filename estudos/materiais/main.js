import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";

import { WireframeShader } from "./WireframeShader";
import { CustomShader } from "./CustomShader";

// Modelo de cara
import modeloGLB from "../../modelos/First_Face_Scan.glb";

let camera, scene, renderer;
let modelo;
let conWireframe = false;

const ESCALA = 5;
const ROTACION = Math.PI / 2.5;
const SALTO_POS = 2.2;

init();

function setupAttributes(geometry) {
  const vectors = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
  ];

  const position = geometry.attributes.position;
  const centers = new Float32Array(position.count * 3);

  for (let i = 0, l = position.count; i < l; i++) {
    vectors[i % 3].toArray(centers, i * 3);
  }

  geometry.setAttribute("center", new THREE.BufferAttribute(centers, 3));
}

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
    modelo.rotation.y = ROTACION;
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
    line.scale.set(ESCALA, ESCALA, ESCALA);
    line.rotation.y = ROTACION;
    line.position.x = SALTO_POS;
    line.position.y = 0;
    scene.add(line);

    // Puntos
    const positions = meshGeometry.attributes.position.array;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    const material = new THREE.PointsMaterial({
      size: 0.01,
      color: 0x000000,
    });

    const pointCloud = new THREE.Points(geometry, material);

    pointCloud.scale.set(ESCALA, ESCALA, ESCALA);
    pointCloud.rotation.y = ROTACION;
    pointCloud.position.x = -SALTO_POS;
    scene.add(pointCloud);

    // WireframeShader
    const wireframeGeometry = meshGeometry.clone();
    wireframeGeometry.deleteAttribute("normal");
    wireframeGeometry.deleteAttribute("uv");
    setupAttributes(wireframeGeometry);

    const wireframeShader = WireframeShader;

    const wireframeMaterial = new THREE.ShaderMaterial({
      uniforms: { thickness: { value: 1 } },
      vertexShader: wireframeShader.vertexShader,
      fragmentShader: wireframeShader.fragmentShader,
      side: THREE.DoubleSide,
      alphaToCoverage: true, // only works when WebGLRenderer's "antialias" is set to "true"
    });

    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframeMesh.scale.set(ESCALA, ESCALA, ESCALA);
    wireframeMesh.rotation.y = ROTACION;
    wireframeMesh.position.y = SALTO_POS;

    scene.add(wireframeMesh);

    // customShader
    const customGeometry = meshGeometry.clone();
    customGeometry.deleteAttribute("normal");
    customGeometry.deleteAttribute("uv");
    setupAttributes(customGeometry);

    const customShader = CustomShader;

    const customMaterial = new THREE.ShaderMaterial({
      uniforms: { thickness: { value: 1 } },
      vertexShader: customShader.vertexShader,
      fragmentShader: customShader.fragmentShader,
      side: THREE.DoubleSide,
      alphaToCoverage: true, // only works when WebGLRenderer's "antialias" is set to "true"
    });

    const customMesh = new THREE.Mesh(customGeometry, customMaterial);
    customMesh.scale.set(ESCALA, ESCALA, ESCALA);
    customMesh.rotation.y = ROTACION;
    customMesh.position.y = SALTO_POS;
    customMesh.position.x = SALTO_POS;

    scene.add(customMesh);
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
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  render();
}
