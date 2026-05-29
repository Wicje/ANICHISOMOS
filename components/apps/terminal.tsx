'use client';

import React, { useState, useRef, useEffect } from 'react';
import { OSWindow, useOS } from '@/lib/os-context';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, Search as SearchIcon, Image as ImageIcon, Folder, ExternalLink, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { get, set } from 'idb-keyval';

type TerminalEntry = {
  id: string;
  type: 'command' | 'output' | 'system' | 'visual';
  content?: string;
  isError?: boolean;
  visual?: React.ReactNode;
};

// --- Command Parser --- //
function parseCommand(input: string) {
  const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  tokens.forEach(token => {
    if (token.startsWith('--')) {
      const parts = token.substring(2).split('=');
      flags[parts[0]] = parts.length > 1 ? parts[1].replace(/^"|"$/g, '') : true;
    } else {
      args.push(token.replace(/^"|"$/g, ''));
    }
  });

  return { root: args[0]?.toLowerCase() || '', args: args.slice(1), flags };
}

export function TerminalBox({ window }: { window: OSWindow }) {
  const { openWindow, loadProject } = useOS();
  const [history, setHistory] = useState<TerminalEntry[]>([
    { id: '1', type: 'system', content: 'ANICHISOM OS // COMMAND LINE INTERFACE' },
    { id: '2', type: 'system', content: 'Type "help" for a list of available commands.' }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Core Command Registry --- //
  const executeCommand = (rawInput: string) => {
    if (!rawInput.trim()) return;

    // Handle history replay (!23)
    if (rawInput.startsWith('!') && rawInput.length > 1) {
       const idx = parseInt(rawInput.substring(1));
       if (!isNaN(idx) && idx >= 0 && idx < commandHistory.length) {
         rawInput = commandHistory[idx];
       }
    }

    const newCommandEntry: TerminalEntry = { id: crypto.randomUUID(), type: 'command', content: rawInput };
    setHistory(prev => [...prev, newCommandEntry]);
    
    // Save to history
    setCommandHistory(prev => [...prev, rawInput]);
    setHistoryIndex(-1);

    const { root, args, flags } = parseCommand(rawInput);
    
    let result: Partial<TerminalEntry> | null = null;

    try {
      switch (root) {
        case 'help':
          result = {
            type: 'output',
            content: `COMMAND REGISTRY:
  open [app]                Launch an application (files, browser, campaign, moodboard)
  create [resource] [name]  Create a new resource (campaign, moodboard, note)
  search [type] [query]     Query the system (assets, ideas)
  history                   Show command history
  clear                     Clear the terminal screen
  whoami                    Identify current user
  
CREATIVE COMMANDS:
  campaign new "[name]"     Launch Campaign Lab with a new campaign context
  moodboard add "[query]"   Search and insert assets into your moodboard
  design new "[concept]"    Bootstrap a new design canvas`
          };
          break;
        case 'clear':
          setHistory([]);
          return;
        case 'history':
          result = {
            type: 'output',
            content: commandHistory.map((cmd, i) => `  ${i}  ${cmd}`).join('\n')
          };
          break;
        case 'whoami':
          result = { type: 'output', content: 'ANICHISOM. Creative Director.' };
          break;
        case 'open':
          if (!args[0]) throw new Error('Missing target app or project.');
          const target = args[0].toLowerCase();
          const validApps = ['files', 'browser', 'campaign', 'moodboard'];
          if (validApps.includes(target)) {
            openWindow(target);
            result = { type: 'output', content: `[SYSTEM] Booting process: ${target}.exe...` };
          } else {
             // Assume it's a project
             loadProject(target);
             result = { type: 'output', content: `[SYSTEM] Loading project workspace: ${target}...` };
          }
          break;
        case 'create':
          if (args[0] === 'campaign') {
             // Mock create campaign flow
             const title = args[1] || 'Untitled Campaign';
             openWindow('campaign');
             result = { type: 'visual', visual: <VisualCard title={`Created Campaign: ${title}`} icon={<Folder className="w-5 h-5 text-neon-blue" />} meta="Campaign Lab Active" /> };
          } else if (args[0] === 'moodboard') {
             const title = args[1] || 'Untitled Moodboard';
             openWindow('moodboard');
             result = { type: 'visual', visual: <VisualCard title={`Initialized Moodboard: ${title}`} icon={<ImageIcon className="w-5 h-5 text-electric-purple" />} meta="Moodboard OS" /> };
          } else {
             throw new Error(`Unknown resource type: ${args[0]}`);
          }
          break;
        case 'campaign':
          if (args[0] === 'new') {
            const title = args.slice(1).join(' ') || 'Street Energy';
            openWindow('campaign');
            result = { type: 'visual', visual: <VisualCard title={title} subtitle="Campaign context injected." icon={<Command className="w-5 h-5 text-[#f5f5f5]" />} meta="Live Editing" /> };
          } else {
            throw new Error(`Invalid campaign operation.`);
          }
          break;
        case 'moodboard':
          if (args[0] === 'add' || args[0] === 'search') {
            const query = args.slice(1).join(' ');
            openWindow('moodboard');
            result = { type: 'visual', visual: <SearchVisual query={query} /> };
          } else {
            throw new Error(`Invalid moodboard operation.`);
          }
          break;
        case 'search':
           if (args[0] === 'assets') {
             const query = args.slice(1).join(' ');
             result = { type: 'visual', visual: <SearchVisual query={query} /> };
           } else {
             result = { type: 'output', content: `Searching system for ${args.join(' ')}...` };
           }
           break;
        default:
          throw new Error(`Command not found: ${root}`);
      }
    } catch (e: any) {
       result = { type: 'output', content: e.message || 'Unknown error occurred.', isError: true };
    }

    if (result) {
      setHistory(prev => [...prev, { id: crypto.randomUUID(), ...result } as TerminalEntry]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
       e.preventDefault();
       setHistory([]);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Command palette autocomplete suggestion logic
  const cmds = ['open', 'create moodboard', 'create campaign', 'search assets', 'campaign new', 'moodboard add', 'design new'];
  const suggestion = input.trim() ? cmds.find(c => c.startsWith(input.toLowerCase().trim())) : '';

  return (
    <div 
      className="w-full h-full bg-[#050505] text-[#f5f5f5] font-mono p-4 flex flex-col overflow-hidden shadow-2xl relative"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-electric-purple/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-neon-blue/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex-1 overflow-y-auto whitespace-pre-wrap hide-scrollbar pb-8 z-10">
        <AnimatePresence initial={false}>
          {history.map((entry) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-1.5 leading-relaxed tracking-tight text-[13px]"
            >
              {entry.type === 'command' && (
                <div className="flex items-start text-white/50">
                  <span className="mr-3 font-bold">~</span>
                  <span className="text-white font-medium">{entry.content}</span>
                </div>
              )}
              {entry.type === 'system' && (
                <div className="text-white/40 italic flex items-center gap-2">
                  <TerminalIcon className="w-3 h-3" /> {entry.content}
                </div>
              )}
              {entry.type === 'output' && (
                <div className={cn("pl-5", entry.isError ? "text-red-400" : "text-white/70 font-light")}>
                  {entry.content}
                </div>
              )}
              {entry.type === 'visual' && (
                <div className="pl-5 pt-2 pb-3">
                  {entry.visual}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex items-center mt-2 group relative z-10 w-full">
          <span className="text-white/50 mr-3 font-bold group-hover:text-neon-blue transition-colors">~</span>
          <div className="relative flex-1 flex items-center">
             {suggestion && suggestion !== input.toLowerCase().trim() && (
                <span className="absolute left-0 text-white/20 pointer-events-none whitespace-pre pr-8 overflow-hidden text-ellipsis w-full text-[13px]">
                   {suggestion}
                </span>
             )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none outline-none text-white focus:ring-0 p-0 m-0 z-10 text-[13px] tracking-tight relative caret-white"
              autoFocus
              spellCheck={false}
            />
          </div>
        </div>
        <div ref={endRef} className="h-4" />
      </div>
    </div>
  );
}

// --- Visual Output Blocks --- //

function VisualCard({ title, subtitle, icon, meta }: { title: string, subtitle?: string, icon?: React.ReactNode, meta?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full max-w-sm backdrop-blur-md flex flex-col gap-3 hover:bg-white/10 transition-colors cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-md border border-white/10">
            {icon || <Command className="w-4 h-4 text-white/70" />}
          </div>
          <div className="font-sans">
             <div className="text-white font-medium text-sm leading-none mb-1">{title}</div>
             {subtitle && <div className="text-white/50 text-xs">{subtitle}</div>}
          </div>
        </div>
        {meta && (
          <div className="text-[10px] uppercase tracking-wider text-white/30 border border-white/10 px-2 py-0.5 rounded-full font-mono">
            {meta}
          </div>
        )}
      </div>
    </div>
  )
}

function SearchVisual({ query }: { query: string }) {
  const images = Array.from({ length: 3 }).map((_, i) => `https://picsum.photos/seed/${query + i}/300/200`);
  
  return (
    <div className="flex flex-col gap-3 max-w-md w-full">
       <div className="text-xs text-white/50 flex items-center gap-2">
         <SearchIcon className="w-3 h-3" /> Found 3 visual assets matching <span className="text-white italic">&quot;{query}&quot;</span>
       </div>
       <div className="grid grid-cols-3 gap-2">
         {images.map((img, i) => (
           <React.Fragment key={i}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={img} className="w-full aspect-[4/3] object-cover rounded-md border border-white/10 hover:border-white/30 transition-colors" alt="Asset" />
           </React.Fragment>
         ))}
       </div>
       <button className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 border border-white/10 rounded-md font-sans text-xs text-white/70 hover:bg-white/10 transition-colors mt-1">
         <ExternalLink className="w-3 h-3" /> Insert into Workspace
       </button>
    </div>
  )
}
