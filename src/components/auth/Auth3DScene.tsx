import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Auth3DSceneProps {
  isTyping?: boolean;
  isHoveringLogo?: boolean;
  isLoginSuccess?: boolean;
}

export function Auth3DScene({
  isTyping = false,
  isLoginSuccess = false,
}: Auth3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    mouse: { x: 0, y: 0, tx: 0, ty: 0 },
    typingPulse: 0,
    isLoginSuccess,
    cameraAngle: 0,
  });

  useEffect(() => {
    if (isTyping) stateRef.current.typingPulse = 1.0;
  }, [isTyping]);

  useEffect(() => {
    stateRef.current.isLoginSuccess = isLoginSuccess;
  }, [isLoginSuccess]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    // ── Renderer ───────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // ── Scene & Camera ─────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#000000", 0.028);

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 8);
    camera.lookAt(0, 0, 0);

    // ── Lights ─────────────────────────────────────────────────
    // No ambient — pure darkness like space
    const neckLight = new THREE.PointLight("#F9A8D4", 12, 6);
    neckLight.position.set(0, 0, 0); // at the neck
    scene.add(neckLight);

    const rimLight = new THREE.PointLight("#ffffff", 3, 20);
    rimLight.position.set(-6, 2, -8);
    scene.add(rimLight);

    const coldLight = new THREE.PointLight("#E9D5FF", 2, 15);
    coldLight.position.set(5, -3, 2);
    scene.add(coldLight);

    // ── HOURGLASS WIREFRAME ────────────────────────────────────
    const hourglassGroup = new THREE.Group();
    scene.add(hourglassGroup);

    // Build hourglass from lathed curve — proper shape
    const buildHourglassEdges = () => {
      const segments = 32;
      const rings = 28;

      // Hourglass profile: radius as function of y (-2.2 to 2.2)
      const getRadius = (y: number) => {
        const t = Math.abs(y) / 2.2; // 0 at neck, 1 at top/bottom
        // Catenary-like curve: narrow at center, wide at ends
        return 0.06 + 1.35 * (t * t * (3 - 2 * t)); // smooth cubic ease
      };

      // Create rings
      const ringGeometries: THREE.BufferGeometry[] = [];
      for (let r = 0; r < rings; r++) {
        const y = -2.2 + (r / (rings - 1)) * 4.4;
        const radius = getRadius(y);
        const ringGeo = new THREE.TorusGeometry(radius, 0.006, 4, segments);
        const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
          color: "#F9A8D4",
          transparent: true,
          opacity: radius < 0.15 ? 1.0 : 0.35 + (1 - Math.abs(y) / 2.2) * 0.1,
        }));
        ringMesh.position.y = y;
        ringMesh.rotation.x = Math.PI / 2;
        hourglassGroup.add(ringMesh);
      }

      // Vertical lines connecting rings
      const lineCount = 16;
      for (let l = 0; l < lineCount; l++) {
        const angle = (l / lineCount) * Math.PI * 2;
        const points: THREE.Vector3[] = [];

        for (let r = 0; r < rings; r++) {
          const y = -2.2 + (r / (rings - 1)) * 4.4;
          const radius = getRadius(y);
          points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius
          ));
        }

        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: "#F9A8D4",
          transparent: true,
          opacity: 0.25,
        });
        hourglassGroup.add(new THREE.Line(lineGeo, lineMat));
      }

      return ringGeometries;
    };

    buildHourglassEdges();

    // Top and bottom rim — bright
    const rimGeo = new THREE.TorusGeometry(1.38, 0.018, 8, 80);
    const rimMat = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.9,
    });
    const topRim = new THREE.Mesh(rimGeo, rimMat);
    topRim.position.y = 2.2;
    topRim.rotation.x = Math.PI / 2;
    hourglassGroup.add(topRim);

    const botRim = new THREE.Mesh(rimGeo, rimMat);
    botRim.position.y = -2.2;
    botRim.rotation.x = Math.PI / 2;
    hourglassGroup.add(botRim);

    // Neck singularity ring — bright pulsing
    const neckRingGeo = new THREE.TorusGeometry(0.06, 0.03, 8, 48);
    const neckRingMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    const neckRing = new THREE.Mesh(neckRingGeo, neckRingMat);
    neckRing.rotation.x = Math.PI / 2;
    hourglassGroup.add(neckRing);

    // Gravitational lensing ring — larger, faint
    const lensGeo = new THREE.TorusGeometry(0.45, 0.004, 4, 96);
    const lensMat = new THREE.MeshBasicMaterial({
      color: "#F9A8D4",
      transparent: true,
      opacity: 0.5,
    });
    const lensRing = new THREE.Mesh(lensGeo, lensMat);
    lensRing.rotation.x = Math.PI / 2;
    hourglassGroup.add(lensRing);

    // ── ASSEMBLE ANIMATION STATE ───────────────────────────────
    // Particles that fly in to form the structure on load
    const ASSEMBLE_COUNT = 800;
    const assembleGeo = new THREE.BufferGeometry();
    const assemblePos = new Float32Array(ASSEMBLE_COUNT * 3);
    const assembleTarget = new Float32Array(ASSEMBLE_COUNT * 3);
    const assembleCurrent = new Float32Array(ASSEMBLE_COUNT * 3);

    // Generate target positions on hourglass surface
    const getRadius = (y: number) =>
      0.06 + 1.35 * (Math.pow(Math.abs(y) / 2.2, 2) * (3 - 2 * Math.pow(Math.abs(y) / 2.2, 1)));

    for (let i = 0; i < ASSEMBLE_COUNT; i++) {
      const y = -2.2 + Math.random() * 4.4;
      const angle = Math.random() * Math.PI * 2;
      const r = getRadius(y);

      assembleTarget[i * 3] = Math.cos(angle) * r;
      assembleTarget[i * 3 + 1] = y;
      assembleTarget[i * 3 + 2] = Math.sin(angle) * r;

      // Start from random far positions
      const startR = 8 + Math.random() * 6;
      const startAngle = Math.random() * Math.PI * 2;
      const startY = (Math.random() - 0.5) * 12;
      assembleCurrent[i * 3] = Math.cos(startAngle) * startR;
      assembleCurrent[i * 3 + 1] = startY;
      assembleCurrent[i * 3 + 2] = Math.sin(startAngle) * startR;

      assemblePos[i * 3] = assembleCurrent[i * 3];
      assemblePos[i * 3 + 1] = assembleCurrent[i * 3 + 1];
      assemblePos[i * 3 + 2] = assembleCurrent[i * 3 + 2];
    }

    assembleGeo.setAttribute("position", new THREE.BufferAttribute(assemblePos, 3));
    const assembleMat = new THREE.PointsMaterial({
      size: 0.028,
      color: "#F9A8D4",
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(assembleGeo, assembleMat));

    let assembleProgress = 0; // 0 → 1 over first 3 seconds
    hourglassGroup.visible = false; // hide until assembled

    // ── SAND PARTICLES — spiral orbit physics ──────────────────
    const SAND_COUNT = 500;
    const sandGeo = new THREE.BufferGeometry();
    const sandPos = new Float32Array(SAND_COUNT * 3);
    const sandCol = new Float32Array(SAND_COUNT * 3);

    interface SandParticle {
      // Position
      angle: number;
      radius: number;
      y: number;
      // Velocity
      vy: number;
      angularV: number;
      radialV: number;
      // State
      phase: "top" | "falling" | "bottom";
      age: number;
      fallDelay: number;
      // Bottom settled
      bx: number;
      bz: number;
      settledY: number;
    }

    const sandState: SandParticle[] = Array.from({ length: SAND_COUNT }, (_, i) => {
      const inTop = i < SAND_COUNT * 0.6;
      const y = inTop
        ? 0.3 + Math.random() * 1.7
        : -(0.4 + Math.random() * 1.6);

      const radius = inTop
        ? Math.random() * getRadius(y) * 0.85
        : Math.random() * getRadius(y) * 0.8;

      return {
        angle: Math.random() * Math.PI * 2,
        radius,
        y,
        vy: 0,
        angularV: (inTop ? 0.008 : 0.004) + Math.random() * 0.006,
        radialV: 0,
        phase: inTop ? "top" : "bottom",
        age: Math.random() * 120,
        fallDelay: 30 + Math.random() * 120,
        bx: (Math.random() - 0.5) * 0.9,
        bz: (Math.random() - 0.5) * 0.9,
        settledY: -(1.6 + Math.random() * 0.5),
      } as SandParticle;
    });

    const cPink = new THREE.Color("#F9A8D4");
    const cWhite = new THREE.Color("#ffffff");
    const cLav = new THREE.Color("#E9D5FF");

    for (let i = 0; i < SAND_COUNT; i++) {
      const t = Math.random();
      const c = t < 0.55 ? cPink : t < 0.78 ? cWhite : cLav;
      sandCol[i * 3] = c.r; sandCol[i * 3 + 1] = c.g; sandCol[i * 3 + 2] = c.b;
    }

    sandGeo.setAttribute("position", new THREE.BufferAttribute(sandPos, 3));
    sandGeo.setAttribute("color", new THREE.BufferAttribute(sandCol, 3));

    const sandMat = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.0, // fade in after assembly
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(sandGeo, sandMat));

    // ── FALLING STREAM ─────────────────────────────────────────
    const STREAM_COUNT = 35;
    const streamGeo = new THREE.BufferGeometry();
    const streamPos = new Float32Array(STREAM_COUNT * 3);

    interface StreamParticle {
      angle: number; radius: number; y: number; vy: number; spiralR: number;
    }

    const streamState: StreamParticle[] = Array.from({ length: STREAM_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 0.04,
      y: Math.random() * 0.2 - 0.1,
      vy: -(0.02 + Math.random() * 0.025),
      spiralR: Math.random() * 0.03,
    }));

    streamGeo.setAttribute("position", new THREE.BufferAttribute(streamPos, 3));
    const streamMat = new THREE.PointsMaterial({
      size: 0.025,
      color: "#ffffff",
      transparent: true,
      opacity: 0.0, // fade in
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(streamGeo, streamMat));

    // ── ACCRETION DISK ─────────────────────────────────────────
    const DISK_COUNT = 2000;
    const diskGeo = new THREE.BufferGeometry();
    const diskPos = new Float32Array(DISK_COUNT * 3);
    const diskCol = new Float32Array(DISK_COUNT * 3);
    const diskAngles = new Float32Array(DISK_COUNT);
    const diskRadii = new Float32Array(DISK_COUNT);
    const diskSpeeds = new Float32Array(DISK_COUNT);
    const diskY = new Float32Array(DISK_COUNT);

    for (let i = 0; i < DISK_COUNT; i++) {
      const r = 2.2 + Math.pow(Math.random(), 0.5) * 5.5;
      diskRadii[i] = r;
      diskAngles[i] = Math.random() * Math.PI * 2;
      diskSpeeds[i] = (0.003 + Math.random() * 0.006) / Math.sqrt(r); // Kepler-ish
      diskY[i] = (Math.random() - 0.5) * 0.25 * (r / 7); // slight thickness

      // Color: pink near center, lavender at edges, fading
      const tColor = Math.min(1, (r - 2.2) / 5.5);
      const c = new THREE.Color().lerpColors(cPink, cLav, tColor);
      diskCol[i * 3] = c.r * (1 - tColor * 0.6);
      diskCol[i * 3 + 1] = c.g * (1 - tColor * 0.6);
      diskCol[i * 3 + 2] = c.b * (1 - tColor * 0.6);
    }

    diskGeo.setAttribute("position", new THREE.BufferAttribute(diskPos, 3));
    diskGeo.setAttribute("color", new THREE.BufferAttribute(diskCol, 3));

    const diskMat = new THREE.PointsMaterial({
      size: 0.022,
      vertexColors: true,
      transparent: true,
      opacity: 0.0, // fade in
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(diskGeo, diskMat));

    // ── GRAVITATIONAL WAVE STATE ───────────────────────────────
    let waveTime = 0;
    let waveActive = false;
    let nextWave = 8;

    // ── MOUSE ──────────────────────────────────────────────────
    const onMouse = (e: MouseEvent) => {
      stateRef.current.mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      stateRef.current.mouse.ty = (e.clientY / innerHeight) * -2 + 1;
    };
    window.addEventListener("mousemove", onMouse);

    // ── ANIMATE ────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const s = stateRef.current;

      // Smooth mouse
      s.mouse.x += (s.mouse.tx - s.mouse.x) * 0.04;
      s.mouse.y += (s.mouse.ty - s.mouse.y) * 0.04;

      // ── PHASE 1: ASSEMBLY (0 → 3s) ──────────────────────────
      if (assembleProgress < 1.0) {
        assembleProgress = Math.min(1.0, t / 3.0);
        const eased = assembleProgress < 0.5
          ? 4 * assembleProgress * assembleProgress * assembleProgress
          : 1 - Math.pow(-2 * assembleProgress + 2, 3) / 2;

        const aArr = assembleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < ASSEMBLE_COUNT; i++) {
          aArr[i * 3] = assembleCurrent[i * 3] + (assembleTarget[i * 3] - assembleCurrent[i * 3]) * eased;
          aArr[i * 3 + 1] = assembleCurrent[i * 3 + 1] + (assembleTarget[i * 3 + 1] - assembleCurrent[i * 3 + 1]) * eased;
          aArr[i * 3 + 2] = assembleCurrent[i * 3 + 2] + (assembleTarget[i * 3 + 2] - assembleCurrent[i * 3 + 2]) * eased;
        }
        assembleGeo.attributes.position.needsUpdate = true;
        assembleMat.opacity = Math.min(0.7, assembleProgress * 2);

        if (assembleProgress > 0.85 && !hourglassGroup.visible) {
          hourglassGroup.visible = true;
        }

        // Fade in everything else after assembly
        const postAssemble = Math.max(0, (assembleProgress - 0.7) / 0.3);
        sandMat.opacity = postAssemble * 0.88;
        streamMat.opacity = postAssemble * 0.9;
        diskMat.opacity = postAssemble * 0.55;
        assembleMat.opacity = Math.max(0, 0.7 - postAssemble * 0.7);

      } else {
        // Assembly done — hide assemble particles
        assembleMat.opacity = 0;
      }

      // ── HOURGLASS ANIMATION ──────────────────────────────────
      // Very slow rotation — 25 second full loop
      hourglassGroup.rotation.y = t * (Math.PI * 2 / 25);

      // Mouse camera orbit — camera floats around, not object tilt
      const targetCamX = s.mouse.x * 1.8;
      const targetCamY = 0.5 + s.mouse.y * 1.0;
      s.cameraAngle += (targetCamX - s.cameraAngle) * 0.03;
      camera.position.x = Math.sin(s.cameraAngle) * 8;
      camera.position.z = Math.cos(s.cameraAngle) * 8;
      camera.position.y += (targetCamY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      // Breathing
      const breathe = 1 + Math.sin(t * (Math.PI * 2 / 4)) * 0.015;
      hourglassGroup.scale.setScalar(breathe);

      // Neck light pulse
      neckLight.intensity = 10 + Math.sin(t * 2.5) * 3;

      // Neck ring glow pulse
      neckRing.scale.setScalar(1 + Math.sin(t * 3) * 0.15);

      // Gravitational lensing ring distortion
      lensRing.scale.x = 1 + Math.sin(t * 1.8) * 0.06;
      lensRing.scale.y = 1 + Math.cos(t * 2.1) * 0.06;
      (lensMat as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 1.5) * 0.2;

      // ── GRAVITATIONAL WAVE ───────────────────────────────────
      if (t > nextWave && !waveActive) {
        waveActive = true;
        waveTime = 0;
        nextWave = t + 8;
      }
      if (waveActive) {
        waveTime += 0.04;
        if (waveTime > 1.0) waveActive = false;
      }

      // ── SAND PHYSICS ─────────────────────────────────────────
      const pArr = sandGeo.attributes.position.array as Float32Array;

      sandState.forEach((p, i) => {
        const idx = i * 3;

        if (p.phase === "top") {
          p.age++;
          // Spiral inward — like matter being pulled to singularity
          p.angle += p.angularV * (1 + (1 - p.radius / 1.4) * 0.5);
          p.radius -= 0.0006 + (1 - Math.max(0, p.radius) / 1.4) * 0.001;
          p.y -= 0.0004;

          // Gravitational wave ripple
          if (waveActive) {
            const waveY = -2.2 + waveTime * 4.4;
            if (Math.abs(p.y - waveY) < 0.4) {
              const wavePush = Math.sin((p.y - waveY) / 0.4 * Math.PI) * 0.08;
              p.radius += wavePush;
            }
          }

          const coneR = getRadius(p.y);
          p.radius = Math.min(p.radius, coneR * 0.9);

          pArr[idx] = Math.cos(p.angle) * p.radius;
          pArr[idx + 1] = p.y;
          pArr[idx + 2] = Math.sin(p.angle) * p.radius;

          // Fall when reaching neck
          if (p.radius < 0.07 || p.y < 0.05) {
            p.phase = "falling";
            p.y = 0.02;
            p.radius = 0.02;
            p.vy = -0.022;
            p.angle = Math.random() * Math.PI * 2;
          }

        } else if (p.phase === "falling") {
          // Fall through neck with slight spiral
          p.vy -= 0.001;
          p.y += p.vy;
          p.angle += 0.08;

          // Expand outward in bottom cone
          const fallT = Math.max(0, -p.y / 2.2);
          p.radius = fallT * getRadius(p.y) * 0.85;

          pArr[idx] = Math.cos(p.angle) * p.radius;
          pArr[idx + 1] = p.y;
          pArr[idx + 2] = Math.sin(p.angle) * p.radius;

          if (p.y < p.settledY) {
            p.phase = "bottom";
            p.radius = Math.hypot(p.bx, p.bz);
            p.angle = Math.atan2(p.bz, p.bx);
          }

        } else {
          // Bottom — gentle drift, slow orbit
          p.angle += 0.001 + Math.random() * 0.001;
          const wobble = Math.sin(t * 0.4 + i * 0.7) * 0.004;
          const r = Math.hypot(p.bx, p.bz) + wobble;

          pArr[idx] = Math.cos(p.angle) * r;
          pArr[idx + 1] = p.settledY + Math.sin(t * 0.3 + i) * 0.008;
          pArr[idx + 2] = Math.sin(p.angle) * r;

          // Respawn after random delay
          if (Math.random() < 0.0004) {
            p.phase = "top";
            p.y = 0.5 + Math.random() * 1.5;
            p.radius = 0.3 + Math.random() * getRadius(p.y) * 0.7;
            p.angle = Math.random() * Math.PI * 2;
            p.vy = 0;
            p.age = 0;
            p.angularV = 0.008 + Math.random() * 0.006;
          }
        }
      });

      sandGeo.attributes.position.needsUpdate = true;

      // ── STREAM ───────────────────────────────────────────────
      const sArr = streamGeo.attributes.position.array as Float32Array;
      streamState.forEach((p, i) => {
        p.y += p.vy;
        p.angle += 0.12;
        p.radius = p.spiralR * (1 - Math.abs(p.y) / 2.2);

        sArr[i * 3] = Math.cos(p.angle) * p.radius;
        sArr[i * 3 + 1] = p.y;
        sArr[i * 3 + 2] = Math.sin(p.angle) * p.radius;

        if (p.y < -2.1) {
          p.y = 0.08 + Math.random() * 0.08;
          p.vy = -(0.018 + Math.random() * 0.022);
          p.angle = Math.random() * Math.PI * 2;
          p.spiralR = Math.random() * 0.035;
        }
      });
      streamGeo.attributes.position.needsUpdate = true;

      // ── ACCRETION DISK ───────────────────────────────────────
      const dArr = diskGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < DISK_COUNT; i++) {
        diskAngles[i] += diskSpeeds[i];
        const wobble = waveActive
          ? Math.sin(diskAngles[i] * 3 + waveTime * Math.PI * 4) * 0.06
          : 0;
        dArr[i * 3] = Math.cos(diskAngles[i]) * (diskRadii[i] + wobble);
        dArr[i * 3 + 1] = diskY[i];
        dArr[i * 3 + 2] = Math.sin(diskAngles[i]) * (diskRadii[i] + wobble);
      }
      diskGeo.attributes.position.needsUpdate = true;

      // Login success — everything collapses to singularity
      if (s.isLoginSuccess) {
        hourglassGroup.scale.multiplyScalar(0.96);
        diskMat.opacity *= 0.95;
        sandMat.opacity *= 0.95;
        streamMat.opacity *= 0.95;
        neckLight.intensity *= 1.08; // gets brighter before collapse
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── RESIZE ────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent select-none">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}