import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { viewportOnce } from "../lib/motion";

interface RevealProps {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
}

/** Scroll-triggered reveal with the site's soft easing. */
export function Reveal({ children, variants, className, delay = 0 }: RevealProps) {
  const base: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay } },
  };
  return (
    <motion.div
      className={className}
      variants={variants ?? base}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      {children}
    </motion.div>
  );
}
