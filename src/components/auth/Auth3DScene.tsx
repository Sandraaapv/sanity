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
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
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

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 2. Ambient & Point Lighting for Flame Emissive Glow
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const flameLight = new THREE.PointLight("#F9A8D4", 4.0, 25);
    flameLight.position.set(0, 0, 2);
    scene.add(flameLight);

    // 3. 10,000 Particle Animated Pink Flame
    const PARTICLE_COUNT = 9500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const initialY = new Float32Array(PARTICLE_COUNT);
    const flameSpeeds = new Float32Array(PARTICLE_COUNT);

    const colorWhite = new THREE.Color("#ffffff");
    const colorPink = new THREE.Color("#F9A8D4");
    const colorLavender = new THREE.Color("#E9D5FF");

    // Initialize teardrop flame particle distribution
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;

      // Vertical span from base (-2.0) to top tip (+2.2)
      const yProgress = Math.random(); // 0 to 1
      const y = -2.0 + yProgress * 4.2;

      // Flame width tapers outwards at base/mid and pinches tightly at the top
      const taper = Math.sin(Math.PI * yProgress) * (1.2 * Math.pow(1 - yProgress * 0.4, 1.2));
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * taper * 0.95;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.8;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      initialY[i] = y;
      flameSpeeds[i] = 0.015 + Math.random() * 0.025;

      velocities[idx] = (Math.random() - 0.5) * 0.005;
      velocities[idx + 1] = flameSpeeds[i];
      velocities[idx + 2] = (Math.random() - 0.5) * 0.005;

      // Emissive Color Gradient: White at core base -> Pink at mid -> Lavender at flickering tips
      let c = colorPink;
      if (yProgress < 0.25) {
        c = Math.random() < 0.5 ? colorWhite : colorPink;
      } else if (yProgress < 0.75) {
        c = Math.random() < 0.7 ? colorPink : colorLavender;
      } else {
        c = Math.random() < 0.4 ? colorPink : colorLavender;
      }

      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.052,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const flameMesh = new THREE.Points(geometry, particleMaterial);
    scene.add(flameMesh);

    // Mouse Interaction setup
    const handleMouseMove = (e: MouseEvent) => {
      const state = sceneStateRef.current;
      state.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      state.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      const time = clock.getElapsedTime();
      const state = sceneStateRef.current;

      // Smooth mouse lerp
      state.mouse.x += (state.mouse.targetX - state.mouse.x) * 0.1;
      state.mouse.y += (state.mouse.targetY - state.mouse.y) * 0.1;

      // Flame bends and sways toward/away from cursor movement (like wind)
      const windSwayX = Math.sin(time * 2.8) * 0.15 + state.mouse.x * 0.7;
      const windSwayZ = Math.cos(time * 2.2) * 0.1 - state.mouse.y * 0.5;

      flameMesh.rotation.z = -windSwayX * 0.25;
      flameMesh.rotation.y = time * 0.2 + state.mouse.x * 0.4;
      flameMesh.position.x = windSwayX * 0.4;

      // Flame intensity pulse on keypress
      if (state.typingPulseTime > 0) {
        state.typingPulseTime -= 0.025;
        particleMaterial.size = 0.052 + state.typingPulseTime * 0.04;
        flameLight.intensity = 4.0 + state.typingPulseTime * 3.0;
      } else {
        particleMaterial.size = 0.052;
        flameLight.intensity = 4.0 + Math.sin(time * 5.0) * 0.4;
      }

      const pArray = geometry.attributes.position.array as Float32Array;

      // Continuous Rising Flame Embers Physics
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;

        // Rise upwards continuously
        pArray[idx + 1] += flameSpeeds[i];

        // Sinuous flickers as particles ascend
        const currY = pArray[idx + 1];
        const yNorm = Math.min(Math.max((currY + 2.0) / 4.2, 0), 1);

        // Sinusoidal licking wave turbulence
        const waveX = Math.sin(time * 4.0 + currY * 2.5) * 0.012 * (1 + yNorm * 1.5);
        const waveZ = Math.cos(time * 3.5 + currY * 2.5) * 0.012 * (1 + yNorm * 1.5);

        pArray[idx] += waveX;
        pArray[idx + 2] += waveZ;

        // Mouse repulsion / wind displacement
        const mdx = pArray[idx] - state.mouse.x * 3.0;
        const mdy = currY - state.mouse.y * 3.0;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < 2.5) {
          const force = (2.5 - mdist) * 0.02;
          pArray[idx] += (mdx / mdist) * force;
        }

        // Recycle particles that reach top tip (+2.2) back to base (-2.0)
        if (pArray[idx + 1] > 2.2) {
          const newYProgress = Math.random() * 0.2; // Respawn near base
          const newY = -2.0 + newYProgress * 1.0;

          const taper = Math.sin(Math.PI * newYProgress) * 1.2;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * taper * 0.8;

          pArray[idx] = Math.cos(angle) * radius;
          pArray[idx + 1] = newY;
          pArray[idx + 2] = Math.sin(angle) * radius * 0.8;
        }

        // Login Success Flare
        if (state.isLoginSuccess) {
          pArray[idx + 1] += 0.15;
          particleMaterial.size = 0.08;
        }
      }

      geometry.attributes.position.needsUpdate = true;

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
      flameLight.dispose();
      ambientLight.dispose();

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
