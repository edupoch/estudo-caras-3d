import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";
import { ToonShaderDotted } from "three/examples/jsm/Addons.js";

import { WireframeShader } from "./WireframeShader";
import { CustomShader } from "./CustomShader";

// Modelo de cara
import modeloGLB from "../../modelos/First_Face_Scan.glb";

let camera, escenaMateriales, escenaModeloAislado, renderer;
let modelo;
let conWireframe = false;

let ambientLight, pointLight;

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

  // Definimos 2 escenas para que la luz de los materiales no afecte al modelo

  escenaMateriales = new THREE.Scene();
  escenaMateriales.background = new THREE.Color(0xffffff);
  escenaModeloAislado = new THREE.Scene();

  ambientLight = new THREE.AmbientLight(0x323232, 100);
  escenaMateriales.add(ambientLight);
  escenaModeloAislado.add(ambientLight);

  pointLight = new THREE.PointLight(0xffffff, 50);
  pointLight.position.set(0, SALTO_POS, 3);
  const bulbMat = new THREE.MeshStandardMaterial({
    emissive: 0xffffee,
    emissiveIntensity: 1,
    color: 0xff0000,
  });
  // Debug de posición de la luz
  const bulbGeometry = new THREE.SphereGeometry(0.2, 16, 8);
  pointLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
  escenaMateriales.add(pointLight);

  const pointLightModelo = new THREE.PointLight(0xffffff, 10);
  pointLightModelo.position.set(0, 0, 5);

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

    escenaModeloAislado.add(modelo);

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
    escenaMateriales.add(line);

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
    escenaMateriales.add(pointCloud);

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
    wireframeMesh.position.y = -SALTO_POS;

    escenaMateriales.add(wireframeMesh);

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

    escenaMateriales.add(customMesh);

    // MeshStandardMaterial  - Material sin brillo
    const meshStandardGeometry = meshGeometry.clone();
    // Calcula las normales de las caras para que se pueda iluminar correctamente
    meshStandardGeometry.computeVertexNormals();
    const meshStandardMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      color: 0x2f2f2f,
      bumpScale: 1,
      metalness: 0.2,
    });
    // Definimos un sombreado plano
    // meshStandardMaterial.flatShading = true;

    const standardMesh = new THREE.Mesh(
      meshStandardGeometry,
      meshStandardMaterial
    );
    standardMesh.scale.set(ESCALA, ESCALA, ESCALA);
    standardMesh.rotation.y = ROTACION;
    standardMesh.position.y = SALTO_POS;
    standardMesh.position.x = -SALTO_POS;

    escenaMateriales.add(standardMesh);

    // MeshPhongMaterial - Material con brillo
    const meshPhongMaterial = new THREE.MeshPhongMaterial({ color: 0x2f2f2f });

    const meshPhongGeometry = meshGeometry.clone();
    // Calcula las normales de las caras para que se pueda iluminar correctamente
    meshPhongGeometry.computeVertexNormals();

    const meshPhong = new THREE.Mesh(meshPhongGeometry, meshPhongMaterial);
    meshPhong.scale.set(ESCALA, ESCALA, ESCALA);
    meshPhong.rotation.y = ROTACION;
    meshPhong.position.y = SALTO_POS;
    meshPhong.position.x = 0;

    escenaMateriales.add(meshPhong);

    // ToonMeshMaterial -
    const toonShaderDotted = ToonShaderDotted;
    const toonShaderUniforms = THREE.UniformsUtils.clone(
      toonShaderDotted.uniforms
    );

    toonShaderUniforms.uDirLightPos.value = pointLight.position;
    toonShaderUniforms.uDirLightPos.value = new THREE.Vector3(
      -SALTO_POS - 3,
      -SALTO_POS,
      1
    );

    const toonMeshMaterial = new THREE.ShaderMaterial({
      uniforms: toonShaderUniforms,
      vertexShader: toonShaderDotted.vertexShader,
      fragmentShader: toonShaderDotted.fragmentShader,
    });

    const toonMeshGeometry = meshGeometry.clone();
    // Calcula las normales de las caras para que se pueda iluminar correctamente
    toonMeshGeometry.computeVertexNormals();

    const toonMesh = new THREE.Mesh(toonMeshGeometry, toonMeshMaterial);
    toonMesh.scale.set(ESCALA, ESCALA, ESCALA);
    toonMesh.rotation.y = ROTACION;
    toonMesh.position.y = -SALTO_POS;
    toonMesh.position.x = -SALTO_POS;

    escenaMateriales.add(toonMesh);
  });

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    // alpha: true,
  });
  // Definimos que o fondo negro da escena do modelo se convirta en transparente
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  // Melloramos o tono da foto
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  // Importante para pintar as 2 esceas
  renderer.autoClear = false;

  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render); // use if there is no animation loop
  controls.minDistance = 1;
  controls.maxDistance = 10;
  camera.position.set(0, 0, 3.5);
  controls.target.set(0, 0, -0.2);
  // camera.position.set(-SALTO_POS, -SALTO_POS, 3.5);
  // controls.target.set(-SALTO_POS, -SALTO_POS, 0);
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
  // Importante para pintar las 2 escenas?
  // renderer.clear();
  renderer.render(escenaMateriales, camera);
  renderer.render(escenaModeloAislado, camera);
}

function animate() {
  render();
}
