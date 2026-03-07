import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Code, Key, Copy, CheckCircle2, FileCode2 } from 'lucide-react';

const mobileBgs = [
  "https://raw.githubusercontent.com/HuyDz770/Website/refs/heads/main/wallhaven-d6r3qj.png",
  "https://raw.githubusercontent.com/HuyDz770/Website/refs/heads/main/iuno-wuthering-waves-phone-wallpaper-4k-uhdpaper.com-576%405%40l.jpg",
  "https://raw.githubusercontent.com/HuyDz770/Website/refs/heads/main/chisa-wuthering-waves-wuwa-art-phone-wallpaper-4k-uhdpaper.com-19%403%40d.jpg"
];

const pcBgs = [
  "https://github.com/HuyDz770/Website/raw/refs/heads/main/wallhaven-6d8kox.jpg",
  "https://raw.githubusercontent.com/HuyDz770/Website/refs/heads/main/shorekeeper-wuthering-waves-4k-wallpaper-uhdpaper.com-933%405%40h.jpg",
  "https://raw.githubusercontent.com/HuyDz770/Website/refs/heads/main/mornye-wuwa-wuthering-waves-4k-wallpaper-uhdpaper.com-515%405%40l.jpg",
  "https://raw.githubusercontent.com/HuyDz770/Website/refs/heads/main/iuno-wuthering-waves-4k-wallpaper-uhdpaper.com-576%405%40l.jpg",
  "https://raw.githubusercontent.com/HuyDz770/Website/refs/heads/main/chisa-wuwa-wuthering-waves-4k-wallpaper-uhdpaper.com-49%403%40d.jpg",
  "https://raw.githubusercontent.com/HuyDz770/Website/refs/heads/main/chisa-wuthering-waves-wuwa-art-4k-wallpaper-uhdpaper.com-19%403%40d.jpg"
];

const presets = [
  "Minify", "Luamin", "Format", "Beautify", "Env Logger",
  "Me", "Flow", "Evil", "Abyss", "Abyss2", "Hex", "Weak", "Light",
  "Ps", "Rz", "R1", "R2", "R3", "R4", "Veil", "L1", "L2", "Lightrew",
  "Ib1", "Ib2", "Ib3", "Wrd", "Ibv", "Medium", "M1", "M2", "M3",
  "Basic", "Normal", "Ibs", "Hard", "Strong", "Env", "MaxSecurity"
];

export default function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [code, setCode] = useState('');
  const [preset, setPreset] = useState('Basic');
  const [result, setResult] = useState<{ id: string, key: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<'loadstring' | 'key' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.innerHeight > window.innerWidth);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const bgs = isMobile ? mobileBgs : pcBgs;
  const currentBg = bgs[bgIndex % bgs.length];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCode(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  const handleObfuscate = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, preset })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid response from server: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to obfuscate script');
      }

      setResult(data);
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, type: 'loadstring' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadstring = result ? `loadstring(game:HttpGet("${window.location.origin}/${result.id}"))()` : '';

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBg}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${currentBg})` }}
        />
      </AnimatePresence>
      
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />

      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-3xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Code className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Script Protection</h1>
                <p className="text-white/50 text-sm mt-1">Secure and obfuscate your Lua scripts</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-white/80">Lua Script</label>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                  <input 
                    type="file" 
                    accept=".lua,.txt" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your Lua script here..."
                  className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/80 mb-2">Obfuscation Preset</label>
                  <select
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none"
                  >
                    {presets.map(p => (
                      <option key={p} value={p} className="bg-zinc-900">{p}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleObfuscate}
                    disabled={!code || loading}
                    className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-white/30 text-white px-8 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Obfuscate
                      </>
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-6 mt-6 border-t border-white/10 space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Loadstring</label>
                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1 pl-4">
                        <code className="flex-1 text-sm font-mono text-emerald-400 truncate">
                          {loadstring}
                        </code>
                        <button
                          onClick={() => copyToClipboard(loadstring, 'loadstring')}
                          className="p-2.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                        >
                          {copied === 'loadstring' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Script Key</label>
                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1 pl-4">
                        <code className="flex-1 text-sm font-mono text-indigo-400">
                          {result.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(result.key, 'key')}
                          className="p-2.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                        >
                          {copied === 'key' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
