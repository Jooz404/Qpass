import { motion } from 'framer-motion';
import Logo from './Logo';

export default function SplashScreen({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.5, ease: 'easeInOut' }
      }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between py-12 px-6"
    >
      {/* Top spacing */}
      <div />

      {/* Center Logo with Fade In & Zoom animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          transition: { duration: 0.8, ease: 'easeOut' }
        }}
        className="flex flex-col items-center"
      >
        <Logo variant="vertical" height="70" />
      </motion.div>

      {/* Bottom info with Powered by Pertamina */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { delay: 0.4, duration: 0.6, ease: 'easeOut' }
        }}
        className="flex flex-col items-center gap-4"
      >
        {/* Subtle loading line */}
        <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-pertamina-red to-pertamina-blue rounded-full"
          />
        </div>
        
        <div className="text-center">
          <p className="text-[10px] tracking-widest text-gray-400 font-bold uppercase">
            INTEGRATED TERMINAL BITUNG
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className="text-[9px] text-gray-500 font-medium">Powered by</span>
            <span className="text-[10px] text-pertamina-red font-black tracking-tight">PERTAMINA</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
