const rootDiv = document.getElementById("root");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
const render = () => renderer.render(scene, camera);
const cubes = [];
const controls = new THREE.OrbitControls(camera, rootDiv);
let startSelectedCube;
let startPoint;
let distance;
let rotationDirection;
let rotatingCubes;
let materials = [];

const initMaterials = () => {
  for (let i = 0; i <= 6; i++) {
    let color;
    if (i === 0) color = 0xff0000;
    else if (i === 1) color = 0x00ff00;
    else if (i === 2) color = 0x0000ff;
    else if (i === 3) color = 0xffff00;
    else if (i === 4) color = 0xffffff;
    else if (i === 5) color = 0x0ffff0;
    else if (i === 6) color = 0x000000;
    materials.push(
      new THREE.MeshPhongMaterial({
        color: color,
      })
    );
  }
};

const ungroup = (group, scene) => {
  let groupMatrix = group.matrix;
  let childs = [...group.children];
  for (let i = 0; i < childs.length; i++) {
    group.remove(childs[i]);
    scene.add(childs[i]);
    childs[i].applyMatrix(groupMatrix);
  }
  scene.remove(group);
};

const initialCamera = () => {
  camera.position.z = 5;
  camera.position.x = 5;
  camera.position.y = 5;
  camera.lookAt(0, 0, 0);
};

const initialLights = () => {
  const color = 0xffffff;
  const intensity = 0.9;

  for (let i = 0; i < 3; i++) {
    const frontlight = new THREE.PointLight(color, intensity);
    frontlight.position.set(i === 0 ? 3 : 0, i === 1 ? 3 : 0, i === 2 ? 3 : 0);
    scene.add(frontlight);

    const backLight = new THREE.PointLight(color, intensity);
    backLight.position.set(
      i === 0 ? -3 : 0,
      i === 1 ? -3 : 0,
      i === 2 ? -3 : 0
    );
    scene.add(backLight);
  }
};

const initFaces = (geometry, x, y, z) => {
  let localMaterials = [];
  for (let i = 0; i < geometry.faces.length; i++) {
    let face = geometry.faces[i];
    if (face.normal.x === 1) {
      if (x === 1) {
        localMaterials[0] = materials[0];
      } else {
        localMaterials[0] = materials[6];
      }
    } else if (face.normal.x === -1) {
      if (x === -1) {
        localMaterials[1] = materials[1];
      } else {
        localMaterials[1] = materials[6];
      }
    } else if (face.normal.y === 1) {
      if (y === 1) {
        localMaterials[2] = materials[2];
      } else {
        localMaterials[2] = materials[6];
      }
    } else if (face.normal.y === -1) {
      if (y === -1) {
        localMaterials[3] = materials[3];
      } else {
        localMaterials[3] = materials[6];
      }
    } else if (face.normal.z === 1) {
      if (z === 1) {
        localMaterials[4] = materials[4];
      } else {
        localMaterials[4] = materials[6];
      }
    } else if (face.normal.z === -1) {
      if (z === -1) {
        localMaterials[5] = materials[5];
      } else {
        localMaterials[5] = materials[6];
      }
    }
  }
  return localMaterials;
};

const drawRubik = () => {
  initMaterials();
  let geometry = new THREE.BoxGeometry(1, 1, 1);
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        let localMaterials = initFaces(geometry, x, y, z);
        let cube = new THREE.Mesh(geometry, localMaterials);
        scene.add(cube);
        cube.name = x + "" + y + "" + z;
        cube.position.set(x + x / 20, y + y / 20, z + z / 20);
        cubes.push(cube);
      }
    }
  }
};

const initialScene = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio * 1.5);
  rootDiv.appendChild(renderer.domElement);
  let axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);
  initialLights();
  initialCamera();
  drawRubik();
};

const raycastMouseDown = (e) => {
  let mouse = { x: 0, y: 0 };
  if (e.type === "mousedown") {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  } else if (e.type === "touchstart") {
    mouse.x = +(e.targetTouches[0].pageX / window.innerWidth) * 2 + -1;
    mouse.y = -(e.targetTouches[0].pageY / window.innerHeight) * 2 + 1;
  }
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  let intersects = raycaster.intersectObjects(scene.children, false);
  let firstCubeObject = intersects.filter((x) => x.object.name !== "");

  if (firstCubeObject[0] !== undefined) {
    controls.enableRotate = false;
    startSelectedCube = firstCubeObject[0];
    startPoint = { x: mouse.x, y: mouse.y };
  }
};

const animateGroup = () => {
  let d = 0;
  let rotateAboutAxis;
  let rotateAbsolute;
  if (rotationDirection === "x") {
    rotateAboutAxis = (d) =>
      (rotatingCubes.rotation.x = THREE.Math.degToRad(d));
    rotateAbsolute = () => (rotatingCubes.rotation.x = Math.PI / 2);
  } else if (rotationDirection === "-x") {
    rotateAboutAxis = (d) =>
      (rotatingCubes.rotation.x = THREE.Math.degToRad(-d));
    rotateAbsolute = () => (rotatingCubes.rotation.x = -Math.PI / 2);
  } else if (rotationDirection === "y") {
    rotateAboutAxis = (d) =>
      (rotatingCubes.rotation.y = THREE.Math.degToRad(d));
    rotateAbsolute = () => (rotatingCubes.rotation.y = Math.PI / 2);
  } else if (rotationDirection === "-y") {
    rotateAboutAxis = (d) =>
      (rotatingCubes.rotation.y = THREE.Math.degToRad(-d));
    rotateAbsolute = () => (rotatingCubes.rotation.y = -Math.PI / 2);
  } else if (rotationDirection === "z") {
    rotateAboutAxis = (d) =>
      (rotatingCubes.rotation.z = THREE.Math.degToRad(d));
    rotateAbsolute = () => (rotatingCubes.rotation.z = Math.PI / 2);
  } else if (rotationDirection === "-z") {
    rotateAboutAxis = (d) =>
      (rotatingCubes.rotation.z = THREE.Math.degToRad(-d));
    rotateAbsolute = () => (rotatingCubes.rotation.z = -Math.PI / 2);
  }

  let timer = setInterval(() => {
    d += 3;
    rotateAboutAxis(d);
    if (d >= 90) {
      rotateAbsolute();
      render();
      if (rotatingCubes !== undefined) ungroup(rotatingCubes, scene);
      clearInterval(timer);
    }
  }, 10);
};

const recognizeDirection = (dx, dy, dz, absX, absY, absZ, limit) => {
  if (startSelectedCube.point.x > 1.5) {
    if (absY > limit || absZ > limit) {
      if (absY > absZ) {
        rotationDirection = dy < 0 ? "z" : "-z";
      } else {
        rotationDirection = dz < 0 ? "-y" : "y";
      }
    }
  } else if (startSelectedCube.point.y > 1.5) {
    if (absX > limit || absZ > limit) {
      if (absX > absZ) {
        rotationDirection = dx < 0 ? "-z" : "z";
      } else {
        rotationDirection = dz < 0 ? "x" : "-x";
      }
    }
  } else if (startSelectedCube.point.z > 1.5) {
    if (absX > limit || absY > limit) {
      if (absX > absY) {
        rotationDirection = dx < 0 ? "y" : "-y";
      } else {
        rotationDirection = dy < 0 ? "-x" : "x";
      }
    }
  } else if (startSelectedCube.point.x < -1.5) {
    if (absY > limit || absZ > limit) {
      if (absY > absZ) {
        rotationDirection = dy < 0 ? "-z" : "z";
      } else {
        rotationDirection = dz < 0 ? "y" : "-y";
      }
    }
  } else if (startSelectedCube.point.y < -1.5) {
    if (absX > limit || absZ > limit) {
      if (absX > absZ) {
        rotationDirection = dx < 0 ? "z" : "-z";
      } else {
        rotationDirection = dz < 0 ? "-x" : "x";
      }
    }
  } else if (startSelectedCube.point.z < -1.5) {
    if (absX > limit || absY > limit) {
      if (absX > absY) {
        rotationDirection = dx < 0 ? "-y" : "y";
      } else {
        rotationDirection = dy < 0 ? "x" : "-x";
      }
    }
  }
};

const recognizeGroup = () => {
  let group;
  if (rotationDirection === "y" || rotationDirection === "-y") {
    group = cubes.filter(
      (x) => Math.abs(x.position.y - startSelectedCube.object.position.y) < 0.05
    );
  } else if (rotationDirection === "x" || rotationDirection === "-x") {
    group = cubes.filter(
      (x) => Math.abs(x.position.x - startSelectedCube.object.position.x) < 0.05
    );
  } else if (rotationDirection === "z" || rotationDirection === "-z") {
    group = cubes.filter(
      (x) => Math.abs(x.position.z - startSelectedCube.object.position.z) < 0.05
    );
  }
  rotatingCubes = new THREE.Object3D();
  group.forEach((x) => rotatingCubes.add(x));
  scene.add(rotatingCubes);
};

const raycastMouseMove = (e) => {
  if (startSelectedCube === undefined) return;
  let mouse = { x: 0, y: 0 };
  if (e.type === "mousemove") {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  } else if (e.type === "touchmove") {
    mouse.x = +(e.targetTouches[0].pageX / window.innerWidth) * 2 + -1;
    mouse.y = -(e.targetTouches[0].pageY / window.innerHeight) * 2 + 1;
  }

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children, false);

  let firstCubeObject = intersects.filter((x) => x.object.name !== "");

  let dx = startSelectedCube.point.x - firstCubeObject[0]?.point.x;
  let dy = startSelectedCube.point.y - firstCubeObject[0]?.point.y;
  let dz = startSelectedCube.point.z - firstCubeObject[0]?.point.z;

  let absX = Math.abs(dx);
  let absY = Math.abs(dy);
  let absZ = Math.abs(dz);

  let limit = 0.3;

  recognizeDirection(dx, dy, dz, absX, absY, absZ, limit);
  if (rotationDirection !== undefined && startSelectedCube !== undefined) {
    recognizeGroup();
    startSelectedCube = undefined;
    animateGroup();
  }
};

const animate = () => {
  requestAnimationFrame(animate);
  controls.update();
  render();
};

const resetValues = () => {
  controls.enableRotate = true;
  distance = undefined;
  rotationDirection = undefined;
  startSelectedCube = undefined;
};

const resetView = () => {
  let currentPosition = camera.position;
  let targetPosition = { x: 5, y: 5, z: 5 };
  let duration = 2000;
  let stepX = ((targetPosition.x - currentPosition.x) / duration) * 10;
  let stepY = ((targetPosition.y - currentPosition.y) / duration) * 10;
  let stepZ = ((targetPosition.z - currentPosition.z) / duration) * 10;

  let x = currentPosition.x;
  let y = currentPosition.y;
  let z = currentPosition.z;
  let timer = setInterval(() => {
    x += stepX;
    y += stepY;
    z += stepZ;
    camera.position.x = x;
    camera.position.y = y;
    camera.position.z = z;
    if (x <= 5.1 && x >= 4.9 && y <= 5.1 && y >= 4.9 && z <= 5.1 && z >= 4.9) {
      camera.position.x = 5;
      camera.position.y = 5;
      camera.position.z = 5;
      render();
      clearInterval(timer);
    }
  }, 10);
};

initialScene();
animate();

window.addEventListener("mousedown", raycastMouseDown);
window.addEventListener("mousemove", raycastMouseMove);
window.addEventListener("mouseup", resetValues);
window.addEventListener("touchstart", raycastMouseDown);
document.getElementById("root").addEventListener("touchmove", raycastMouseMove);
window.addEventListener("touchend", resetValues);
document.getElementById("reset-view").addEventListener("click", resetView);
document.getElementById("reset-view").addEventListener("touchstart", resetView);
