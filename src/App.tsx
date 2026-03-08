import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Settings2, ShieldAlert, Zap, Copy, Check, Globe, Lock, Clock, 
  FileCode2, Activity, ChevronRight, Upload, PanelLeft, Moon, Crown, 
  MessageSquare, Code, Plus, TriangleAlert, ShieldCheck, RefreshCw, Trash2, ExternalLink
} from 'lucide-react';

const presets = [
  "Ironbrew 2", "Prometheus"
];

interface SavedScript {
  id: string;
  key?: string;
  filename: string;
  preset: string;
  privacy: string;
  createdAt: number;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'library' | 'editor'>('library');
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);

  const [code, setCode] = useState('');
  const [preset, setPreset] = useState('Ironbrew 2');
  const [filename, setFilename] = useState('');
  const [expireTime, setExpireTime] = useState('0');
  const [privacy, setPrivacy] = useState('public');
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'obf' | 'save' | null>(null);
  const [result, setResult] = useState<{ id?: string; key?: string; error?: string; successMsg?: string } | null>(null);
  const [copied, setCopied] = useState<'loadstring' | 'key' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nexus_scripts');
    if (saved) {
      try {
        setSavedScripts(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveScriptToLocal = (script: SavedScript) => {
    const updated = [script, ...savedScripts];
    setSavedScripts(updated);
    localStorage.setItem('nexus_scripts', JSON.stringify(updated));
  };

  const deleteScript = (id: string) => {
    const updated = savedScripts.filter(s => s.id !== id);
    setSavedScripts(updated);
    localStorage.setItem('nexus_scripts', JSON.stringify(updated));
  };

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
        saveScriptToLocal({
          id: data.id,
          key: data.key,
          filename: filename || `${data.id}.lua`,
          preset,
          privacy,
          createdAt: Date.now()
        });
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

  const loadstring = result?.id 
    ? `loadstring(game:HttpGet("${window.location.origin}/${result.id}${privacy === 'private' ? `?key=${result.key}` : ''}"))()` 
    : '';

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col font-sans selection:bg-primary/30">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-70" style={{ backgroundImage: 'radial-gradient(circle, rgb(38, 38, 38) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }} />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-background/80 backdrop-blur-md px-6">
        <button className="inline-flex items-center justify-center rounded-md hover:bg-accent h-7 w-7 text-muted-foreground hover:text-foreground transition-colors">
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-5 bg-border opacity-50" />
        <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium">
          <button onClick={() => setCurrentView('library')} className="hover:text-foreground transition-colors">Dashboard</button>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-foreground">{currentView === 'library' ? 'Lua Scripts' : 'Create Script'}</span>
        </nav>
        
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">Live</span>
          </div>
          <div className="w-[1px] h-5 bg-border opacity-50 hidden sm:block" />
          <button className="inline-flex items-center justify-center gap-2 text-sm font-medium hover:bg-accent h-9 rounded-md px-3 text-error">
            <Moon className="w-4 h-4" />
            <span className="hidden sm:inline">Dark Red</span>
          </button>
          <div className="w-[1px] h-5 bg-border opacity-50 hidden sm:block" />
          <button className="inline-flex items-center justify-center gap-2 text-sm font-medium border border-warning/30 text-warning hover:bg-warning/10 h-9 rounded-md px-3 hidden md:flex">
            <Crown className="w-4 h-4" />
            <span>Premium</span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative z-10 p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
        {currentView === 'library' ? (
          <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="relative w-full overflow-hidden rounded-[1.5rem] border border-border bg-card p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Code className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Lua Scripts</h2>
                    <p className="text-sm text-muted-foreground">{savedScripts.length} scripts</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentView('editor')}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto transition-colors"
                >
                  <Plus className="w-5 h-5" /> Create Script
                </button>
              </div>

              {/* Warning Box */}
              <div className="mb-6 rounded-xl border border-warning/20 bg-card/50 p-6 flex flex-col sm:flex-row items-start gap-4">
                <div className="p-2 rounded-xl bg-warning/10 border border-warning/20 shrink-0">
                  <TriangleAlert className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Discord Link Required</h3>
                  <p className="text-muted-foreground text-sm mb-4">To access premium obfuscation features, you must link your Discord account.</p>
                  <a href="#" className="inline-flex px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Join Discord Server
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Obfuscations</h3>
                        <p className="text-xs text-muted-foreground">Monthly limit tracking</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-success">Unlimited</div>
                      <div className="text-xs text-muted-foreground">remaining</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mb-4 overflow-hidden">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="w-4 h-4" /> last_updated
                    </div>
                    <span className="font-medium text-foreground">Just now</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scripts List */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
                <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-card text-foreground shadow-sm">All ({savedScripts.length})</button>
                <button className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground">Own ({savedScripts.length})</button>
              </div>
            </div>

            {savedScripts.length === 0 ? (
              <div className="rounded-[1.5rem] bg-card border-dashed border-2 border-border p-12 flex flex-col items-center justify-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-muted flex items-center justify-center">
                    <Code className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">No scripts available yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Create your first Lua script with secure obfuscation</p>
                <button 
                  onClick={() => setCurrentView('editor')}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Create Script
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedScripts.map(script => (
                  <div key={script.id} className="rounded-[1.5rem] border border-border bg-card p-5 hover:border-primary/50 transition-colors group flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <FileCode2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{script.filename}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(script.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {script.privacy === 'private' ? <Lock className="w-3 h-3 text-warning" /> : <Globe className="w-3 h-3 text-success" />}
                              {script.privacy}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteScript(script.id)} className="text-muted-foreground hover:text-error transition-colors p-2 bg-muted rounded-lg opacity-0 group-hover:opacity-100 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2 px-3 border border-border">
                        <span className="text-xs text-muted-foreground">ID</span>
                        <code className="text-xs font-mono text-primary truncate max-w-[100px]">{script.id}</code>
                      </div>
                      {script.key && (
                        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2 px-3 border border-border">
                          <span className="text-xs text-muted-foreground">Access Key</span>
                          <code className="text-xs font-mono text-warning truncate max-w-[100px]">{script.key}</code>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border flex gap-2">
                      <button 
                        onClick={() => {
                          const ls = `loadstring(game:HttpGet("${window.location.origin}/${script.id}${script.privacy === 'private' ? `?key=${script.key}` : ''}"))()`;
                          navigator.clipboard.writeText(ls);
                        }}
                        className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy className="w-4 h-4" /> Copy Loadstring
                      </button>
                      <a 
                        href={`/${script.id}${script.privacy === 'private' ? `?key=${script.key}` : ''}`}
                        target="_blank"
                        className="p-2 bg-muted hover:bg-muted-foreground/20 text-foreground rounded-lg transition-colors flex items-center justify-center"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto flex flex-col-reverse lg:grid">
            {/* Left Column: Editor (Span 8) */}
            <div className="lg:col-span-8 flex flex-col gap-4 order-2 lg:order-1">
              <div className="bg-card border border-border rounded-[1.5rem] overflow-hidden flex flex-col h-[600px] shadow-sm relative">
                {/* Editor Header */}
                <div className="h-12 bg-muted/30 border-b border-border flex items-center justify-between px-4">
                  <div className="flex items-center gap-3 flex-1">
                    <FileCode2 className="w-4 h-4 text-primary" />
                    <input
                      type="text"
                      placeholder="untitled.lua"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground w-full max-w-[200px] focus:ring-0"
                    />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg border border-border"
                  >
                    <Upload className="w-3 h-3" /> IMPORT
                  </button>
                  <input type="file" accept=".lua,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </div>
                
                {/* Editor Body */}
                <div className="flex-1 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/10 border-r border-border flex flex-col items-end py-4 pr-3 text-[11px] font-mono text-muted-foreground select-none pointer-events-none">
                    {Array.from({ length: 30 }).map((_, i) => <span key={i}>{i + 1}</span>)}
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="-- Initialize script here..."
                    spellCheck="false"
                    className="w-full h-full bg-transparent border-none outline-none text-[13px] font-mono text-foreground placeholder:text-muted-foreground p-4 pl-16 resize-none focus:ring-0 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Controls (Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-4 order-1 lg:order-2">
              
              {/* Configuration Panel */}
              <div className="bg-card border border-border rounded-[1.5rem] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-bold tracking-widest text-foreground uppercase">Configuration</h2>
                </div>

                <div className="space-y-4">
                  {/* Preset Selection */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1.5">Obfuscator</label>
                    <div className="relative">
                      <select
                        value={preset}
                        onChange={(e) => setPreset(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                      >
                        {presets.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none rotate-90" />
                    </div>
                  </div>

                  {/* Privacy Toggle */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1.5">Visibility</label>
                    <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl border border-border">
                      <button
                        onClick={() => setPrivacy('public')}
                        className={`flex items-center justify-center gap-2 py-2 text-xs font-mono rounded-lg transition-all ${privacy === 'public' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Globe className="w-3.5 h-3.5" /> PUBLIC
                      </button>
                      <button
                        onClick={() => setPrivacy('private')}
                        className={`flex items-center justify-center gap-2 py-2 text-xs font-mono rounded-lg transition-all ${privacy === 'private' ? 'bg-primary/20 text-primary shadow-sm border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Lock className="w-3.5 h-3.5" /> PRIVATE
                      </button>
                    </div>
                  </div>

                  {/* Expiration */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1.5">Auto-Destruct</label>
                    <div className="relative">
                      <select
                        value={expireTime}
                        onChange={(e) => setExpireTime(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                      >
                        <option value="0">Never (Permanent)</option>
                        <option value="600">10 Minutes</option>
                        <option value="3600">1 Hour</option>
                        <option value="86400">24 Hours</option>
                      </select>
                      <Clock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleObfuscate}
                  disabled={!code || isLoading}
                  className="col-span-1 bg-muted hover:bg-muted/80 border border-border text-foreground py-3.5 rounded-2xl font-mono text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && actionType === 'obf' ? (
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
                  ) : (
                    <><ShieldAlert className="w-4 h-4" /> OBFUSCATE</>
                  )}
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={!code || isLoading}
                  className="col-span-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-2xl font-mono text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                >
                  {isLoading && actionType === 'save' ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <><Zap className="w-4 h-4" /> DEPLOY</>
                  )}
                </button>
              </div>

              {/* Results Panel */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-2xl border font-mono text-sm backdrop-blur-md ${
                      result.error 
                        ? 'bg-error/10 border-error/20 text-error' 
                        : 'bg-success/10 border-success/20 text-success'
                    }`}
                  >
                    {result.error ? (
                      <div className="flex items-start gap-2">
                        <span className="font-bold">[ERR]</span>
                        <span>{result.error}</span>
                      </div>
                    ) : result.successMsg ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>{result.successMsg}</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Check className="w-4 h-4" />
                          <span className="font-bold">DEPLOYMENT SUCCESSFUL</span>
                        </div>
                        
                        <div>
                          <div className="text-[10px] opacity-70 mb-1.5 uppercase tracking-widest">Execution String</div>
                          <div className="flex items-center gap-2 bg-background/50 border border-success/20 rounded-xl p-1.5 pl-3">
                            <code className="flex-1 text-xs truncate">{loadstring}</code>
                            <button
                              onClick={() => copyToClipboard(loadstring, 'loadstring')}
                              className="p-2 hover:bg-success/20 rounded-lg transition-colors"
                            >
                              {copied === 'loadstring' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] opacity-70 mb-1.5 uppercase tracking-widest">Access Key</div>
                          <div className="flex items-center gap-2 bg-background/50 border border-success/20 rounded-xl p-1.5 pl-3">
                            <code className="flex-1 text-xs">{result.key}</code>
                            <button
                              onClick={() => copyToClipboard(result.key || '', 'key')}
                              className="p-2 hover:bg-success/20 rounded-lg transition-colors"
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
        )}
      </main>
    </div>
  );
}
