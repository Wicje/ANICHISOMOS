'use client';

import React, { useState, useEffect } from 'react';
import { OSWindow, useOS } from '@/lib/os-context';
import { Settings, ShieldCheck, Server, Database, Globe, RefreshCcw, HardDrive, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function Preferences({ window }: { window: OSWindow }) {
  const { currentUser, performanceMode, setPerformanceMode } = useOS();
  const [activeTab, setActiveTab] = useState('sync');
  
  const [syncSettings, setSyncSettings] = useState({
    backendType: 'firestore', // firestore | selfhost
    selfHostUrl: 'https://sync.my-server.local/api/v1',
    e2eEncryption: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Simulate reading user preferences from db
      const docRef = doc(db, 'users', currentUser.id, 'settings', 'prefs');
      getDoc(docRef).then(snap => {
        if (snap.exists()) {
           setSyncSettings(snap.data().sync || syncSettings);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const saveSettings = () => {
    if (!currentUser) return;
    setSaving(true);
    const docRef = doc(db, 'users', currentUser.id, 'settings', 'prefs');
    setDoc(docRef, { sync: syncSettings }, { merge: true }).then(() => {
      setTimeout(() => setSaving(false), 500);
    });
  };

  const handleInstallPWA = () => {
      // Trigger PWA install if logic was captured globally
      const event = new CustomEvent('installPWAIndicator');
      globalThis.window.dispatchEvent(event);
      alert('If supported, browser installation prompt will appear.');
  };

  return (
    <div className="w-full h-full flex bg-[#1e1e1e] text-white font-sans overflow-hidden">
       {/* Sidebar */}
       <div className="w-48 border-r border-white/10 flex flex-col pt-4 bg-[#252526]">
          <div className="text-xs font-bold text-white/50 px-4 mb-2 uppercase tracking-wider">System Settings</div>
          
          <button 
             onClick={() => setActiveTab('sync')}
             className={cn("px-4 py-2 text-sm flex items-center gap-2 transition-colors", activeTab === 'sync' ? "bg-blue-600 text-white" : "text-white/70 hover:bg-white/5")}
          >
             <Server className="w-4 h-4" /> Cloud & Sync
          </button>
          
          <button 
             onClick={() => setActiveTab('perf')}
             className={cn("px-4 py-2 text-sm flex items-center gap-2 transition-colors", activeTab === 'perf' ? "bg-blue-600 text-white" : "text-white/70 hover:bg-white/5")}
          >
             <ShieldCheck className="w-4 h-4" /> Performance
          </button>

          <button 
             onClick={() => setActiveTab('install')}
             className={cn("px-4 py-2 text-sm flex items-center gap-2 transition-colors mt-auto mb-2", activeTab === 'install' ? "bg-blue-600 text-white" : "text-amber-400 hover:bg-white/5")}
          >
             <Download className="w-4 h-4" /> Install OS App
          </button>
       </div>

       {/* Content */}
       <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {activeTab === 'sync' && (
             <div className="max-w-xl animate-in fade-in">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2"><Globe className="w-6 h-6 text-blue-400"/> Network & Backend</h2>
                
                <div className="mb-8">
                   <h3 className="text-sm font-medium text-white/70 uppercase tracking-widest mb-4">Infrastructure Provider</h3>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => setSyncSettings({...syncSettings, backendType: 'firestore'})}
                        className={cn("p-4 rounded-xl border cursor-pointer transition-all", syncSettings.backendType === 'firestore' ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/30")}
                      >
                         <Database className={cn("w-6 h-6 mb-2", syncSettings.backendType === 'firestore' ? 'text-blue-400' : 'text-white/40')} />
                         <div className="font-medium text-sm">Ziklag Cloud (Firestore)</div>
                         <div className="text-xs text-white/50 mt-1">Managed backend. Global sync, fully automated real-time engine.</div>
                      </div>

                      <div 
                        onClick={() => setSyncSettings({...syncSettings, backendType: 'selfhost'})}
                        className={cn("p-4 rounded-xl border cursor-pointer transition-all", syncSettings.backendType === 'selfhost' ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 hover:border-white/30")}
                      >
                         <HardDrive className={cn("w-6 h-6 mb-2", syncSettings.backendType === 'selfhost' ? 'text-emerald-400' : 'text-white/40')} />
                         <div className="font-medium text-sm">Self-Hosted (DeGoogle)</div>
                         <div className="text-xs text-white/50 mt-1">Use your own storage node or IPFS node for total sovereignty.</div>
                      </div>
                   </div>
                </div>

                {syncSettings.backendType === 'selfhost' && (
                   <div className="mb-8 animate-in slide-in-from-top-4">
                      <h3 className="text-sm font-medium text-emerald-400 mb-2">Self-Hosted Endpoint (Relay Server)</h3>
                      <input 
                         type="url" 
                         value={syncSettings.selfHostUrl}
                         onChange={(e) => setSyncSettings({...syncSettings, selfHostUrl: e.target.value})}
                         className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <div className="flex items-start gap-2 mt-3 text-xs text-amber-400/80 bg-amber-400/10 p-3 rounded">
                         <AlertCircle className="w-4 h-4 shrink-0" />
                         <span>Self-hosted mode requires the open-source Ziklag Relay container to be running. E2E encryption is highly recommended.</span>
                      </div>
                   </div>
                )}

                <div className="mb-8">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                         type="checkbox" 
                         checked={syncSettings.e2eEncryption}
                         onChange={(e) => setSyncSettings({...syncSettings, e2eEncryption: e.target.checked})}
                         className="w-4 h-4 rounded bg-black/40 border border-white/20 accent-blue-500 group-hover:border-white/40 transition-colors" 
                      />
                      <div>
                        <div className="text-sm font-medium group-hover:text-white transition-colors">End-to-End Encryption (E2EE)</div>
                        <div className="text-xs text-white/50">Encrypt document blobs before syncing to any remote host.</div>
                      </div>
                   </label>
                </div>

                <button onClick={saveSettings} disabled={saving} className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
                   {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Save Settings"}
                </button>
             </div>
          )}

          {activeTab === 'perf' && (
            <div className="max-w-xl animate-in fade-in">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple-400"/> Environment Performance</h2>
              
              <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-6">
                 <div className="flex items-center justify-between pointer-events-none mb-4">
                    <div>
                       <div className="font-medium">Heavy Mode (Creative)</div>
                       <div className="text-xs text-white/50 mt-1">Rich animations, real-time background blurs, particle effects.</div>
                    </div>
                    <div className={cn("px-2 py-1 rounded text-xs", performanceMode === 'heavy' ? "bg-amber-500 text-white" : "bg-white/10 text-white/50")}>
                       {performanceMode === 'heavy' ? 'Active' : 'Inactive'}
                    </div>
                 </div>

                 <div className="flex items-center justify-between pointer-events-none">
                    <div>
                       <div className="font-medium">Light Mode (Focus)</div>
                       <div className="text-xs text-white/50 mt-1">Reduced animations, battery optimized, low latency rendering.</div>
                    </div>
                    <div className={cn("px-2 py-1 rounded text-xs", performanceMode === 'light' ? "bg-blue-500 text-white" : "bg-white/10 text-white/50")}>
                       {performanceMode === 'light' ? 'Active' : 'Inactive'}
                    </div>
                 </div>

                 <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                    <button 
                       onClick={() => setPerformanceMode(performanceMode === 'heavy' ? 'light' : 'heavy')}
                       className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded transition-colors"
                    >
                       Toggle Mode
                    </button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="max-w-xl animate-in fade-in">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2"><Download className="w-6 h-6 text-amber-500"/> App Installation</h2>
              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                 Install Ziklag OS to your device for total immersion. By installing as a Progressive Web App (PWA) or desktop wrapper, you unlock native performance, offline persistence mode, and separate windowing outside the browser tab.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 rounded-xl p-5 hover:border-white/30 transition-all flex flex-col items-center text-center cursor-pointer" onClick={handleInstallPWA}>
                    <Globe className="w-8 h-8 text-blue-400 mb-3" />
                    <div className="font-medium mb-1">Web Platform Add-on</div>
                    <div className="text-xs text-white/50">Install via Browser (PWA)</div>
                 </div>
                 
                 <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-white/30 transition-all flex flex-col items-center text-center opacity-70 cursor-not-allowed">
                    <Server className="w-8 h-8 text-slate-400 mb-3" />
                    <div className="font-medium mb-1">Native Binary</div>
                    <div className="text-xs text-white/50">Coming Soon (Linux/Win Desktop)</div>
                 </div>
              </div>
            </div>
          )}
       </div>
    </div>
  );
}
