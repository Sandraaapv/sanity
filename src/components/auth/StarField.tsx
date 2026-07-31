import { useEffect, useRef } from "react";

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Generate 150 stars (65% pink #F9A8D4, 35% white)
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.2 + 0.3, // 0.3px – 1.5px
      opacity: Math.random(),
      speed: Math.random() * 0.02 + 0.005, // blink speed
      phase: Math.random() * Math.PI * 2, // offset so they don't blink together
      pink: Math.random() > 0.35, // 65% pink, 35% white
    }));

    let animFrame: number;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        // Sine wave opacity — smooth blink between 0.2 and 1.0
        const opacity = 0.2 + 0.8 * Math.abs(Math.sin(t * star.speed + star.phase));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.pink
          ? `rgba(249, 168, 212, ${opacity})` // #F9A8D4 SANITY Pink
          : `rgba(255, 255, 255, ${opacity})`; // White
        ctx.fill();
      });

      t++;
      animFrame = requestAnimationFrame(draw);
    };

    draw();

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        background: "#000000",
        pointerEvents: "none",
      }}
    />
  );
}
export default StarField;
