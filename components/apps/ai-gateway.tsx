import React, { useState } from 'react';
import { OSWindow, useOS } from '@/lib/os-context';
import { Bot, Save, Server, Globe, Power, Zap, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIGateway({ window }: { window: OSWindow }) {
  const [activeEndpoint, setActiveEndpoint] = useState('local');
  const [model, setModel] = useState('llama-3-8b');
  
  return (
    <div className="w-full h-full flex flex-col bg-[#111] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-[#1a1a1a] border-r border-[#333] flex flex-col">
          <div className="p-4 border-b border-[#333]">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Bot className="w-4 h-4 text-emerald-400" />
              AI Gateway Settings
            </h2>
            <p className="text-xs text-[#888] mt-1">Manage local and cloud LLM endpoints.</p>
          </div>
          
          <div className="p-2 space-y-1">
            <button 
              onClick={() => setActiveEndpoint('local')}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                activeEndpoint === 'local' ? "bg-[#333] text-white" : "text-[#aaa] hover:bg-[#222]"
              )}
            >
              <Server className="w-4 h-4" />
              Self-Hosted VPS (Ziklag)
            </button>
            <button 
              onClick={() => setActiveEndpoint('cloud')}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                activeEndpoint === 'cloud' ? "bg-[#333] text-white" : "text-[#aaa] hover:bg-[#222]"
              )}
            >
              <Globe className="w-4 h-4" />
              Public Cloud (OpenAI/Gemini)
            </button>
          </div>

          <div className="mt-auto p-4 border-t border-[#333]">
            <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
               <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-semibold">
                  <Zap className="w-3 h-3 fill-emerald-400" /> System Active
               </div>
               <div className="text-[10px] text-[#888]">
                  CRDT Sync: Connected<br/>
                  Cache: IndexedDB (42MB)
               </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-[#111] p-6 overflow-y-auto">
          {activeEndpoint === 'local' ? (
             <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between border-b border-[#333] pb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Lock className="w-5 h-5 text-emerald-500" />
                      Private Agency Server
                    </h3>
                    <p className="text-xs text-[#888] mt-1">Self-hosted LLMs running on dedicated infrastructure.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     Online
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-xs text-[#888] font-medium">Endpoint URL</label>
                      <input 
                         type="text" 
                         defaultValue="https://ai.ziklag.agency/v1"
                         className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs text-[#888] font-medium">API Key / Auth Token</label>
                      <input 
                         type="password" 
                         defaultValue="sk-ziklag-1234567890"
                         className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                   </div>

                   <div className="space-y-1 pt-2">
                      <label className="text-xs text-[#888] font-medium">Active Model (via Ollama/vLLM)</label>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                         {['llama-3-8b', 'mistral-large', 'qwen-coder', 'stablediffusion-xl'].map(m => (
                            <button
                               key={m}
                               onClick={() => setModel(m)}
                               className={cn(
                                  "px-4 py-3 rounded-lg border text-sm text-center transition-all",
                                  model === m 
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
                                    : "border-[#333] bg-[#222] text-[#aaa] hover:bg-[#2a2a2a]"
                               )}
                            >
                               {m}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="pt-6">
                      <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                         <Save className="w-4 h-4" /> Save Configuration
                      </button>
                   </div>
                </div>
             </div>
          ) : (
             <div className="max-w-2xl mx-auto space-y-6">
               <div className="flex items-center justify-between border-b border-[#333] pb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      Public Cloud Providers
                    </h3>
                    <p className="text-xs text-[#888] mt-1">Use for general queries, not safe for proprietary Ziklag data or client IP.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#222] text-[#888] px-3 py-1 rounded-full text-xs font-medium border border-[#333]">
                     Standby
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                   <p className="text-red-400 text-xs font-medium uppercase tracking-wider mb-1">Security Warning</p>
                   <p className="text-red-200/80 text-sm">Do not send unreleased campaign data or Ziklag firmware to public cloud endpoints. Doing so violates agency data policies.</p>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-xs text-[#888] font-medium">OpenAI API Key</label>
                      <input 
                         type="password" 
                         placeholder="sk-proj-..."
                         className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs text-[#888] font-medium">Google Gemini Key</label>
                      <input 
                         type="password" 
                         placeholder="AIzaSy..."
                         className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                   </div>
                   <div className="pt-4">
                      <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                         <Save className="w-4 h-4" /> Save Configuration
                      </button>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
