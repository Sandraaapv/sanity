import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Auth3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = width < height ? 9.8 : 7.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc4b5fd, 0.4); // Subtle lavender fill light
    dirLight2.position.set(-5, -5, 2);
    scene.add(dirLight2);

    // Color point lights to cast glowing reflections
    const lightRose = new THREE.PointLight(0xe8b4b8, 1.8, 12); // Rose Gold
    const lightLavender = new THREE.PointLight(0xc4b5fd, 1.8, 12); // Lavender
    scene.add(lightRose);
    scene.add(lightLavender);

    // 3. Materials System (shared tokens matching the theme)
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xe8b4b8, // Rose Gold metal
      metalness: 0.9,
      roughness: 0.15,
    });

    const lavenderMetalMat = new THREE.MeshStandardMaterial({
      color: 0xc4b5fd, // Lavender metal
      metalness: 0.85,
      roughness: 0.2,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1.0,
      transparent: true,
      roughness: 0.08,
      thickness: 0.8,
      ior: 1.45,
    });

    const pageMat = new THREE.MeshStandardMaterial({
      color: 0xfdfbf7, // Warm ivory sheet
      roughness: 0.7,
    });

    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xc4b5fd, // Glowing sand
      roughness: 0.9,
    });

    // 4. Create Main Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // ==========================================
    // A. CENTRAL MODEL: STUDY TIMER (HOURGLASS)
    // ==========================================
    const hourglassGroup = new THREE.Group();
    mainGroup.add(hourglassGroup);

    // Flat end plates
    const plateGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.06, 32);
    const topPlate = new THREE.Mesh(plateGeo, metalMat);
    topPlate.position.y = 1.0;
    const bottomPlate = new THREE.Mesh(plateGeo, metalMat);
    bottomPlate.position.y = -1.0;
    hourglassGroup.add(topPlate, bottomPlate);

    // 3 Support pillars
    const pillarGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.0, 12);
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const pillar = new THREE.Mesh(pillarGeo, metalMat);
      pillar.position.set(Math.cos(angle) * 0.58, 0, Math.sin(angle) * 0.58);
      hourglassGroup.add(pillar);
    }

    // Glass bulb cones meeting in center
    const topBulbGeo = new THREE.ConeGeometry(0.52, 0.95, 32, 1, true);
    const topBulb = new THREE.Mesh(topBulbGeo, glassMat);
    topBulb.position.y = 0.475;
    topBulb.rotation.x = Math.PI;

    const bottomBulbGeo = new THREE.ConeGeometry(0.52, 0.95, 32, 1, true);
    const bottomBulb = new THREE.Mesh(bottomBulbGeo, glassMat);
    bottomBulb.position.y = -0.475;

    hourglassGroup.add(topBulb, bottomBulb);

    // Sand Piles
    const topSandGeo = new THREE.ConeGeometry(0.48, 0.85, 24);
    const topSand = new THREE.Mesh(topSandGeo, sandMat);
    topSand.position.y = 0.425;
    topSand.rotation.x = Math.PI;
    hourglassGroup.add(topSand);

    const bottomSandGeo = new THREE.ConeGeometry(0.48, 0.85, 24);
    const bottomSand = new THREE.Mesh(bottomSandGeo, sandMat);
    bottomSand.position.y = -0.575;
    hourglassGroup.add(bottomSand);

    // Sand falling stream particles
    const sandParticlesCount = 35;
    const sandGeometry = new THREE.BufferGeometry();
    const sandPositions = new Float32Array(sandParticlesCount * 3);
    for (let i = 0; i < sandParticlesCount; i++) {
      sandPositions[i * 3] = (Math.random() - 0.5) * 0.04;
      sandPositions[i * 3 + 1] = (Math.random() * 0.85) - 0.425;
      sandPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    sandGeometry.setAttribute("position", new THREE.BufferAttribute(sandPositions, 3));
    const sandStreamMat = new THREE.PointsMaterial({
      color: 0xc4b5fd,
      size: 0.04,
      transparent: true,
      opacity: 0.8,
    });
    const sandStream = new THREE.Points(sandGeometry, sandStreamMat);
    hourglassGroup.add(sandStream);

    // ==========================================
    // B. FLOATING ORBITER 1: NOTES (SPIRAL NOTEBOOK)
    // ==========================================
    const notebookGroup = new THREE.Group();
    notebookGroup.scale.set(1.1, 1.1, 1.1);
    mainGroup.add(notebookGroup);

    // Left page cover & page
    const leftPageCoverGeo = new THREE.BoxGeometry(0.38, 0.55, 0.015);
    const leftPageCover = new THREE.Mesh(leftPageCoverGeo, metalMat);
    leftPageCover.position.set(-0.2, 0, -0.01);
    leftPageCover.rotation.y = 0.2;

    const leftPageGeo = new THREE.BoxGeometry(0.36, 0.53, 0.01);
    const leftPage = new THREE.Mesh(leftPageGeo, pageMat);
    leftPage.position.set(-0.19, 0, 0.005);
    leftPage.rotation.y = 0.2;

    // Right page cover & page
    const rightPageCoverGeo = new THREE.BoxGeometry(0.38, 0.55, 0.015);
    const rightPageCover = new THREE.Mesh(rightPageCoverGeo, metalMat);
    rightPageCover.position.set(0.2, 0, -0.01);
    rightPageCover.rotation.y = -0.2;

    const rightPageGeo = new THREE.BoxGeometry(0.36, 0.53, 0.01);
    const rightPage = new THREE.Mesh(rightPageGeo, pageMat);
    rightPage.position.set(0.19, 0, 0.005);
    rightPage.rotation.y = -0.2;

    notebookGroup.add(leftPageCover, leftPage, rightPageCover, rightPage);

    // Spiral Binder Rings
    const ringGeo = new THREE.TorusGeometry(0.045, 0.012, 8, 24);
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(ringGeo, lavenderMetalMat);
      ring.position.set(0, -0.18 + i * 0.09, 0.02);
      ring.rotation.x = Math.PI / 2;
      notebookGroup.add(ring);
    }

    // ==========================================
    // C. FLOATING ORBITER 2: TASKS (CHECKBOX & CHECKMARK)
    // ==========================================
    const tasksGroup = new THREE.Group();
    tasksGroup.scale.set(1.1, 1.1, 1.1);
    mainGroup.add(tasksGroup);

    // Box Outline (4 outer thin boxes)
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xe8b4b8,
      metalness: 0.8,
      roughness: 0.2,
    });
    const sideH = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.05), borderMat);
    const sideH2 = sideH.clone();
    const sideV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.05), borderMat);
    const sideV2 = sideV.clone();

    sideH.position.y = 0.275;
    sideH2.position.y = -0.275;
    sideV.position.x = -0.275;
    sideV2.position.x = 0.275;

    tasksGroup.add(sideH, sideH2, sideV, sideV2);

    // Glowing Checkmark
    const checkMat = new THREE.MeshStandardMaterial({
      color: 0xc4b5fd,
      emissive: 0xc4b5fd,
      emissiveIntensity: 0.6,
      roughness: 0.1,
    });
    const checkShort = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), checkMat);
    checkShort.position.set(-0.06, -0.05, 0.04);
    checkShort.rotation.z = -Math.PI / 4;

    const checkLong = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), checkMat);
    checkLong.position.set(0.07, 0.04, 0.04);
    checkLong.rotation.z = Math.PI / 4;

    tasksGroup.add(checkShort, checkLong);

    // ==========================================
    // D. FLOATING ORBITER 3: AGENDA (CALENDAR PAGE)
    // ==========================================
    const agendaGroup = new THREE.Group();
    agendaGroup.scale.set(1.1, 1.1, 1.1);
    mainGroup.add(agendaGroup);

    // Calendar plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.02), pageMat);
    agendaGroup.add(plate);

    // Red header bar
    const redHeader = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.12, 0.022),
      new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.5 }) // Blush
    );
    redHeader.position.y = 0.2;
    agendaGroup.add(redHeader);

    // Hanging loops
    const loopGeo = new THREE.TorusGeometry(0.04, 0.01, 8, 20);
    const loopL = new THREE.Mesh(loopGeo, lavenderMetalMat);
    loopL.position.set(-0.13, 0.26, 0);
    loopL.rotation.y = Math.PI / 2;
    const loopR = new THREE.Mesh(loopGeo, lavenderMetalMat);
    loopR.position.set(0.13, 0.26, 0);
    loopR.rotation.y = Math.PI / 2;
    agendaGroup.add(loopL, loopR);

    // Small calendar days grids
    const gridMat = new THREE.MeshStandardMaterial({ color: 0xe8b4b8, roughness: 0.7 });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const dot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.005), gridMat);
        dot.position.set(-0.16 + c * 0.11, 0.04 - r * 0.11, 0.012);
        agendaGroup.add(dot);
      }
    }

    // ==========================================
    // E. DRIFTING PARTICLES
    // ==========================================
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = (Math.random() * 4.0) + 1.2;

      particlePositions[i] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = r * Math.cos(phi);
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const pMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
    });
    const stars = new THREE.Points(particleGeometry, pMaterial);
    scene.add(stars);

    // 5. Interaction variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 6. Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // A. Hourglass core rotation
      hourglassGroup.rotation.y = elapsedTime * 0.3;
      hourglassGroup.rotation.z = Math.sin(elapsedTime * 0.25) * 0.08;

      // Animate falling sand pile values (Looping 10s cycles)
      const sandCycle = (elapsedTime * 0.08) % 1.0;
      topSand.scale.set(1 - sandCycle * 0.85, 1 - sandCycle * 0.85, 1 - sandCycle * 0.85);
      bottomSand.scale.set(0.15 + sandCycle * 0.85, 0.15 + sandCycle * 0.85, 0.15 + sandCycle * 0.85);

      // Animate falling sand stream particles
      const positions = sandGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < sandParticlesCount; i++) {
        positions[i * 3 + 1] -= 0.018; // Drop vertically
        if (positions[i * 3 + 1] < -0.47) {
          positions[i * 3 + 1] = 0.42; // Reset at nozzle
          positions[i * 3] = (Math.random() - 0.5) * 0.035;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.035;
        }
      }
      sandGeometry.attributes.position.needsUpdate = true;

      // B. Drifting orbiters (bobbing with phase shifts)
      // Notes Notebook
      notebookGroup.position.x = -2.0 + Math.sin(elapsedTime * 0.5) * 0.15;
      notebookGroup.position.y = 1.3 + Math.cos(elapsedTime * 0.8) * 0.15;
      notebookGroup.position.z = 0.4 + Math.sin(elapsedTime * 0.4) * 0.1;
      notebookGroup.rotation.y = elapsedTime * 0.2;
      notebookGroup.rotation.x = Math.sin(elapsedTime * 0.4) * 0.08;

      // Tasks Checkbox
      tasksGroup.position.x = 2.1 + Math.cos(elapsedTime * 0.4 + 1.0) * 0.15;
      tasksGroup.position.y = 1.1 + Math.sin(elapsedTime * 0.7 + 1.5) * 0.15;
      tasksGroup.position.z = 0.2 + Math.cos(elapsedTime * 0.5) * 0.1;
      tasksGroup.rotation.y = -elapsedTime * 0.2;
      tasksGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1 + 0.35; // Continuous tilt
      tasksGroup.rotation.z = Math.cos(elapsedTime * 0.3) * 0.08 + 0.2;

      // Agenda Calendar
      agendaGroup.position.x = -1.9 + Math.sin(elapsedTime * 0.6 + 2.0) * 0.15;
      agendaGroup.position.y = -1.2 + Math.sin(elapsedTime * 0.9) * 0.15;
      agendaGroup.position.z = 0.3 + Math.cos(elapsedTime * 0.6) * 0.1;
      agendaGroup.rotation.y = elapsedTime * 0.15;
      agendaGroup.rotation.x = Math.cos(elapsedTime * 0.5) * 0.08;

      // C. Shifting light patterns
      lightRose.position.x = Math.sin(elapsedTime * 0.6) * 3;
      lightRose.position.y = Math.cos(elapsedTime * 0.4) * 3;
      lightLavender.position.x = Math.cos(elapsedTime * 0.5) * -3;
      lightLavender.position.y = Math.sin(elapsedTime * 0.7) * 3;

      // D. Stars rotation
      stars.rotation.y = elapsedTime * 0.015;

      // E. Interactive Mouse Tilts
      targetX = mouseX * 0.35;
      targetY = mouseY * 0.35;

      mainGroup.rotation.x += (targetY - mainGroup.rotation.x) * 0.08;
      mainGroup.rotation.y += (targetX - mainGroup.rotation.y) * 0.08;

      // Render frame
      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Zoom out if portrait aspect ratio (w < h) to fit the orbiters
      if (w < h) {
        camera.position.z = 9.8;
      } else {
        camera.position.z = 7.5;
      }

      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 8. Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose Geometries
      plateGeo.dispose();
      pillarGeo.dispose();
      topBulbGeo.dispose();
      bottomBulbGeo.dispose();
      topSandGeo.dispose();
      bottomSandGeo.dispose();
      sandGeometry.dispose();
      leftPageCoverGeo.dispose();
      leftPageGeo.dispose();
      rightPageCoverGeo.dispose();
      rightPageGeo.dispose();
      ringGeo.dispose();
      sideH.geometry.dispose();
      sideV.geometry.dispose();
      checkShort.geometry.dispose();
      checkLong.geometry.dispose();
      plate.geometry.dispose();
      redHeader.geometry.dispose();
      loopGeo.dispose();
      particleGeometry.dispose();

      // Dispose Materials
      metalMat.dispose();
      lavenderMetalMat.dispose();
      glassMat.dispose();
      pageMat.dispose();
      sandMat.dispose();
      sandStreamMat.dispose();
      borderMat.dispose();
      checkMat.dispose();
      pMaterial.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full relative" />;
}
