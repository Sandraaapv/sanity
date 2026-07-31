import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Auth3DSceneProps {
  isTyping?: boolean;
  isHoveringLogo?: boolean;
  isLoginSuccess?: boolean;
}

export function Auth3DScene({
  isTyping = false,
  isHoveringLogo = false,
  isLoginSuccess = false,
}: Auth3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sceneStateRef = useRef({
    isTyping,
    isHoveringLogo,
    isLoginSuccess,
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0 },
    typingPulseTime: 0,
  });

  useEffect(() => {
    sceneStateRef.current.isTyping = isTyping;
    if (isTyping) {
      sceneStateRef.current.typingPulseTime = 1.0;
    }
  }, [isTyping]);

  useEffect(() => {
    sceneStateRef.current.isHoveringLogo = isHoveringLogo;
  }, [isHoveringLogo]);

  useEffect(() => {
    sceneStateRef.current.isLoginSuccess = isLoginSuccess;
  }, [isLoginSuccess]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer Setup (100% Transparent background, zero fog artifacts)
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight("#F9A8D4", 3.5, 25);
    pointLight1.position.set(4, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight("#E9D5FF", 2.8, 20);
    pointLight2.position.set(-4, -3, 2);
    scene.add(pointLight2);

    // 3. 15,000 Particle "Quantum Vortex Galaxy" (ZERO BALLS, ZERO SPHERES)
    const PARTICLE_COUNT = 14000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const colorPink = new THREE.Color("#F9A8D4");
    const colorLavender = new THREE.Color("#E9D5FF");
    const colorWhite = new THREE.Color("#ffffff");

    // Generate logarithmic spiral galaxy / neural wave structure
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;

      // Logarithmic Spiral Arms + Fluid Depth
      const armIndex = i % 4;
      const armAngle = (armIndex * Math.PI * 2) / 4;
      const distance = Math.pow(Math.random(), 0.6) * 3.6 + 0.2;
      const angle = distance * 1.8 + armAngle + (Math.random() - 0.5) * 0.4;

      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance * 0.75;
      const z = (Math.random() - 0.5) * 1.8 * (1 - distance / 4);

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      originalPositions[idx] = x;
      originalPositions[idx + 1] = y;
      originalPositions[idx + 2] = z;

      velocities[idx] = (Math.random() - 0.5) * 0.005;
      velocities[idx + 1] = (Math.random() - 0.5) * 0.005;
      velocities[idx + 2] = (Math.random() - 0.5) * 0.005;

      // Color distribution: pink -> lavender -> white
      let c = colorWhite;
      const randVal = Math.random();
      if (randVal < 0.65) c = colorPink;
      else if (randVal < 0.9) c = colorLavender;

      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSystem);

    // 4. Neural Constellation Streamlines
    const LINE_MAX = 500;
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(LINE_MAX * 6);
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color("#F9A8D4"),
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // Mouse Interaction
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const state = sceneStateRef.current;
      const nextTargetX = (e.clientX / window.innerWidth) * 2 - 1;
      const nextTargetY = -(e.clientY / window.innerHeight) * 2 + 1;

      state.mouse.vx = nextTargetX - prevMouseX;
      state.mouse.vy = nextTargetY - prevMouseY;
      prevMouseX = nextTargetX;
      prevMouseY = nextTargetY;

      state.mouse.targetX = nextTargetX;
      state.mouse.targetY = nextTargetY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      const time = clock.getElapsedTime();
      const state = sceneStateRef.current;

      // Sensitive lerp tracking
      state.mouse.x += (state.mouse.targetX - state.mouse.x) * 0.15;
      state.mouse.y += (state.mouse.targetY - state.mouse.y) * 0.15;

      // Galaxy rotation & mouse tilt
      particleSystem.rotation.z = time * 0.08;
      particleSystem.rotation.y = time * 0.05 + state.mouse.x * 0.7;
      particleSystem.rotation.x = Math.sin(time * 0.08) * 0.15 - state.mouse.y * 0.7;

      const pArray = geometry.attributes.position.array as Float32Array;

      // Typing pulse decay
      if (state.typingPulseTime > 0) {
        state.typingPulseTime -= 0.025;
        particleMaterial.size = 0.045 + state.typingPulseTime * 0.04;
      } else {
        particleMaterial.size = 0.045;
      }

      // Fluid Quantum Vortex Physics
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;

        let ox = originalPositions[idx];
        let oy = originalPositions[idx + 1];
        let oz = originalPositions[idx + 2];

        // Zero-gravity fluid noise wave
        const wave = Math.sin(time * 1.6 + ox * 1.2 + oy * 1.2) * 0.25 + Math.cos(time * 1.1 + oz * 1.5) * 0.2;
        ox += ox * wave * 0.2;
        oy += oy * wave * 0.2;
        oz += oz * wave * 0.2;

        // Mouse Gravitational Vortex Influence
        const dx = pArray[idx] - state.mouse.x * 3.5;
        const dy = pArray[idx + 1] - state.mouse.y * 3.5;
        const dist = Math.hypot(dx, dy);

        let targetX = ox;
        let targetY = oy;
        let targetZ = oz;

        if (dist < 4.0) {
          // Swirl + flee repulsion from cursor
          const force = (4.0 - dist) * 1.8;
          const swirlAngle = Math.atan2(dy, dx) + force * 0.5;

          targetX += Math.cos(swirlAngle) * force * 0.8;
          targetY += Math.sin(swirlAngle) * force * 0.8;
        }

        // Login Success Implosion
        if (state.isLoginSuccess) {
          targetX *= 0.02;
          targetY *= 0.02;
          targetZ *= 0.02;
        }

        // Ultra-flowy spring return
        pArray[idx] += (targetX - pArray[idx]) * 0.035;
        pArray[idx + 1] += (targetY - pArray[idx + 1]) * 0.035;
        pArray[idx + 2] += (targetZ - pArray[idx + 2]) * 0.035;
      }
      geometry.attributes.position.needsUpdate = true;

      // Update neural constellation lines
      let lineVertexIdx = 0;
      const lineArray = lineGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < 200 && lineVertexIdx < LINE_MAX * 6; i += 3) {
        const i1 = i * 3;
        const i2 = (i + 1) * 3;

        const x1 = pArray[i1];
        const y1 = pArray[i1 + 1];
        const z1 = pArray[i1 + 2];
        const x2 = pArray[i2];
        const y2 = pArray[i2 + 1];
        const z2 = pArray[i2 + 2];

        const d = Math.hypot(x1 - x2, y1 - y2, z1 - z2);
        if (d < 1.1) {
          lineArray[lineVertexIdx++] = x1;
          lineArray[lineVertexIdx++] = y1;
          lineArray[lineVertexIdx++] = z1;
          lineArray[lineVertexIdx++] = x2;
          lineArray[lineVertexIdx++] = y2;
          lineArray[lineVertexIdx++] = z2;
        }
      }
      lineGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);

      geometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent select-none z-10">
      <div ref={containerRef} className="w-full h-full relative z-10 cursor-auto" />
    </div>
  );
}
