import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";

import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { HalftonePass } from "three/examples/jsm/Addons.js";
import { OutputPass } from "three/examples/jsm/Addons.js";
import { LuminosityShader } from "three/addons/shaders/LuminosityShader.js";
import { SobelOperatorShader } from "three/addons/shaders/SobelOperatorShader.js";

// Modelo de cara
import modeloGLB from "../../modelos/First_Face_Scan.glb";

let camera, scene, renderer, composer;
let modelo;

let halftonePassEnabled = true;
let sobelEnabled = false;

const ESCALA = 5;
const ROTACION = Math.PI / 2.5;
const SALTO_POS = 2.2;

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
  camera.position.set(0, 0, 2.5);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const loader = new GLTFLoader();
  loader.load(modeloGLB, function (gltf) {
    modelo = gltf.scene;

    modelo.scale.set(5, 5, 5);
    modelo.rotation.y = ROTACION;
    modelo.position.x = 0;
    scene.add(modelo);
  });

  let ambientLight = new THREE.AmbientLight(0x323232, 100);
  scene.add(ambientLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Melloramos o tono da foto
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // renderer.toneMappingExposure = 1;

  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const halftonePass = new HalftonePass(window.innerWidth, window.innerHeight, {
    radius: 10,
    greyscale: true,
  });
  halftonePass.enabled = halftonePassEnabled;
  composer.addPass(halftonePass);

  const sobelShader = SobelOperatorShader;
  // Coloreamos os bordes en negro sobre fondo branco
  sobelShader.fragmentShader = sobelShader.fragmentShader.replace(
    "gl_FragColor = vec4( vec3( G ), 1 );",
    `if (G > 0.8)
      gl_FragColor = vec4(0, 0, 0, 1);
    else
      gl_FragColor = vec4(1, 1, 1, 1);`
  );

  const effectSobel = new ShaderPass(sobelShader);
  effectSobel.uniforms["resolution"].value.x =
    window.innerWidth * window.devicePixelRatio;
  effectSobel.uniforms["resolution"].value.y =
    window.innerHeight * window.devicePixelRatio;

  effectSobel.enabled = sobelEnabled;
  composer.addPass(effectSobel);

  composer.addPass(new OutputPass());

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render); // use if there is no animation loop
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.target.set(0, 0, -0.2);
  controls.update();

  let gui = new GUI();
  gui
    .add({ halftonePassEnabled: halftonePassEnabled }, "halftonePassEnabled")
    .name("Semitonos")
    .onChange(function (value) {
      halftonePassEnabled = value;
      composer.passes[1].enabled =
        composer.passes[1].enabled === true ? false : true;
    });

  gui
    .add({ sobelEnabled: sobelEnabled }, "sobelEnabled")
    .name("Bordes")
    .onChange(function (value) {
      sobelEnabled = value;
      composer.passes[2].enabled =
        composer.passes[2].enabled === true ? false : true;
    });

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  // renderer.render(scene, camera);
  composer.render();
}

function animate() {
  render();
}
