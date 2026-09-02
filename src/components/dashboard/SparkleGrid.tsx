import { useEffect, useRef } from "react";

interface Sparkle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  maxOpacity: number;
  pulse: number;
  pulseSpeed: number;
  color: string;
}

export function SparkleGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = [
      "rgba(0, 229, 255, ",   // Neon Cyan
      "rgba(16, 185, 129, ",  // Emerald
      "rgba(56, 189, 248, ",  // Sky Blue
      "rgba(255, 255, 255, ", // Star White
    ];

    const count = 75;
    const sparkles: Sparkle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.8 + 0.8,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.25,
      maxOpacity: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.03 + 0.015,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.y += s.speedY;
        s.x += s.speedX;
        s.pulse += s.pulseSpeed;

        if (s.y < -10) {
          s.y = height + 10;
          s.x = Math.random() * width;
        }
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        const currentOpacity = (Math.sin(s.pulse) * 0.4 + 0.6) * s.maxOpacity;

        const dx = mouseX - s.x;
        const dy = mouseY - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let bonusGlow = 0;
        if (dist < 180) {
          bonusGlow = (1 - dist / 180) * 0.6;
        }

        const finalOpacity = Math.min(1, currentOpacity + bonusGlow);

        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${finalOpacity})`;
        ctx.shadowColor = "rgba(0, 229, 255, 0.9)";
        ctx.shadowBlur = s.size * 5;
        ctx.fill();

        // Draw cross-sparkle twinkle star rays for medium/large particles
        if (s.size > 1.8) {
          ctx.strokeStyle = `${s.color}${finalOpacity * 0.7})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          const ray = s.size * 2.5;
          ctx.moveTo(s.x - ray, s.y);
          ctx.lineTo(s.x + ray, s.y);
          ctx.moveTo(s.x, s.y - ray);
          ctx.lineTo(s.x, s.y + ray);
          ctx.stroke();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90"
    />
  );
}
