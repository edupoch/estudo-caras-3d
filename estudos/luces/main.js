import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import modeloGLB from "../../modelos/First_Face_Scan.glb";

let camera, scene, renderer, bulbLight, bulbMat, hemiLight, stats;
let ballMat, cubeMat, floorMat;

let previousShadowMap = false;

// ref for lumens: http://www.power-sure.com/lumens.htm
const bulbLuminousPowers = {
  "110000 lm (1000W)": 110000,
  "3500 lm (300W)": 3500,
  "1700 lm (100W)": 1700,
  "800 lm (60W)": 800,
  "400 lm (40W)": 400,
  "180 lm (25W)": 180,
  "20 lm (4W)": 20,
  Off: 0,
};

// ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
const hemiLuminousIrradiances = {
  "0.0001 lx (Moonless Night)": 0.0001,
  "0.002 lx (Night Airglow)": 0.002,
  "0.5 lx (Full Moon)": 0.5,
  "3.4 lx (City Twilight)": 3.4,
  "50 lx (Living Room)": 50,
  "100 lx (Very Overcast)": 100,
  "350 lx (Office Room)": 350,
  "400 lx (Sunrise/Sunset)": 400,
  "1000 lx (Overcast)": 1000,
  "18000 lx (Daylight)": 18000,
  "50000 lx (Direct Sun)": 50000,
};

const params = {
  shadows: true,
  exposure: 0.68,
  bulbPower: Object.keys(bulbLuminousPowers)[4],
  hemiIrradiance: Object.keys(hemiLuminousIrradiances)[0],
};

init();

function init() {
  const container = document.getElementById("container");

  stats = new Stats();
  container.appendChild(stats.dom);

  //

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.x = -4;
  camera.position.z = 4;
  camera.position.y = 2;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8);
  bulbLight = new THREE.PointLight(0xffee88, 1, 100, 2);

  bulbMat = new THREE.MeshStandardMaterial({
    emissive: 0xffffee,
    emissiveIntensity: 1,
    color: 0x000000,
  });
  bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
  bulbLight.position.set(0, 2, 0);
  bulbLight.castShadow = true;
  scene.add(bulbLight);

  hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.02);
  scene.add(hemiLight);

  cubeMat = new THREE.MeshStandardMaterial({
    roughness: 0.7,
    color: 0xffffff,
    bumpScale: 1,
    metalness: 0.2,
  });

  const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const boxMesh = new THREE.Mesh(boxGeometry, cubeMat);
  boxMesh.position.set(-0.5, 0.25, -1);
  boxMesh.castShadow = true;
  scene.add(boxMesh);

  const loader = new GLTFLoader();
  loader.load(modeloGLB, function (gltf) {
    const modelo = gltf.scene;

    modelo.scale.set(5, 5, 5);
    modelo.rotation.y = Math.PI / 2.5;
    modelo.position.set(1.5, 0.25, 0);
    scene.add(modelo);

    const mesh = modelo.children[0];
    const meshGeometry = mesh.geometry;

    // const bufferGeometry = new THREE.BufferGeometry();
    // bufferGeometry.setAttribute(
    //   "position",
    //   new THREE.BufferAttribute(mesh.geometry.attributes.position.array, 3)
    // );

    // const m = new THREE.Mesh(meshGeometry, cubeMat);
    const m = mesh.clone();
    console.log(m);

    const meshmaterial = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      color: 0xffffff,
      bumpScale: 1,
      metalness: 0.2,
    });
    meshmaterial.flatShading = true;

    m.material = meshmaterial;

    m.scale.set(5, 5, 5);
    m.rotation.y = Math.PI / 2.5;
    m.position.set(-0.75, 0.25, 0);
    m.castShadow = true;

    scene.add(m);
  });

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 20;

  window.addEventListener("resize", onWindowResize);

  //

  const gui = new GUI();

  gui.add(params, "hemiIrradiance", Object.keys(hemiLuminousIrradiances));
  gui.add(params, "bulbPower", Object.keys(bulbLuminousPowers));
  gui.add(params, "exposure", 0, 1);
  gui.add(params, "shadows");
  gui.open();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  renderer.toneMappingExposure = Math.pow(params.exposure, 5.0); // to allow for very bright scenes.
  renderer.shadowMap.enabled = params.shadows;
  bulbLight.castShadow = params.shadows;

  if (params.shadows !== previousShadowMap) {
    cubeMat.needsUpdate = true;
    previousShadowMap = params.shadows;
  }

  bulbLight.power = bulbLuminousPowers[params.bulbPower];

  hemiLight.intensity = hemiLuminousIrradiances[params.hemiIrradiance];
  const time = Date.now() * 0.0005;

  bulbLight.position.y = Math.cos(time) * 0.75 + 1.25;

  renderer.render(scene, camera);

  stats.update();
}
