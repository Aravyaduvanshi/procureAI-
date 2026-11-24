import React, { useEffect, useRef } from 'react';

/**
 * MyceliumNetwork: A lightweight, generative HTML5 canvas rendering
 * fine interconnected mycelial filaments with glowing nodes and subtle signal propagation.
 */
export default function MyceliumNetwork({ 
  className = '', 
  nodeCount = 38,
  accent = 'mixed',
  interactive = true 
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate Nodes
    const nodes = [];
    const actualNodeCount = Math.min(nodeCount, Math.floor((width * height) / 22000) + 18);

    for (let i = 0; i < actualNodeCount; i++) {
      // Concentrate slightly more towards the right half / center-right as in reference image
      const biasX = Math.random() > 0.35 ? 0.4 + Math.random() * 0.6 : Math.random();
      nodes.push({
        x: biasX * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        baseRadius: Math.random() * 2 + 1.2,
        isBrass: Math.random() < 0.22, // 22% Antique Brass, rest Lichen Sage
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02
      });
    }

    // Signals propagating along filaments
    const signals = [];
    function spawnSignal() {
      if (signals.length < 12 && nodes.length > 2) {
        const fromIdx = Math.floor(Math.random() * nodes.length);
        // Find a nearby neighbor
        let bestDist = Infinity;
        let toIdx = -1;
        for (let j = 0; j < nodes.length; j++) {
          if (j === fromIdx) continue;
          const dx = nodes[j].x - nodes[fromIdx].x;
          const dy = nodes[j].y - nodes[fromIdx].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist < bestDist) {
            bestDist = dist;
            toIdx = j;
          }
        }
        if (toIdx !== -1) {
          signals.push({
            from: fromIdx,
            to: toIdx,
            progress: 0,
            speed: 0.008 + Math.random() * 0.012,
            isBrass: nodes[fromIdx].isBrass || nodes[toIdx].isBrass
          });
        }
      }
    }

    let lastTime = 0;
    const maxConnectionDistance = 190;

    function render(currentTime) {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, width, height);

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!prefersReducedMotion) {
          n.x += n.vx;
          n.y += n.vy;

          if (n.x < -20) n.x = width + 20;
          if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20;
          if (n.y > height + 20) n.y = -20;
        }

        n.pulsePhase += n.pulseSpeed;
      }

      // Draw Filaments
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDistance) {
            const alpha = (1 - dist / maxConnectionDistance) * 0.35;
            const isBrassLine = nodes[i].isBrass && nodes[j].isBrass;

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);

            // Subtle organic curve through midpoint with slight offset
            const midX = (nodes[i].x + nodes[j].x) / 2 + (Math.sin(nodes[i].pulsePhase) * 6);
            const midY = (nodes[i].y + nodes[j].y) / 2 + (Math.cos(nodes[j].pulsePhase) * 6);
            ctx.quadraticCurveTo(midX, midY, nodes[j].x, nodes[j].y);

            ctx.strokeStyle = isBrassLine
              ? `rgba(209, 184, 120, ${alpha * 1.2})`
              : `rgba(168, 185, 154, ${alpha})`;
            ctx.lineWidth = isBrassLine ? 1.0 : 0.75;
            ctx.stroke();
          }
        }
      }

      // Update & Draw Signals
      if (!prefersReducedMotion) {
        if (Math.random() < 0.08) spawnSignal();

        for (let s = signals.length - 1; s >= 0; s--) {
          const sig = signals[s];
          sig.progress += sig.speed;

          if (sig.progress >= 1) {
            signals.splice(s, 1);
            continue;
          }

          const fromNode = nodes[sig.from];
          const toNode = nodes[sig.to];
          if (!fromNode || !toNode) {
            signals.splice(s, 1);
            continue;
          }

          const curX = fromNode.x + (toNode.x - fromNode.x) * sig.progress;
          const curY = fromNode.y + (toNode.y - fromNode.y) * sig.progress;

          ctx.beginPath();
          ctx.arc(curX, curY, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = sig.isBrass ? '#D1B878' : '#C4D4B6';
          ctx.shadowColor = sig.isBrass ? 'rgba(209, 184, 120, 0.7)' : 'rgba(168, 185, 154, 0.7)';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      // Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = Math.sin(n.pulsePhase) * 0.4 + 1.0;
        const currentRadius = n.baseRadius * pulse;

        // Outer soft glow for key nodes
        if (n.baseRadius > 2.2) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, currentRadius * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = n.isBrass ? 'rgba(209, 184, 120, 0.08)' : 'rgba(168, 185, 154, 0.08)';
          ctx.fill();
        }

        // Core Node
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = n.isBrass ? '#D1B878' : '#A8B99A';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [nodeCount, accent]);

  return (
    <div className={`mycelium-canvas-container ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
