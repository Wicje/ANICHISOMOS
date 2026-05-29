'use client';

import React, { useState } from 'react';
import { OSWindow } from '@/lib/os-context';
import { FileCode, Play, Settings, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CodeEditor({ window }: { window: OSWindow }) {
  const projectId = window.data?.projectId || 'default';
  
  const getInitialCode = (id: string) => {
    switch (id) {
       case 'nike-campaign':
         return `import { initCampaign } from '@anichisom/core';\n\n// Nike Air Force 1 : 40th Anniversary\nconst campaign = initCampaign({\n  target: 'Global',\n  platforms: ['Instagram', 'TikTok'],\n  mood: 'Energetic, Street, Heritage'\n});\n`;
       case 'tesla-redesign':
         return `import { renderUI } from '@anichisom/ui';\n\n// Tesla dashboard concept\nrenderUI({\n  theme: 'Dark Mode',\n  components: ['Speedometer', 'Nav', 'Music'],\n  animations: 'fluid'\n});\n`;
       case 'portfolio-v3':
         return `// Portfolio OS Core Boot Sequence\nimport { bootOS } from './kernel';\n\nbootOS({\n  user: 'ANICHISOM',\n  desktopTheme: 'macOS Monterey',\n  apps: ['Terminal', 'Moodboard', 'Code']\n});\n`;
       default:
         return `import { createCampaign } from '@anichisom/core';\n\n// Initialize the primary Q4 push\nconst campaign = createCampaign({\n  name: 'Street Energy',\n  theme: 'brutalist',\n});\n`;
    }
  };

  const [code, setCode] = useState(getInitialCode(projectId));
  
  const fileName = projectId === 'portfolio-v3' ? 'kernel.ts' : projectId === 'tesla-redesign' ? 'ui.tsx' : 'campaign.ts';

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2 text-[#cccccc]">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span>{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-[#3c3c3c] rounded text-[#cccccc] transition-colors" title="Format">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-[#3c3c3c] rounded text-[#cccccc] transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1 px-2 py-1 bg-green-700/80 hover:bg-green-600 rounded text-white text-xs font-sans transition-colors" title="Run Code">
            <Play className="w-3 h-3" />
            <span>Run</span>
          </button>
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div className="w-12 shrink-0 bg-[#1e1e1e] border-r border-[#3c3c3c] select-none text-right pr-3 pt-2 text-[#858585] text-xs">
          {code.split('\n').map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>
        
        {/* Text Area */}
        <div className="flex-1 relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-full bg-transparent border-none outline-none resize-none p-2 pt-2 leading-6 text-[#9cdcfe] custom-scrollbar focus:ring-0 whitespace-nowrap"
            style={{ tabSize: 2 }}
          />
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-6 shrink-0 bg-[#007acc] text-white flex items-center px-3 text-xs justify-between">
        <div className="flex items-center gap-4">
          <span>main</span>
          <span>● {fileName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {code.split('\n').length}, Col {code.length > 0 ? code.split('\n')[code.split('\n').length - 1].length : 0}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>TypeScript</span>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #424242;
          border: 4px solid #1e1e1e;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4f4f4f;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #1e1e1e;
        }
      `}} />
    </div>
  );
}
