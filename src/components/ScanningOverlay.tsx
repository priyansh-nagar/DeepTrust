import { motion } from 'framer-motion';

interface ScanningOverlayProps {
  isScanning: boolean;
}

export function ScanningOverlay({ isScanning }: ScanningOverlayProps) {
  if (!isScanning) return null;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />

      {/* Scanning line */}
      <motion.div
        initial={{ y: '-100%' }}
        animate={{ y: '200%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-primary to-transparent"
        style={{
          boxShadow: '0 0 30px 15px hsl(250 90% 55% / 0.3)',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(hsl(250 90% 55% / 0.15) 1px, transparent 1px),
            linear-gradient(90deg, hsl(250 90% 55% / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary" />

      {/* Status text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-primary border-t-transparent animate-spin"
          />
          <p className="font-mono text-primary text-sm tracking-wider">ANALYZING</p>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-mono text-muted-foreground text-xs mt-1"
          >
            Detecting AI signatures...
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
