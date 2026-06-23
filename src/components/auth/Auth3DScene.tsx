import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Auth3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Create Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    // Transparent background to let the CSS gradients show through
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Dynamic colored point lights matching our theme (rose gold, lavender, blush)
    const light1 = new THREE.PointLight(0xe8b4b8, 2, 15); // Rose Gold
    const light2 = new THREE.PointLight(0xc4b5fd, 2, 15); // Lavender
    const light3 = new THREE.PointLight(0xfda4af, 1.5, 10); // Blush
    
    scene.add(light1);
    scene.add(light2);
    scene.add(light3);

    // 3. Create Main 3D Objects Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // A. Central Frosted Glass Core Sphere
    const glassSphereGeo = new THREE.SphereGeometry(1.2, 64, 64);
    const glassSphereMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,      // Glass transparency
      opacity: 1.0,
      transparent: true,
      roughness: 0.15,
      metalness: 0.1,
      ior: 1.5,                // Index of refraction
      thickness: 1.5,          // Glass thickness
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const glassSphere = new THREE.Mesh(glassSphereGeo, glassSphereMat);
    mainGroup.add(glassSphere);

    // B. Inner Solid Core (soft glow effect)
    const innerCoreGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0xc4b5fd,
      emissive: 0xc4b5fd,
      emissiveIntensity: 0.5,
      roughness: 0.2,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    mainGroup.add(innerCore);

    // C. Orbiting Rings (representing Tasks/Agenda loops)
    // Ring 1: Lavender
    const ring1Geo = new THREE.TorusGeometry(2.0, 0.08, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xc4b5fd,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    // Ring 2: Rose Gold
    const ring2Geo = new THREE.TorusGeometry(2.3, 0.05, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xe8b4b8,
      metalness: 0.9,
      roughness: 0.15,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    mainGroup.add(ring2);

    // D. Drifting Particles / Stars (Constellation of Focus)
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Spawn particles inside a bounding sphere of radius 6
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = (Math.random() * 4.5) + 1.5;

      particlePositions[i] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = r * Math.cos(phi);
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    // Particle sprite: using standard circular point shader representation
    const pMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const starParticles = new THREE.Points(particleGeometry, pMaterial);
    scene.add(starParticles);

    // 4. Mouse Tracking for Interactive Tilts
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse coordinates to [-1, 1]
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 5. Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Slow drift & rotations
      mainGroup.rotation.y = elapsedTime * 0.15;
      
      // Rotate orbital rings at different speeds
      ring1.rotation.y = elapsedTime * 0.4;
      ring1.rotation.x = (elapsedTime * 0.2) + Math.PI / 3;

      ring2.rotation.z = -elapsedTime * 0.3;
      ring2.rotation.y = (elapsedTime * 0.1) + Math.PI / 4;

      // Animate floating star particles slightly
      starParticles.rotation.y = elapsedTime * 0.02;
      starParticles.rotation.x = -elapsedTime * 0.01;

      // Orbit point lights to cast gorgeous moving highlights on the glass core
      light1.position.x = Math.sin(elapsedTime * 0.8) * 3;
      light1.position.y = Math.cos(elapsedTime * 0.5) * 3;
      light1.position.z = Math.sin(elapsedTime * 0.3) * 3;

      light2.position.x = Math.cos(elapsedTime * 0.6) * -3;
      light2.position.y = Math.sin(elapsedTime * 0.8) * 3;
      light2.position.z = Math.cos(elapsedTime * 0.4) * 3;

      light3.position.y = Math.sin(elapsedTime * 1.2) * 2;

      // Smoothly interpolate group rotation based on mouse coordinates (lerp)
      targetX = mouseX * 0.4;
      targetY = mouseY * 0.4;

      mainGroup.rotation.x += (targetY - mainGroup.rotation.x) * 0.08;
      mainGroup.rotation.z += (targetX - mainGroup.rotation.z) * 0.08;

      // Render scene
      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 6. Handle Resizing
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 7. Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose resources
      glassSphereGeo.dispose();
      glassSphereMat.dispose();
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeometry.dispose();
      pMaterial.dispose();
      
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full min-h-[350px] lg:min-h-[500px]" />;
}
