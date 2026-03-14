import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Atmospheric background layer for the PrakritiLens landing page.
 * Renders behind all content — purely decorative, no UI impact.
 * Reduces particle count on mobile for performance.
 */
export const ESGBackground = () => {
  const isMobile = useIsMobile();

  const particleCount = isMobile ? 15 : 45;
  const nodeCount = isMobile ? 6 : 12;
  const lineCount = isMobile ? 4 : 8;

  // Memoize random positions so they don't re-generate on every render
  const particles = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 6,
    })), [particleCount]);

  const gridNodes = useMemo(() =>
    Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      delay: Math.random() * 3,
    })), [nodeCount]);

  const connectionLines = useMemo(() =>
    Array.from({ length: lineCount }, (_, i) => ({
      id: i,
      x1: 10 + Math.random() * 80,
      y1: 10 + Math.random() * 80,
      x2: 10 + Math.random() * 80,
      y2: 10 + Math.random() * 80,
      delay: Math.random() * 4,
    })), [lineCount]);

  return (
    <div className="esg-bg-layer" aria-hidden="true">
      {/* Deep radial gradient overlays */}
      <div className="esg-bg-gradient-mesh" />

      {/* Faint hex/sustainability grid */}
      <div className="esg-bg-grid" />

      {/* SVG connection lines (data network) */}
      <svg className="esg-bg-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {connectionLines.map((line) => (
          <motion.line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="rgba(16,185,129,0.06)"
            strokeWidth="0.15"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.4, 0] }}
            transition={{
              duration: 6 + line.delay,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: line.delay,
            }}
          />
        ))}
      </svg>

      {/* Glowing data nodes */}
      {gridNodes.map((node) => (
        <motion.div
          key={`node-${node.id}`}
          className="esg-bg-node"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.15, 0.5, 0.15],
            boxShadow: [
              '0 0 4px rgba(16,185,129,0.2)',
              '0 0 16px rgba(16,185,129,0.5)',
              '0 0 4px rgba(16,185,129,0.2)',
            ],
          }}
          transition={{
            duration: 4 + node.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: node.delay,
          }}
        />
      ))}

      {/* Floating particles (AI data points) */}
      {particles.map((p) => (
        <motion.div
          key={`particle-${p.id}`}
          className="esg-bg-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [-15, 15, -15],
            x: [-8, 8, -8],
            opacity: [0.1, 0.6, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}

      {/* Large ambient glow orbs */}
      <motion.div
        className="esg-bg-orb esg-bg-orb--1"
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="esg-bg-orb esg-bg-orb--2"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="esg-bg-orb esg-bg-orb--3"
        animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
    </div>
  );
};
