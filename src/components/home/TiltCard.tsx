import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import styles from './TiltCard.module.css';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

// Thẻ nghiêng 3D theo con trỏ + tự đảo nhẹ khi không hover (dùng cho CTA/Footer).
export function TiltCard({ children, className = '', glowColor = 'rgba(249,115,22,0.12)' }: TiltCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 200, damping: 25 });

  const shineX = useTransform(x, [0, 1], ['-30%', '130%']);
  const shineY = useTransform(y, [0, 1], ['-30%', '130%']);

  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  useEffect(() => {
    if (isHovered) return;
    const controlsX = animate(x, [0.35, 0.65, 0.35], {
      duration: 6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut',
    });
    const controlsY = animate(y, [0.65, 0.35, 0.65], {
      duration: 7, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut',
    });
    return () => {
      controlsX.stop();
      controlsY.stop();
    };
  }, [isHovered, x, y]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    setIsHovered(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width);
    y.set(mouseY / rect.height);
    glowX.set(mouseX);
    glowY.set(mouseY);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  }

  const borderBg = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(280px circle at ${gx}px ${gy}px, rgba(249,115,22,0.35), transparent 70%)`,
  );

  const centerGlow = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(350px circle at ${gx}px ${gy}px, ${glowColor}, transparent 80%)`,
  );

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={`relative p-[1px] rounded-3xl overflow-hidden transition-all duration-300 ${className}`}
    >
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: borderBg }}
      />

      <div
        className={`h-full w-full rounded-[23px] bg-slate-950/85 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden ${styles.preserve3d}`}
      >
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[23px]"
          style={{ background: centerGlow }}
        />

        <motion.div
          className="pointer-events-none absolute w-[150%] h-[150%] -left-1/4 -top-1/4 opacity-0 group-hover:opacity-20 transition-opacity duration-300 mix-blend-overlay bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,transparent_60%)]"
          style={{ x: shineX, y: shineY }}
        />

        <div className={`relative z-10 h-full w-full ${styles.layerZ20}`}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
