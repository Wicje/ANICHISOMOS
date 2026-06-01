'use client';

import React, { useState, useEffect } from 'react';
import { OSWindow, useOS } from '@/lib/os-context';
import { FileCode, Play, Settings, RefreshCcw, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { get, set } from 'idb-keyval';

export function CodeEditor({ window }: { window: OSWindow }) {
  const { openWindow } = useOS();
  const projectId = window.data?.projectId || 'default';
  
  const getInitialCode = (id: string, content?: string) => {
    if (content) return content;
    switch (id) {
       case 'nike-campaign':
         return `import { initCampaign } from '@anichisom/core';\n\n// Nike Air Force 1 : 40th Anniversary\nconst campaign = initCampaign({\n  target: 'Global',\n  platforms: ['Instagram', 'TikTok'],\n  mood: 'Energetic, Street, Heritage'\n});\n`;
       case 'tesla-redesign':
         return `import { renderUI } from '@anichisom/ui';\n\n// Tesla dashboard concept\nexport default function App() {\n  return (\n    <div className="bg-black text-white p-8">\n       <h1>Tesla UI Staging</h1>\n       <p>Dashboard visualization active.</p>\n    </div>\n  )\n}\n`;
       case 'portfolio-v3':
         return `// Portfolio OS Core Boot Sequence\nimport { bootOS } from './kernel';\n\nbootOS({\n  user: 'ANICHISOM',\n  desktopTheme: 'macOS Monterey',\n  apps: ['Terminal', 'Moodboard', 'Code']\n});\n`;
       default:
         return `export default function App() {\n  return (\n    <div className="p-4">\n      <h1 className="text-xl font-bold">Hello World</h1>\n    </div>\n  );\n}\n`;
    }
  };

  const [code, setCode] = useState(getInitialCode(projectId, window.data?.content));
  const [isDeploying, setIsDeploying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    get(`anichisom_os_code_${projectId}`).then((saved) => {
      if (saved) {
        setCode(saved);
      }
      setLoaded(true);
    });
  }, [projectId]);

  const saveCodeRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (saveCodeRef.current) clearTimeout(saveCodeRef.current);
    saveCodeRef.current = setTimeout(() => {
        set(`anichisom_os_code_${projectId}`, newCode);
    }, 500);
  };
  
  const fileName = window.data?.filename || (projectId === 'portfolio-v3' ? 'kernel.ts' : projectId === 'tesla-redesign' ? 'ui.tsx' : 'app.tsx');

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
       setIsDeploying(false);
       
       let executableCode = code;
       // Extremely basic transpilation of exports for the iframe payload
       executableCode = executableCode.replace(/export default function (\w+)/, 'function $1');
       executableCode = executableCode.replace(/import .* from .*/g, ''); // strip imports
       
       const htmlContent = `
         <!DOCTYPE html>
         <html>
           <head>
             <meta charset="utf-8">
             <title>Staging Virtualizer</title>
             <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
             <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
             <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
             <script src="https://cdn.tailwindcss.com"></script>
           </head>
           <body>
             <div id="root" class="w-full h-full min-h-screen bg-white text-black"></div>
             <script type="text/babel">
               ${executableCode}
               
               // Attempt to find the main App component and render it
               const ComponentToRender = typeof App !== 'undefined' ? App : () => <div class="p-8 text-red-500 font-mono">Export default 'App' function not found.</div>;
               const root = ReactDOM.createRoot(document.getElementById('root'));
               root.render(<ComponentToRender />);
             </script>
           </body>
         </html>
       `;
       const blob = new Blob([htmlContent], { type: 'text/html' });
       const url = URL.createObjectURL(blob);
       openWindow('browser', `Staging: ${fileName}`, { url });
    }, 800);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2 text-[#cccccc]">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span>{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-2 py-1 bg-blue-600/80 hover:bg-blue-500 rounded text-white text-xs font-sans transition-colors" title="Deploy to Localhost Virtualizer" onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Server className="w-3 h-3" />}
            <span>{isDeploying ? 'Deploying...' : 'Deploy to VPS'}</span>
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
            onChange={handleCodeChange}
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
