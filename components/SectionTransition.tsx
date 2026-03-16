import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const SectionTransition: React.FC<Props> = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      className={`content-visibility-auto ${className}`.trim()}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -50px 0px" }}
      transition={{
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
        delay: delay
      }}
    >
      {children}
    </motion.div>
  );
};
