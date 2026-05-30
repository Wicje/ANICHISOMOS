'use client';

import React, { useState, useEffect } from 'react';
import { useOS, OSRole, OSUser } from '@/lib/os-context';
import { WindowFrame } from '@/components/window-frame';
import { CommandPalette } from '@/components/command-palette';
import { TerminalBox } from '@/components/apps/terminal';
import { FileManager } from '@/components/apps/file-manager';
import { MiniBrowser } from '@/components/apps/mini-browser';
import { CampaignLab } from '@/components/apps/campaign-lab';
import { Moodboard } from '@/components/apps/moodboard';
import { CodeEditor } from '@/components/apps/code-editor';
import { ProductivitySuite } from '@/components/apps/productivity-suite';
import { AIGateway } from '@/components/apps/ai-gateway';
import { Terminal, Folder, Globe, Sparkles, Image as ImageIcon, Code2, Search, LayoutTemplate, Clock, Save, Cloud, RefreshCw, ShieldCheck, Power, Figma, Framer, HardDrive, Github, BookOpen, Zap, ZapOff, Briefcase, Brain, User, AlertCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const APPS = {
  'terminal': { component: TerminalBox, icon: Terminal, title: 'Terminal', roles: ['admin', 'technician'] },
  'files': { component: FileManager, icon: Folder, title: 'Files', roles: ['admin', 'filmmaker', 'technician'] },
  'browser': { component: MiniBrowser, icon: Globe, title: 'Browser', roles: ['admin', 'filmmaker', 'technician'] },
  'campaign': { component: CampaignLab, icon: Sparkles, title: 'Campaign Lab', roles: ['admin'] },
  'moodboard': { component: Moodboard, icon: ImageIcon, title: 'Moodboard', roles: ['admin', 'filmmaker'] },
  'code': { component: CodeEditor, icon: Code2, title: 'Code', roles: ['admin', 'technician'] },
  'office': { component: ProductivitySuite, icon: Briefcase, title: 'Office Suite', roles: ['admin', 'filmmaker'] },
  'ai-gateway': { component: AIGateway, icon: Brain, title: 'AI Gateway', roles: ['admin', 'technician'] },
};

function LoginScreen() {
  const { setCurrentUser } = useOS();
  
  const handleLogin = (role: OSRole, name: string) => {
    setCurrentUser({ id: crypto.randomUUID(), name, role });
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center font-sans z-[9999]"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-white font-bold text-lg mb-8 flex flex-col items-center">
           <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-2xl">
              <span className="text-2xl"></span>
           </div>
           Anichisom OS
        </div>
        
        <div className="flex gap-6">
          {/* Admin User */}
          <button onClick={() => handleLogin('admin', 'Anichisom (Admin)')} className="flex flex-col items-center gap-3 group">
             <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-transparent group-hover:border-white/50 transition-all overflow-hidden relative">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=anichisom" className="w-full h-full object-cover" alt="Admin" />
             </div>
             <span className="text-white/80 font-medium text-sm group-hover:text-white">Anichisom</span>
          </button>

          {/* Filmmaker Workspace */}
          <button onClick={() => handleLogin('filmmaker', 'Creative Partner')} className="flex flex-col items-center gap-3 group">
             <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-transparent group-hover:border-white/50 transition-all overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay" />
                <Play className="w-8 h-8 text-white/70 group-hover:text-white" />
             </div>
             <span className="text-white/80 font-medium text-sm group-hover:text-white">Filmmaker</span>
          </button>
          
          {/* Technician Workspace */}
          <button onClick={() => handleLogin('technician', 'Ziklag Tech')} className="flex flex-col items-center gap-3 group">
             <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-transparent group-hover:border-white/50 transition-all overflow-hidden relative">
                <div className="absolute inset-0 bg-emerald-500/20 mix-blend-overlay" />
                <Terminal className="w-8 h-8 text-white/70 group-hover:text-white" />
             </div>
             <span className="text-white/80 font-medium text-sm group-hover:text-white">Ziklag Tech</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const PROJECTS = {
  'nike-campaign': { title: 'Nike Campaign', type: 'project' },
  'tesla-redesign': { title: 'Tesla Redesign', type: 'project' },
  'portfolio-v3': { title: 'Portfolio OS', type: 'project' }
};

const SERVICES = {
  'figma': { title: 'Figma', icon: Figma, url: 'https://www.figma.com/login', color: 'text-pink-400' },
  'framer': { title: 'Framer', icon: Framer, url: 'https://www.framer.com/login', color: 'text-blue-400' },
  'notion': { title: 'Notion', icon: BookOpen, url: 'https://www.notion.so/login', color: 'text-slate-200' },
  'github': { title: 'GitHub', icon: Github, url: 'https://github.com/login', color: 'text-white' },
  'drive': { title: 'Google Drive', icon: HardDrive, url: 'https://drive.google.com/drive/my-drive', color: 'text-emerald-400' },
};

function OsClock() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;
  return <>{format(time, 'EEE MMM d  h:mm a')}</>;
}

function OsSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Simulate periodic cloud syncing
    const syncTimer = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    }, 15000);
    return () => clearInterval(syncTimer);
  }, []);

  return isSyncing ? (
    <div className="flex items-center gap-1.5 text-blue-400">
      <RefreshCw className="w-3 h-3 animate-spin" />
      <span className="hidden sm:inline text-xs">Syncing to Cloud...</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 text-white/50 hover:text-white/80 cursor-default transition-colors">
      <Cloud className="w-4 h-4" />
      <span className="hidden sm:inline text-xs">Synced</span>
    </div>
  );
}

export function Desktop() {
  const { currentUser, setCurrentUser, windows, snapshots, performanceMode, setPerformanceMode, activeWorkspace, setActiveWorkspace, openWindow, minimizeWindow, focusWindow, applyWorkspaceLayout, loadProject, saveSnapshot, restoreSnapshot, wipeSession } = useOS();
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showActionCenter, setShowActionCenter] = useState(false);

  if (!currentUser) {
    return <LoginScreen />;
  }

  const allowedApps = Object.entries(APPS).filter(([_, config]) => config.roles.includes(currentUser.role));
  const isSuperUser = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex flex-col font-sans select-none bg-black">
      <CommandPalette />
      
      {/* macOS Style Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")' }} 
      />

      {/* OS Menu Bar */}
      <header className="h-7 flex items-center shrink-0 w-full bg-black/20 backdrop-blur-3xl border-b border-white/10 z-50 px-4 sticky top-0 text-[13px] font-medium text-white/90">
        <div className="flex items-center gap-6">
          <div className="font-bold text-white flex items-center gap-2 cursor-pointer">
            
          </div>
          <div className="font-bold flex items-center cursor-default uppercase tracking-wider text-xs bg-white/20 px-2 py-0.5 rounded">
            {currentUser.name}
          </div>
          <div className="hidden sm:flex gap-4">
            <button className="hover:text-white cursor-default">File</button>
            <button className="hover:text-white cursor-default">Edit</button>
            <button className="hover:text-white cursor-default">View</button>
            {isSuperUser && <button className="hover:text-white cursor-default" onClick={() => applyWorkspaceLayout('creative-split')}>Multi-View Workspace</button>}
            <button className="hover:text-white cursor-default" onClick={() => setShowSnapshots(!showSnapshots)}>Time Machine</button>
            
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/20">
              {[0, 1, 2].map(ws => (
                <button 
                  key={ws}
                  onClick={() => setActiveWorkspace(ws)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs transition-colors",
                    activeWorkspace === ws ? "bg-white/20 text-white" : "text-white/60 hover:text-white/90 hover:bg-white/10"
                  )}
                >
                  Desktop {ws + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-4 border-r border-white/10 pr-4">
            <button 
              onClick={() => setPerformanceMode(performanceMode === 'heavy' ? 'light' : 'heavy')}
              className={cn(
                "flex items-center gap-1.5 transition-colors cursor-pointer text-xs group px-2 py-1 rounded",
                performanceMode === 'light' ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20" : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
              title={performanceMode === 'light' ? "Light Mode Active (Performance Optimized)" : "Heavy Mode Active (Rich Visuals)"}
            >
              {performanceMode === 'light' ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-medium tracking-wide">
                {performanceMode === 'light' ? 'Light' : 'Heavy'}
              </span>
            </button>
            <OsSyncStatus />
            <div className="group relative flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80 hover:text-emerald-400 cursor-pointer transition-colors" />
              <div className="absolute top-full right-0 mt-2 scale-0 group-hover:scale-100 transition-transform px-3 py-2 bg-black/80 backdrop-blur-xl border border-white/10 text-white text-xs font-medium rounded shadow-xl whitespace-nowrap z-[100]">
                 <div className="font-bold text-emerald-400 mb-1">Sandboxed Environment</div>
                 <div className="text-white/60">Apps are isolated & secure.</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
               className="cursor-pointer hover:text-white text-white/80 transition-colors focus:outline-none" 
               onClick={() => window.dispatchEvent(new CustomEvent('os:open-spotlight'))}
               title="Global Search (Cmd/Ctrl + K)"
            >
               <Search className="w-4 h-4" />
            </button>
            <div className="group relative flex items-center justify-center">
              <Power onClick={() => setCurrentUser(null)} className="w-4 h-4 text-rose-500/80 hover:text-rose-500 cursor-pointer transition-colors" />
              <div className="absolute top-full right-0 mt-2 scale-0 group-hover:scale-100 transition-transform px-3 py-2 bg-rose-500/20 backdrop-blur-xl border border-rose-500/30 text-white text-xs font-medium rounded shadow-xl whitespace-nowrap z-[100]">
                 Sign Out
              </div>
            </div>
            <button 
              className="text-white/90 cursor-pointer hover:text-white ml-2 focus:outline-none"
              onClick={() => setShowActionCenter(!showActionCenter)}
            >
              <OsClock />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area (Desktop) */}
      <main className="flex-1 relative z-10 w-full h-full overflow-hidden pointer-events-none">
        {/* Desktop Icons */}
        <div className="absolute top-4 right-4 flex flex-col gap-6 pointer-events-auto z-0">
          <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-[-12px] text-center">Projects</div>
          {Object.entries(PROJECTS).map(([id, project]) => {
             return (
               <button 
                 key={id} 
                 onDoubleClick={() => loadProject(id)}
                 className="flex flex-col items-center gap-1 group w-24 focus:outline-none"
               >
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors shadow-lg">
                   <Folder className="w-8 h-8 text-blue-400 fill-blue-400" />
                 </div>
                 <div className="text-white text-xs font-medium text-center line-clamp-2 px-1 break-words drop-shadow-md group-focus:bg-blue-500/50 group-focus:px-2 group-focus:rounded flex items-center justify-center min-h-[32px]">
                   {project.title}
                 </div>
               </button>
             );
          })}
          <div className="w-12 h-px bg-white/10 mx-auto my-2" />
          <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-[-12px] text-center">Services</div>
          {Object.entries(SERVICES).map(([id, service]) => {
             const Icon = service.icon;
             return (
               <a 
                 key={id} 
                 href={service.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={(e) => {
                   // Only open on double click to keep desktop paradigm
                   // But keep the link href so right-clicking shows 'Open Link in Incognito Window'
                   e.preventDefault();
                 }}
                 onDoubleClick={(e) => {
                   e.preventDefault();
                   openWindow('browser', `Web: ${service.title}`, { url: service.url });
                 }}
                 className="flex flex-col items-center gap-1 group w-24 outline-none border-none"
               >
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors shadow-lg">
                   <Icon className={cn("w-8 h-8", service.color)} />
                 </div>
                 <div className="text-white text-xs font-medium text-center line-clamp-2 px-1 break-words drop-shadow-md group-focus:bg-blue-500/50 group-focus:px-2 group-focus:rounded flex items-center justify-center min-h-[32px]">
                   {service.title}
                 </div>
               </a>
             );
          })}
        </div>

        {/* Snapshots Menu */}
        {showSnapshots && (
          <div className="absolute top-2 left-64 w-64 bg-black/60 shadow-2xl border border-white/10 rounded-xl backdrop-blur-3xl pointer-events-auto z-[60] overflow-hidden">
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
               <div className="text-white text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neon-blue" />
                  Time Machine
               </div>
               <button onClick={() => saveSnapshot(`Save ${format(new Date(), 'h:mm a')}`)} className="text-white/60 hover:text-white flex items-center gap-1 text-xs">
                 <Save className="w-3 h-3" /> Save current
               </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {snapshots.length === 0 ? (
                <div className="p-4 text-white/50 text-xs text-center italic">No snapshots saved.</div>
              ) : (
                <div className="flex flex-col">
                  {snapshots.map(snap => (
                    <button 
                      key={snap.id} 
                      onClick={() => {
                        restoreSnapshot(snap.id);
                        setShowSnapshots(false);
                      }}
                      className="px-4 py-3 hover:bg-white/10 text-left transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="text-white text-sm truncate">{snap.name}</div>
                      <div className="text-white/40 text-[10px] mt-0.5">{format(new Date(snap.timestamp), 'MMM d, yyyy h:mm a')}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render all open windows */}
        {windows
          .filter(win => win.workspace === activeWorkspace || win.workspace === undefined)
          .map(win => {
          const AppConfig = APPS[win.appId as keyof typeof APPS];
          if (!AppConfig) return null;
          const AppComponent = AppConfig.component;

          return (
            <WindowFrame key={win.id} osWindow={win}>
               <AppComponent window={win} />
            </WindowFrame>
          );
        })}

        {/* Action Center */}
        {showActionCenter && (
          <div className="absolute top-0 right-0 h-full w-80 bg-black/60 backdrop-blur-3xl shadow-2xl border-l border-white/10 z-[60] flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-right">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
               <h3 className="text-white font-medium text-sm">Action Center</h3>
               <button onClick={() => setShowActionCenter(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            
            <div className="p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
               {/* Quick Toggles */}
               <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => setPerformanceMode(performanceMode === 'heavy' ? 'light' : 'heavy')}
                    className={cn(
                      "p-3 rounded-xl flex flex-col items-start gap-2 transition-colors",
                      performanceMode === 'heavy' ? "bg-amber-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                 >
                    <Zap className="w-5 h-5" />
                    <span className="text-xs font-medium">Heavy Mode</span>
                 </button>
                 <button 
                    onClick={() => {
                       setShowActionCenter(false);
                       openWindow('ai-gateway', 'AI Gateway Settings');
                    }}
                    className="p-3 rounded-xl bg-emerald-500 text-white flex flex-col items-start gap-2 hover:bg-emerald-400 transition-colors"
                 >
                    <Brain className="w-5 h-5" />
                    <span className="text-xs font-medium">AI Gateway</span>
                 </button>
                 <button className="p-3 rounded-xl bg-white/10 text-white flex flex-col items-start gap-2 opacity-50 cursor-not-allowed">
                    <Cloud className="w-5 h-5" />
                    <span className="text-xs font-medium">Cloud Sync</span>
                 </button>
                 <button className="p-3 rounded-xl bg-white/10 text-white flex flex-col items-start gap-2 opacity-50 cursor-not-allowed">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-xs font-medium">Sandbox</span>
                 </button>
               </div>

               {/* Notifications */}
               <div>
                 <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Notifications</div>
                 <div className="flex flex-col gap-2">
                   <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                     <div className="text-white text-sm font-medium mb-1">AI Compilation Complete</div>
                     <div className="text-white/60 text-xs">Moodboard layout has been regenerated.</div>
                     <div className="text-white/40 text-[10px] mt-2">Just now</div>
                   </div>
                   <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                     <div className="text-white text-sm font-medium mb-1">File Saved</div>
                     <div className="text-white/60 text-xs">system_architecture.pdf was saved to Documents.</div>
                     <div className="text-white/40 text-[10px] mt-2">2m ago</div>
                   </div>
                 </div>
               </div>
               
            </div>
          </div>
        )}
      </main>

      {/* macOS Style Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="flex items-end gap-3 px-3 py-2 bg-white/20 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl pointer-events-auto">
          {allowedApps.map(([appId, config]) => {
            const Icon = config.icon;
            const activeWindows = windows.filter(win => win.workspace === activeWorkspace || win.workspace === undefined);
            const isOpen = activeWindows.some(w => w.appId === appId);
            const isFocused = activeWindows.some(w => w.appId === appId && !w.isMinimized && w.zIndex >= Math.max(...activeWindows.map(win => win.zIndex)));

            return (
              <div key={appId} className="relative group flex flex-col items-center justify-end">
                <button
                  onClick={() => {
                    const existingWindow = activeWindows.find(w => w.appId === appId);
                    if (existingWindow) {
                      if (existingWindow.isMinimized || !isFocused) {
                        focusWindow(existingWindow.id);
                      } else {
                        minimizeWindow(existingWindow.id);
                      }
                    } else {
                      openWindow(appId);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 transform origin-bottom hover:scale-125 hover:mx-2",
                    isOpen ? "bg-white/90" : "bg-white/80 hover:bg-white"
                  )}
                >
                  <Icon className={cn(
                    "w-7 h-7 transition-colors duration-300", 
                    "text-black"
                  )} />
                </button>
                {/* Active Indicator */}
                {isOpen && (
                  <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-white shadow-sm" />
                )}
                
                {/* Tooltip */}
                <div className="absolute -top-12 scale-0 group-hover:scale-100 transition-transform px-3 py-1 bg-black/60 backdrop-blur text-white text-xs font-medium rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50">
                  {config.title}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
