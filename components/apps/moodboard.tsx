'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OSWindow } from '@/lib/os-context';
import { motion, useDragControls } from 'motion/react';
import { MousePointer2, GripHorizontal, Type, Image as ImageIcon, Trash2, Video, Link as LinkIcon, Upload, MessageSquare } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { cn } from '@/lib/utils';
import { db, doc, onSnapshot, setDoc } from '@/lib/firebase';

type BoardNode = {
  id: string;
  type: 'image' | 'text' | 'video' | 'embed';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string;
};

type Comment = {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
};

function getEmbedDetails(url: string) {
  try {
    if (url.includes('youtube.com/watch') || url.includes('youtube.com/shorts/')) {
      const urlObj = new URL(url);
      const v = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
      return { url: `https://www.youtube.com/embed/${v}`, w: 400, h: 225 };
    }
    if (url.includes('youtu.be/')) {
      const urlObj = new URL(url);
      return { url: `https://www.youtube.com/embed${urlObj.pathname}`, w: 400, h: 225 };
    }
    if (url.includes('instagram.com/')) {
      const cleanUrl = url.split('?')[0].replace(/\/$/, '');
      return { url: `${cleanUrl}/embed`, w: 340, h: 440 };
    }
    if (url.includes('pinterest.com/pin/')) {
      const parts = url.split('/');
      const pinIndex = parts.indexOf('pin');
      if (pinIndex !== -1 && parts[pinIndex + 1]) {
        return { url: `https://assets.pinterest.com/ext/embed.html?id=${parts[pinIndex + 1]}`, w: 236, h: 420 };
      }
    }
  } catch (e) {}
  return { url, w: 400, h: 300 }; // Default
}

const isImageUrl = (url: string) => /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url);

import { WorkspaceIndicator } from '@/components/workspace-indicator';

export function Moodboard({ window }: { window: OSWindow }) {
  const { currentUser } = useOS();
  const [workspaceMode, setWorkspaceMode] = useState<'private' | 'shared'>('private');
  const [nodes, setNodes] = useState<BoardNode[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });
  const [isPanning, setIsPanning] = useState(false);
  
  const colorRef = useRef<string>('#000');
  const isSyncingRef = useRef(false);

  const projectId = window.data?.projectId || 'global';
  const roomId = `moodboard-${projectId}`;
  const storageKey = `anichisom_os_moodboard_v3_${projectId}`;
  
  // Storage and Subscribe
  useEffect(() => {
    let isMounted = true;
    colorRef.current = `hsl(${Math.round(Math.random() * 360)}, 100%, 50%)`;
    
    if (workspaceMode === 'private') {
      get(storageKey).then((saved) => {
        if (!isMounted) return;
        if (saved && saved.nodes) {
          setNodes(saved.nodes);
          if (saved.comments) setComments(saved.comments);
        } else {
          setNodes([
            { id: '1', type: 'text', x: 100, y: 100, content: `CAMPAIGN: "${projectId.toUpperCase()}"\n\nPrivate workspace mode (Tip: Paste images or text here)` },
          ]);
        }
        setIsLoaded(true);
      });
    } else {
      if (!currentUser) return;
      // Subscribe to Firestore for real-time moodboard updates
      const roomRef = doc(db, 'moodboards', roomId);
      const unsub = onSnapshot(roomRef, (snap) => {
        if (!isMounted) return;
        if (snap.exists()) {
          const state = snap.data();
          if (state && state.nodes) {
             isSyncingRef.current = true;
             setNodes(state.nodes);
             if (state.comments) setComments(state.comments);
          }
        } else {
          setNodes([
             { id: '1', type: 'text', x: 100, y: 100, content: `CAMPAIGN: "${projectId.toUpperCase()}"\n\nShared workspace mode` },
          ]);
        }
        setIsLoaded(true);
      });
      return () => { isMounted = false; unsub(); };
    }
    return () => { isMounted = false; };
  }, [roomId, storageKey, workspaceMode, currentUser, projectId]);

  // Handle inject data from window param on first load
  useEffect(() => {
     if (isLoaded && window.data?.url) {
       setNodes(prev => {
          if (!prev.find(n => n.content === window.data?.url)) {
             return [...prev, { id: crypto.randomUUID(), type: 'image', x: 200, y: 200, width: 400, content: window.data.url }];
          }
          return prev;
       });
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.data?.url, isLoaded]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      setCamera(prev => {
        let { x, y, z } = prev;
        
        if (e.ctrlKey || e.metaKey) {
          const zoomFactor = Math.pow(0.995, e.deltaY);
          const newZ = Math.min(Math.max(0.1, z * zoomFactor), 5);
          
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          x = mouseX - (mouseX - x) * (newZ / z);
          y = mouseY - (mouseY - y) * (newZ / z);
          z = newZ;
        } else {
          x -= e.deltaX;
          y -= e.deltaY;
        }
        
        return { x, y, z };
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Save to storage
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoaded) {
      if (workspaceMode === 'private') {
        timeout = setTimeout(() => {
          set(storageKey, { nodes, comments });
        }, 500);
      } else {
        timeout = setTimeout(() => {
          if (isSyncingRef.current) {
            isSyncingRef.current = false;
            return;
          }
          const roomRef = doc(db, 'moodboards', roomId);
          const stateToSync = { nodes, comments: comments || [], workspaceMode: 'shared' };
          setDoc(roomRef, stateToSync, { merge: true }).catch(err => {
             console.error("Firebase sync error", err);
          });
        }, 500);
      }
    }
    return () => clearTimeout(timeout);
  }, [nodes, comments, isLoaded, roomId, storageKey, workspaceMode]);

  const addText = () => {
    const x = (window.width / 2 - camera.x) / camera.z;
    const y = (window.height / 2 - camera.y) / camera.z;
    setNodes([...nodes, { id: crypto.randomUUID(), type: 'text', x, y, content: 'New Text' }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const x = (window.width / 2 - camera.x) / camera.z;
        const y = (window.height / 2 - camera.y) / camera.z;
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        setNodes(prev => [...prev, { id: crypto.randomUUID(), type, x, y, content: base64 }]);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLink = () => {
    const url = prompt('Enter a URL (YouTube, Instagram, Pinterest, Image, etc.):');
    if (url) {
      processUrl(url);
    }
  };

  const processUrl = (url: string) => {
    const x = (window.width / 2 - camera.x) / camera.z;
    const y = (window.height / 2 - camera.y) / camera.z;
    
    let type: BoardNode['type'] = 'embed';
    if (isImageUrl(url)) {
        type = 'image';
    } else if (url.includes('youtube.com/') || url.includes('youtu.be/') || url.includes('instagram.com/') || url.includes('pinterest.com/')) {
        type = 'embed';
    }
    setNodes(prev => [...prev, { id: crypto.randomUUID(), type, x, y, content: url }]);
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };
  
  const updateNodePosition = (id: string, x: number, y: number) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
  };
  
  const updateNodeContent = (id: string, content: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, content } : n));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Check if we are pasting into a textarea, if so let it happen natively
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      return; 
    }

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const x = (window.width / 2 - camera.x) / camera.z;
            const y = (window.height / 2 - camera.y) / camera.z;
            setNodes(prev => [...prev, { id: crypto.randomUUID(), type: 'image', x, y, content: base64 }]);
          };
          reader.readAsDataURL(file);
        }
        return; // stop after first image
      }
    }
    
    // If no image, try text
    const text = e.clipboardData.getData('text');
    if (text) {
        if (/^https?:\/\//.test(text.trim())) {
           processUrl(text.trim());
        } else {
           const x = (window.width / 2 - camera.x) / camera.z;
           const y = (window.height / 2 - camera.y) / camera.z;
           setNodes(prev => [...prev, { id: crypto.randomUUID(), type: 'text', x, y, content: text }]);
        }
    }
  };

  const [mode, setMode] = useState<'pan'|'select'|'comment'>('select');

  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click or right click panning
    if (e.button === 1 || e.button === 2 || mode === 'pan') {
      e.preventDefault();
      setIsPanning(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (mode === 'comment' && e.target === e.currentTarget) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - camera.x) / camera.z;
      const y = (e.clientY - rect.top - camera.y) / camera.z;
      
      const newComment: Comment = {
        id: crypto.randomUUID(),
        x, y, text: 'New comment...', author: 'Guest'
      };
      setComments(prev => [...prev, newComment]);
      setMode('select');
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setCamera(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!isLoaded) return null;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "w-full h-full bg-[#eee] overflow-hidden relative font-sans outline-none",
        isPanning ? "cursor-grabbing" : "cursor-default"
      )}
      onPaste={handlePaste}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      tabIndex={0} 
    >
      {/* Canvas Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20 origin-top-left"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', 
          backgroundSize: `${24 * camera.z}px ${24 * camera.z}px`,
          backgroundPosition: `${camera.x}px ${camera.y}px`
        }}
      />

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-black/10 z-50 flex items-center gap-2">
        <WorkspaceIndicator 
          mode={workspaceMode} 
          onToggle={() => setWorkspaceMode(prev => prev === 'private' ? 'shared' : 'private')} 
          roomId={`moodboard-${projectId}`}
          className="mr-2"
          variant="light"
        />
        <div className="w-px h-6 bg-black/10 mx-[-4px]" />
        
        <button onClick={() => setMode('select')} className={cn("w-8 h-8 rounded flex items-center justify-center transition-colors", mode === 'select' ? "bg-black text-white" : "text-black/60 hover:bg-slate-100 hover:text-black")}>
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button onClick={() => setMode('comment')} className={cn("w-8 h-8 rounded flex items-center justify-center transition-colors", mode === 'comment' ? "bg-black text-white" : "text-black/60 hover:bg-slate-100 hover:text-black")} title="Add Comment">
          <MessageSquare className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-black/10 mx-2" />
        <button onClick={addText} className="w-8 h-8 rounded flex items-center justify-center text-black/60 hover:bg-slate-100 hover:text-black transition-colors" title="Add Text">
          <Type className="w-4 h-4" />
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 rounded flex items-center justify-center text-black/60 hover:bg-slate-100 hover:text-black transition-colors" title="Upload Media (Image/Video)">
          <Upload className="w-4 h-4" />
        </button>
        <button onClick={handleAddLink} className="w-8 h-8 rounded flex items-center justify-center text-black/60 hover:bg-slate-100 hover:text-black transition-colors" title="Add Link (YouTube, Instagram, etc.)">
          <LinkIcon className="w-4 h-4" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*" 
          onChange={handleFileUpload} 
        />
      </div>

      {/* Nodes & Cursors */}
      <div 
        className="absolute inset-0 origin-top-left"
        style={{ 
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
        }}
      >
        {nodes.map(node => (
          <DraggableNode 
            key={node.id} 
            node={node} 
            cameraScale={camera.z}
            onDelete={() => deleteNode(node.id)} 
            onPositionChange={(x, y) => updateNodePosition(node.id, x, y)}
            onContentChange={(content) => updateNodeContent(node.id, content)}
          />
        ))}

        {comments.map((comment, i) => (
          <div 
            key={comment.id}
            className="absolute rounded bg-yellow-200 text-black shadow-md border border-yellow-400 p-2 text-sm w-48 font-sans cursor-text group"
            style={{ left: comment.x, top: comment.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
             <button 
                onClick={() => setComments(c => c.filter(x => x.id !== comment.id))}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
             >
                ×
             </button>
             <div className="text-[10px] uppercase font-bold text-black/40 mb-1">{comment.author}</div>
             <textarea 
               className="w-full bg-transparent border-none outline-none resize-none"
               value={comment.text}
               onChange={(e) => setComments(c => c.map(x => x.id === comment.id ? { ...x, text: e.target.value } : x))}
               placeholder="Write comment..."
               rows={2}
               autoFocus={i === comments.length - 1}
             />
          </div>
        ))}
      </div>
    </div>
  );
}

function DraggableNode({ node, cameraScale, onDelete, onPositionChange, onContentChange }: { node: BoardNode, cameraScale: number, onDelete: () => void, onPositionChange: (x: number, y: number) => void, onContentChange: (c: string) => void }) {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ x: node.x, y: node.y, opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onDragEnd={(e, info) => {
        onPositionChange(node.x + info.offset.x / cameraScale, node.y + info.offset.y / cameraScale);
      }}
      className="absolute bg-white shadow-xl rounded-lg border border-black/10 overflow-hidden group min-w-[200px]"
      style={{ position: 'absolute' }} 
    >
      <div 
        className="h-6 w-full bg-slate-50 border-b border-black/5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity flex items-center justify-between px-2 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripHorizontal className="w-3 h-3 text-slate-400" />
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={onDelete}
          className="hover:bg-rose-100 p-0.5 rounded text-rose-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      {node.type === 'text' && (
        <div className="p-4 font-sans text-black">
          <textarea 
            className="w-full bg-transparent border-none outline-none resize-none min-h-[100px]"
            value={node.content}
            onChange={(e) => onContentChange(e.target.value)}
            spellCheck={false}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Type or paste text..."
          />
        </div>
      )}

      {node.type === 'image' && (
        <div className="p-2 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={node.content} className="max-w-[400px] h-auto object-cover rounded pointer-events-none" alt="Moodboard content" />
        </div>
      )}

      {node.type === 'video' && (
        <div className="p-2">
          <video 
            src={node.content} 
            className="max-w-[400px] h-[300px] object-cover rounded" 
            controls 
            onPointerDown={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {node.type === 'embed' && (
        <div 
          className="p-2"
          style={{ 
            width: getEmbedDetails(node.content).w + 16, 
            height: getEmbedDetails(node.content).h + 16 
          }}
        >
          <iframe 
            src={getEmbedDetails(node.content).url} 
            className="w-full h-full border-none rounded pointer-events-auto"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </motion.div>
  );
}
