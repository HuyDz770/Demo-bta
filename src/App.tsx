import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Settings2, ShieldAlert, Zap, Save, Copy, Check, Globe, Lock, Clock, FileCode2, Activity, ChevronRight, Upload } from 'lucide-react';

const presets = [
  "Minify", "Luamin", "Format", "Beautify", "Env Logger",
  "Me", "Flow", "Evil", "Abyss", "Abyss2", "Hex", "Weak", "Light",
  "Ps", "Rz", "R1", "R2", "R3", "R4", "Veil", "L1", "L2", "Lightrew",
  "Ib1", "Ib2", "Ib3", "Wrd", "Ibv", "Medium", "M1", "M2", "M3",
  "Basic", "Normal", "Ibs", "Hard", "Strong", "Env", "MaxSecurity"
];

export default function App() {
  const [code, setCode] = useState('');
  const [preset, setPreset] = useState('Basic');
  const [filename, setFilename] = useState('');
  const [expireTime, setExpireTime] = useState('0');
  const [privacy, setPrivacy] = useState('public');
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'obf' | 'save' | null>(null);
  const [result, setResult] = useState<{ id?: string; key?: string; error?: string; successMsg?: string } | null>(null);
  const [copied, setCopied] = useState<'loadstring' | 'key' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
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
    setIsLoading(true);
    setActionType('obf');
    setResult(null);
    try {
      const res = await fetch('/api/obfuscate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, preset })
      });
      const data = await res.json();
      if (res.ok) {
        setCode(data.code);
        setResult({ successMsg: 'Obfuscation completed successfully.' });
      } else {
        setResult({ error: data.error });
      }
    } catch (e) {
      setResult({ error: 'Failed to connect to obfuscation server.' });
    }
    setIsLoading(false);
    setActionType(null);
  };

  const handleSave = async () => {
    if (!code) return;
    setIsLoading(true);
    setActionType('save');
    setResult(null);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, preset, filename: filename || 'script.lua', expireTime, privacy }),
      });
      const data = await response.json();
      if (response.ok) {
        setResult({ id: data.id, key: data.key });
      } else {
        setResult({ error: data.error });
      }
    } catch (error) {
      setResult({ error: 'Failed to connect to server.' });
    }
    setIsLoading(false);
    setActionType(null);
  };

  const copyToClipboard = (text: string, type: 'loadstring' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadstring = result?.id ? `loadstring(game:HttpGet("${window.location.origin}/${result.id}"))()` : '';

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-emerald-500/30">
      {/* Top Navigation */}
      <header className="fixed top-0 inset-x-0 h-14 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-mono text-sm font-bold text-zinc-100 tracking-wider">NEXUS<span className="text-emerald-500">_OBF</span></span>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-500">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <span className="text-zinc-500">GUEST_SESSION</span>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Editor (Span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden flex flex-col h-[600px] shadow-2xl relative">
              {/* Editor Header */}
              <div className="h-12 bg-[#0f0f0f] border-b border-white/5 flex items-center justify-between px-4">
                <div className="flex items-center gap-3 flex-1">
                  <FileCode2 className="w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="untitled.lua"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-mono text-zinc-300 placeholder:text-zinc-600 w-full max-w-[200px] focus:ring-0"
                  />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-mono text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-md"
                >
                  <Upload className="w-3 h-3" /> IMPORT
                </button>
                <input type="file" accept=".lua,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              </div>
              
              {/* Editor Body */}
              <div className="flex-1 relative">
                {/* Line numbers mock */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#080808] border-r border-white/5 flex flex-col items-end py-4 pr-3 text-[11px] font-mono text-zinc-700 select-none pointer-events-none">
                  {Array.from({ length: 30 }).map((_, i) => <span key={i}>{i + 1}</span>)}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="-- Initialize script here..."
                  spellCheck="false"
                  className="w-full h-full bg-transparent border-none outline-none text-[13px] font-mono text-zinc-300 placeholder:text-zinc-700 p-4 pl-16 resize-none focus:ring-0 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Controls (Span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Configuration Panel */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Settings2 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-xs font-bold tracking-widest text-zinc-200 uppercase">Configuration</h2>
              </div>

              <div className="space-y-5">
                {/* Preset Selection */}
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Security Level</label>
                  <div className="relative">
                    <select
                      value={preset}
                      onChange={(e) => setPreset(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                    >
                      {presets.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* Privacy Toggle */}
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Visibility</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#121212] p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => setPrivacy('public')}
                      className={`flex items-center justify-center gap-2 py-2 text-xs font-mono rounded-md transition-all ${privacy === 'public' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Globe className="w-3.5 h-3.5" /> PUBLIC
                    </button>
                    <button
                      onClick={() => setPrivacy('private')}
                      className={`flex items-center justify-center gap-2 py-2 text-xs font-mono rounded-md transition-all ${privacy === 'private' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Lock className="w-3.5 h-3.5" /> PRIVATE
                    </button>
                  </div>
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Auto-Destruct</label>
                  <div className="relative">
                    <select
                      value={expireTime}
                      onChange={(e) => setExpireTime(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                    >
                      <option value="0">Never (Permanent)</option>
                      <option value="600">10 Minutes</option>
                      <option value="3600">1 Hour</option>
                      <option value="86400">24 Hours</option>
                    </select>
                    <Clock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleObfuscate}
                disabled={!code || isLoading}
                className="col-span-1 bg-[#121212] hover:bg-[#1a1a1a] border border-white/10 text-zinc-300 py-3.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && actionType === 'obf' ? (
                  <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
                ) : (
                  <><ShieldAlert className="w-4 h-4" /> OBFUSCATE</>
                )}
              </button>
              
              <button
                onClick={handleSave}
                disabled={!code || isLoading}
                className="col-span-1 bg-emerald-500 hover:bg-emerald-400 text-[#050505] py-3.5 rounded-xl font-mono text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                {isLoading && actionType === 'save' ? (
                  <div className="w-4 h-4 border-2 border-[#050505]/30 border-t-[#050505] rounded-full animate-spin" />
                ) : (
                  <><Zap className="w-4 h-4" /> DEPLOY</>
                )}
              </button>
            </div>

            {/* Results Panel */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-xl border font-mono text-sm ${
                    result.error 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {result.error ? (
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">[ERR]</span>
                      <span>{result.error}</span>
                    </div>
                  ) : result.successMsg ? (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{result.successMsg}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <Check className="w-4 h-4" />
                        <span className="font-bold">DEPLOYMENT SUCCESSFUL</span>
                      </div>
                      
                      <div>
                        <div className="text-[10px] text-emerald-500/60 mb-1 uppercase tracking-widest">Execution String</div>
                        <div className="flex items-center gap-2 bg-[#050505] border border-emerald-500/20 rounded-lg p-1 pl-3">
                          <code className="flex-1 text-xs truncate">{loadstring}</code>
                          <button
                            onClick={() => copyToClipboard(loadstring, 'loadstring')}
                            className="p-2 hover:bg-emerald-500/20 rounded-md transition-colors"
                          >
                            {copied === 'loadstring' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-emerald-500/60 mb-1 uppercase tracking-widest">Decryption Key</div>
                        <div className="flex items-center gap-2 bg-[#050505] border border-emerald-500/20 rounded-lg p-1 pl-3">
                          <code className="flex-1 text-xs">{result.key}</code>
                          <button
                            onClick={() => copyToClipboard(result.key || '', 'key')}
                            className="p-2 hover:bg-emerald-500/20 rounded-md transition-colors"
                          >
                            {copied === 'key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </main>
    </div>
  );
}
