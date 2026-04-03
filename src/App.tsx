import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Cpu, MemoryStick, MonitorSmartphone, Sun, Moon, Info, X, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

interface Specs {
  gpu: string;
  cpu: string;
  ram: string;
  os: string;
  hasWebGPU: boolean;
}

export default function App() {
  const [specs, setSpecs] = useState<Specs | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const detectSpecs = () => {
      // 1. GPU Detection
      let gpu = 'Unknown GPU';
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const rawGpu = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            
            let cleanGpu = rawGpu;
            // 1. Extract the hardware name from ANGLE strings
            const angleMatch = cleanGpu.match(/ANGLE \([^,]+,\s*([^,]+)/i);
            if (angleMatch && angleMatch[1]) {
              cleanGpu = angleMatch[1];
            }
            // 2. Strip graphics API suffixes
            cleanGpu = cleanGpu.replace(/\s+(Direct3D|OpenGL|Vulkan).*/i, '');
            // 3. Strip PCI device IDs like (0x000028E0) or incomplete ones like (0x000028E0
            cleanGpu = cleanGpu.replace(/\s*\(\s*0x[0-9a-fA-F]+\s*\)?/i, '');
            // 4. Final cleanup
            gpu = cleanGpu.replace(/[,)]$/, '').trim();
          }
        }
      } catch (e) {
        console.error('GPU detection failed', e);
      }

      // 2. CPU Cores Detection
      const cpu = navigator.hardwareConcurrency 
        ? `${navigator.hardwareConcurrency} Threads` 
        : 'Unknown';

      // 3. RAM Detection
      const nav = navigator as any;
      const ram = nav.deviceMemory 
        ? `≥ ${nav.deviceMemory} GB` 
        : 'Unknown';

      // 4. OS Detection
      let os = 'Unidentified Platform';
      const ua = navigator.userAgent;
      
      // Detect iOS (including modern iPads which report as Macintosh)
      const isIOS = /iPhone|iPad|iPod/i.test(ua) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        os = 'iOS';
      } else if (/Android/i.test(ua)) {
        os = 'Android';
      } else if (/Windows/i.test(ua)) {
        os = 'Windows';
      } else if (/Mac/i.test(ua)) {
        os = 'macOS';
      } else if (/Linux/i.test(ua)) {
        os = 'Linux';
      }

      // 5. WebGPU Detection
      const hasWebGPU = 'gpu' in navigator;

      setSpecs({ gpu, cpu, ram, os, hasWebGPU });
    };

    const timer = setTimeout(() => {
      detectSpecs();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-200 font-sans transition-colors duration-300 flex flex-col">
      {/* Top Nav */}
      <header className="w-full p-4 flex justify-between items-center text-sm font-mono text-neutral-500">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-green-600 dark:text-green-500" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Battlestation<span className="text-green-600 dark:text-green-500">.detect</span></span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setIsModalOpen(true)} className="hover:text-neutral-900 dark:hover:text-white transition-colors">[how it works]</button>
          <button onClick={toggleTheme} className="hover:text-neutral-900 dark:hover:text-white transition-colors" aria-label="Toggle dark mode">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-green-600 dark:text-green-500 mb-4">
            What's My Battlestation?
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-base md:text-lg">
            Find out what hardware your browser can actually see.
          </p>
        </motion.div>

        {/* Horizontal Spec Bar */}
        <div className="w-full">
          {specs ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-x-8 gap-y-8 py-8 border-y border-neutral-200 dark:border-neutral-800/60"
            >
              <SpecItem icon={<Monitor />} label="GPU" value={specs.gpu} />
              <Divider />
              <SpecItem icon={<MemoryStick />} label="RAM" value={specs.ram} hasAsterisk onAsteriskClick={() => setIsModalOpen(true)} />
              <Divider />
              <SpecItem icon={<Cpu />} label="CORES" value={specs.cpu} hasAsterisk onAsteriskClick={() => setIsModalOpen(true)} />
              <Divider />
              <SpecItem icon={<MonitorSmartphone />} label="OS" value={specs.os} />
            </motion.div>
          ) : (
            <div className="flex justify-center items-center py-12 border-y border-neutral-200 dark:border-neutral-800/60">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Disclaimer & Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs sm:text-sm text-neutral-500 dark:text-neutral-500"
        >
          <p>Estimates based on browser APIs. Actual specs may vary.</p>
          {specs?.hasWebGPU ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> WebGPU
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> No WebGPU
            </span>
          )}
        </motion.div>
      </main>

      {/* Info Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800/60 flex-shrink-0">
                <h2 className="text-xl font-semibold text-green-600 dark:text-green-500">Why are some values wrong? (*)</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto font-mono text-sm">
                <p className="text-neutral-600 dark:text-neutral-400 mb-8 font-sans text-base">
                  Browsers intentionally restrict hardware APIs to prevent <strong className="text-neutral-900 dark:text-neutral-200">fingerprinting</strong> (tracking you across sites based on your unique hardware combo).
                </p>

                <div className="space-y-8">
                  <InfoSection 
                    title="RAM (Memory) is capped" 
                    api="navigator.deviceMemory"
                    url="https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory"
                    description="Even if you have 32GB or 64GB of RAM, browsers will typically cap this value at 8GB. In restricted environments (like iframes), it may even report as low as 0.5GB for privacy."
                  />
                  <InfoSection 
                    title="CPU Cores are spoofed" 
                    api="navigator.hardwareConcurrency"
                    url="https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency"
                    description="This returns logical threads, not physical cores. Additionally, browsers (especially Safari and Firefox) often spoof this number or cap it to reduce fingerprinting accuracy."
                  />
                  <InfoSection 
                    title="GPU is highly accurate" 
                    api="WEBGL_debug_renderer_info"
                    url="https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info"
                    description="WebGL allows us to query the actual graphics driver string. This is usually the most accurate piece of hardware data the browser can access."
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpecItem({ icon, label, value, hasAsterisk, onAsteriskClick }: { icon: React.ReactNode, label: string, value: string, hasAsterisk?: boolean, onAsteriskClick?: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 w-10">
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6 mb-1" })}
        <span className="text-[9px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <div className="font-mono text-neutral-800 dark:text-neutral-200 text-lg md:text-xl flex items-center gap-2">
        {value}
        {hasAsterisk && (
          <button 
            onClick={onAsteriskClick}
            className="text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400 transition-colors text-xl leading-none"
            title="Why is this value inaccurate?"
          >
            *
          </button>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="hidden md:block w-px h-10 bg-neutral-200 dark:bg-neutral-800/60 mx-2"></div>
  );
}

function InfoSection({ title, api, url, description }: { title: string, api: string, url: string, description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-200 font-sans">{title}</h3>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-green-600 dark:text-green-500 hover:underline inline-flex items-center gap-1 w-fit"
      >
        {api}
        <ExternalLink className="w-3 h-3" />
      </a>
      <p className="text-neutral-600 dark:text-neutral-400 mt-1 font-sans">
        {description}
      </p>
    </div>
  );
}
