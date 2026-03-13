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
      initial={{ 
        opacity: 0, 
        y: 60, 
        scale: 0.98,
        filter: 'blur(8px)' 
      }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        filter: 'blur(0px)' 
      }}
      // once: false sprawia, że animacja odtwarza się za każdym razem, gdy element wchodzi w widok
      // amount: 0.15 oznacza, że animacja startuje, gdy 15% elementu jest widoczne
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -50px 0px" }}
      transition={{ 
        duration: 0.9, 
        ease: [0.16, 1, 0.3, 1], // Bardzo płynna krzywa "editorial"
        delay: delay 
      }}
    >
      {children}
    </motion.div>
  );
};
