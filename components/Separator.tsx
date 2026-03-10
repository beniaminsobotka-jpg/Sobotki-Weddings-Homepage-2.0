import React from 'react';
import { motion } from 'framer-motion';
import { Asterisk } from 'lucide-react';

export const Separator: React.FC = () => {
  return (
    <div className="w-full flex justify-center items-center py-12 md:py-24 overflow-hidden">
      <div className="relative w-full max-w-[1400px] px-6 flex items-center justify-center gap-4">
        
        {/* Left Line */}
        <motion.div 
          initial={{ scaleX: 0, originX: 1 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="h-[1px] bg-brand-black/10 flex-grow"
        />

        {/* Center Icon */}
        <motion.div
          initial={{ rotate: -90, opacity: 0, scale: 0 }}
          whileInView={{ rotate: 0, opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, ease: "backOut" }}
          className="text-brand-black/30"
        >
           <Asterisk size={14} />
        </motion.div>

        {/* Right Line */}
        <motion.div 
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="h-[1px] bg-brand-black/10 flex-grow"
        />
        
      </div>
    </div>
  );
};