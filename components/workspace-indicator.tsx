'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Users, Link as LinkIcon, Check, Plus, Server } from 'lucide-react';
import { useOS } from '@/lib/os-context';
import { doc, onSnapshot, setDoc, db } from '@/lib/firebase';

interface WorkspaceIndicatorProps {
  mode: 'private' | 'shared';
  onToggle: () => void;
  roomId: string;
  className?: string;
  variant?: 'dark' | 'light' | 'notion';
}

export function WorkspaceIndicator({ mode, onToggle, roomId, className, variant = 'dark' }: WorkspaceIndicatorProps) {
  const { currentUser } = useOS();
  const [copied, setCopied] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (mode === 'private' || !currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveUsers([]);
      return;
    }

    const presenceRef = doc(db, 'presence', roomId);
    
    setDoc(presenceRef, {
      [currentUser.id]: {
        name: currentUser.name,
        avatar: currentUser.avatarUrl,
        timestamp: Date.now()
      }
    }, { merge: true });

    const unsub = onSnapshot(presenceRef, (snap) => {
       if (snap.exists()) {
          const data = snap.data();
          const users = Object.values(data).filter((u: any) => Date.now() - u.timestamp < 60000);
          setActiveUsers(users);
       }
    });

    const interval = setInterval(() => {
       setDoc(presenceRef, {
         [currentUser.id]: {
            name: currentUser.name,
            avatar: currentUser.avatarUrl,
            timestamp: Date.now()
         }
       }, { merge: true });
    }, 30000);

    return () => {
       clearInterval(interval);
       unsub();
    };
  }, [mode, roomId, currentUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`ziklagos://join/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLight = variant === 'light';
  const isNotion = variant === 'notion';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button 
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-[10px] font-bold uppercase tracking-wider",
          isNotion ? (mode === 'shared' ? 'bg-blue-50 text-blue-600' : 'bg-black/5 text-[#37352f]/50 hover:bg-black/10') :
          isLight ? (mode === 'shared' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200') :
          (mode === 'shared' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/10 text-white/50 hover:bg-white/20')
        )}
      >
        <Server className="w-3 h-3" />
        <span>{mode === 'private' ? 'Local Compute' : 'Cloud Shared'}</span>
      </button>

      {mode === 'shared' && (
        <div className="flex items-center gap-1 flex-row-reverse border-l border-current pl-2 ml-1 opacity-80">
          <div className="flex items-center -space-x-1.5 mr-2">
            {activeUsers.slice(0, 3).map((u, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-slate-300 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center text-[8px] font-bold bg-gradient-to-br from-blue-400 to-indigo-500 text-white" title={u.name}>
                 {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name[0]}
              </div>
            ))}
            {activeUsers.length === 0 && currentUser && (
               <div className="w-5 h-5 rounded-full border-2 border-white overflow-hidden shadow-sm flex items-center justify-center text-[8px] font-bold bg-gradient-to-br from-blue-400 to-indigo-500 text-white" title={currentUser.name}>
                 {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" /> : currentUser.name[0]}
              </div>
            )}
            {activeUsers.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600 shadow-sm z-10">
                 +{activeUsers.length - 3}
              </div>
            )}
          </div>
          
          <div className="relative">
             <button 
               onClick={() => setShowInvite(!showInvite)}
               className={cn(
                 "p-1 rounded-full hover:bg-black/10 transition-colors flex items-center justify-center",
                 isNotion ? 'text-[#37352f]/50 hover:text-[#37352f]' : isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/50 hover:text-white'
               )}
               title="Invite Collaborators"
             >
               <Plus className="w-3.5 h-3.5" />
             </button>
             {showInvite && (
               <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 text-slate-800 pointer-events-auto">
                 <div className="text-xs font-semibold mb-2 px-1">Invite Link</div>
                 <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-100">
                    <input type="text" readOnly value={`ziklagos://join/${roomId}`} className="bg-transparent border-none outline-none text-[10px] flex-1 text-slate-500 px-1" />
                    <button onClick={handleCopy} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors shrink-0">
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <LinkIcon className="w-3 h-3" />}
                    </button>
                 </div>
                 <div className="text-[9px] text-slate-400 mt-2 px-1 leading-tight">
                    Anyone on this node can join using this link.
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
