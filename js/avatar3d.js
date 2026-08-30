var scene, camera, renderer, controls;
var rightHand = null, leftHand = null;
var bodyGroup = null;
var particleSystem = null;
var currentPose = null;
var animating = false;
var animProgress = 0;
var targetPose = null;
var animFrameId = null;
var cameraAngle = 0;
var cameraDistance = 4.2;
var cameraTargetY = 0.85;
var isDragging = false;
var lastMouseX = 0;
var lastMouseY = 0;

function init() {
  var container = document.getElementById('avatar-container');
  if (!container) return;
  var w = container.clientWidth || 600;
  var h = container.clientHeight || 500;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f4ff);
  scene.fog = new THREE.Fog(0xf0f4ff, 6, 14);

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  updateCameraPosition();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  controls = {
    update: function() {
      var targetX = Math.sin(cameraAngle) * cameraDistance;
      var targetZ = Math.cos(cameraAngle) * cameraDistance;
      camera.position.x = targetX;
      camera.position.z = targetZ;
      camera.position.y = 1.0;
      camera.lookAt(0, cameraTargetY, 0);
    }
  };

  var ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(3, 6, 4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);
  var fillLight = new THREE.DirectionalLight(0x818cf8, 0.4);
  fillLight.position.set(-3, 2, 2);
  scene.add(fillLight);

  var groundGeo = new THREE.CircleGeometry(3, 64);
  var groundMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.8, metalness: 0.0 });
  var ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  bodyGroup = new THREE.Group();
  scene.add(bodyGroup);
  buildAvatar();
  createParticles();

  setupMouseControls(container);

  var ro = new ResizeObserver(function() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  ro.observe(container);

  animate();
}

function updateCameraPosition() {
  var targetX = Math.sin(cameraAngle) * cameraDistance;
  var targetZ = Math.cos(cameraAngle) * cameraDistance;
  camera.position.set(targetX, 1.0, targetZ);
}

function setupMouseControls(container) {
  var canvas = renderer.domElement;
  canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  canvas.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    var dx = e.clientX - lastMouseX;
    var dy = e.clientY - lastMouseY;
    cameraAngle -= dx * 0.01;
    cameraTargetY = Math.max(0.3, Math.min(1.5, cameraTargetY - dy * 0.005));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  canvas.addEventListener('mouseup', function() { isDragging = false; });
  canvas.addEventListener('mouseleave', function() { isDragging = false; });
  canvas.addEventListener('wheel', function(e) {
    cameraDistance = Math.max(2, Math.min(8, cameraDistance + e.deltaY * 0.005));
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }
  });
  canvas.addEventListener('touchmove', function(e) {
    if (!isDragging || e.touches.length !== 1) return;
    var dx = e.touches[0].clientX - lastMouseX;
    var dy = e.touches[0].clientY - lastMouseY;
    cameraAngle -= dx * 0.01;
    cameraTargetY = Math.max(0.3, Math.min(1.5, cameraTargetY - dy * 0.005));
    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  });
  canvas.addEventListener('touchend', function() { isDragging = false; });
}

function buildAvatar() {
  var skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b9, roughness: 0.5, metalness: 0.0 });
  var skinLight = new THREE.MeshStandardMaterial({ color: 0xffe0c8, roughness: 0.5, metalness: 0.0 });
  var jointMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.4, metalness: 0.0 });
  var eyeMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
  var hairMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.8 });
  var clothDark = new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.6, metalness: 0.1 });

  var head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), skinLight);
  head.position.set(0, 2.2, 0); head.castShadow = true; bodyGroup.add(head);

  var hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.set(0, 2.25, 0); bodyGroup.add(hair);

  var eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), eyeMat);
  eye.position.set(-0.06, 2.22, 0.15); bodyGroup.add(eye);
  var eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), eyeMat);
  eye2.position.set(0.06, 2.22, 0.15); bodyGroup.add(eye2);

  var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.12, 16), skinMat);
  neck.position.set(0, 2.04, 0); bodyGroup.add(neck);

  var torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.28), clothDark);
  torso.position.set(0, 1.6, 0); torso.castShadow = true; bodyGroup.add(torso);

  var shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), skinLight);
  shoulderL.position.set(-0.32, 1.5, 0); bodyGroup.add(shoulderL);
  var shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), skinLight);
  shoulderR.position.set(0.32, 1.5, 0); bodyGroup.add(shoulderR);

  leftHand = createHandGroup(-0.32, 1.5, true);
  rightHand = createHandGroup(0.32, 1.5, false);

  currentPose = getDefaultPose();
  applyPoseToHand(rightHand, currentPose);
  applyPoseToHand(leftHand, currentPose);
}

function createHandGroup(x, y, isLeft) {
  var group = new THREE.Group();
  group.position.set(x, y, 0);
  bodyGroup.add(group);
  var skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b9, roughness: 0.5, metalness: 0.0 });
  var palmMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b9, roughness: 0.5, metalness: 0.0 });

  var palm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.07), palmMat);
  palm.position.y = 0.09; palm.castShadow = true;
  group.add(palm);

  var fingerDefs = [
    { name: 'thumb', pos: [0.06, 0.12, 0], length: 0.12, width: 0.04, isThumb: true },
    { name: 'index', pos: [0.04, 0.24, 0], length: 0.24, width: 0.045, isThumb: false },
    { name: 'middle', pos: [0, 0.26, 0], length: 0.28, width: 0.05, isThumb: false },
    { name: 'ring', pos: [-0.04, 0.24, 0], length: 0.25, width: 0.042, isThumb: false },
    { name: 'pinky', pos: [-0.08, 0.2, 0], length: 0.2, width: 0.035, isThumb: false }
  ];

  fingerDefs.forEach(function(fd) {
    var chain = buildFingerChain(fd);
    chain.position.set(fd.pos[0], fd.pos[1], fd.pos[2]);
    if (fd.name === 'thumb' && isLeft) chain.rotation.z = Math.PI;
    group.add(chain);
  });

  group.userData.isLeft = isLeft;
  return group;
}

function buildFingerChain(fd) {
  var skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b9, roughness: 0.5, metalness: 0.0 });
  var jointMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.4, metalness: 0.0 });

  var segLengths = [fd.length * 0.35, fd.length * 0.35, fd.length * 0.3];
  var segWidths = [fd.width, fd.width * 0.9, fd.width * 0.8];
  var segments = [];
  var currentGroup = null;
  var root = new THREE.Group();

  for (var i = 0; i < 3; i++) {
    var segGroup = new THREE.Group();
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(segWidths[i], segLengths[i], segWidths[i]), skinMat);
    mesh.position.y = -segLengths[i] / 2; mesh.castShadow = true;
    segGroup.add(mesh);

    var joint = new THREE.Mesh(new THREE.SphereGeometry(segWidths[i] * 0.55, 8, 8), jointMat);
    joint.position.y = 0; segGroup.add(joint);

    if (currentGroup === null) { root.add(segGroup); }
    else { currentGroup.add(segGroup); segGroup.position.y = segLengths[i - 1]; }

    segments.push(segGroup);
    currentGroup = segGroup;
  }

  for (var i = 0; i < segments.length; i++) {
    segments[i].userData = { fingerIndex: i, fingerName: fd.name, isThumb: fd.isThumb };
    segments[i].userData.nextSeg = (i < segments.length - 1) ? segments[i + 1] : null;
  }

  return root;
}

function getDefaultPose() {
  return {
    thumb: { cx: 0, mx: 0, ix: 0 },
    index: { mx: 0, px: 0, dx: 0 },
    middle: { mx: 0, px: 0, dx: 0 },
    ring: { mx: 0, px: 0, dx: 0 },
    pinky: { mx: 0, px: 0, dx: 0 }
  };
}

function applyPoseToHand(hand, pose) {
  if (!hand) return;
  hand.children.forEach(function(chain) {
    if (!chain.children) return;
    chain.children.forEach(function(seg) {
      if (!seg.userData || !seg.userData.fingerName) return;
      var fn = seg.userData.fingerName;
      if (!pose[fn]) return;
      var fp = pose[fn];
      if (seg.userData.isThumb) {
        seg.rotation.z = (fp.cx || 0) * Math.PI / 180;
        seg.rotation.x = (fp.mx || 0) * Math.PI / 180;
        var next = seg.userData.nextSeg;
        if (next) next.rotation.x = (fp.ix || 0) * Math.PI / 180;
      } else {
        var idx = seg.userData.fingerIndex;
        var angles = ['mx', 'px', 'dx'];
        if (idx < angles.length) seg.rotation.x = (fp[angles[idx]] || 0) * Math.PI / 180;
      }
    });
  });
}

function animateHandToPose(pose) {
  if (!pose) return;
  animating = true;
  animProgress = 0;
  targetPose = JSON.parse(JSON.stringify(pose));
  if (!currentPose) currentPose = getDefaultPose();
}

function createParticles() {
  var count = 50;
  var geometry = new THREE.BufferGeometry();
  var positions = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = Math.random() * 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var material = new THREE.PointsMaterial({ color: 0x818cf8, size: 0.02, transparent: true, opacity: 0.4 });
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
}

function animate() {
  animFrameId = requestAnimationFrame(animate);

  if (animating && targetPose) {
    animProgress += 0.03;
    if (animProgress >= 1) {
      animProgress = 1; animating = false;
      currentPose = JSON.parse(JSON.stringify(targetPose));
      applyPoseToHand(rightHand, currentPose);
      applyPoseToHand(leftHand, currentPose);
    } else {
      var t = easeInOutCubic(animProgress);
      var interp = {};
      for (var finger in targetPose) {
        if (!currentPose[finger]) continue;
        interp[finger] = {};
        for (var joint in targetPose[finger]) {
          interp[finger][joint] = (currentPose[finger][joint] || 0) + ((targetPose[finger][joint] || 0) - (currentPose[finger][joint] || 0)) * t;
        }
      }
      applyPoseToHand(rightHand, interp);
      applyPoseToHand(leftHand, interp);
    }
  }

  if (particleSystem) {
    particleSystem.rotation.y += 0.001;
    var pos = particleSystem.geometry.attributes.position.array;
    for (var i = 0; i < pos.length; i += 3) { pos[i + 1] += 0.002; if (pos[i + 1] > 4) pos[i + 1] = 0; }
    particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  controls.update();
  renderer.render(scene, camera);
}

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function setSign(key) {
  if (SIGN_DATA.alphabet[key]) animateHandToPose(SIGN_DATA.alphabet[key].fingers);
  else if (SIGN_DATA.words[key]) animateHandToPose(SIGN_DATA.words[key].fingers);
}

function dispose() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (renderer) renderer.dispose();
  if (scene) scene.traverse(function(obj) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(function(m) { m.dispose(); });
      else obj.material.dispose();
    }
  });
}

function focusCamera() {
  if (controls) {
    cameraTargetY = 0.85;
    cameraDistance = 4.2;
    cameraAngle = 0;
  }
}

window.setSign = setSign;
window.focusCamera = focusCamera;
window.dispose = dispose;
window.animateHandToPose = animateHandToPose;
window.applyPoseToHand = applyPoseToHand;