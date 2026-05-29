'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useDragControls } from 'motion/react';
import { useOS, OSWindow } from '@/lib/os-context';
import { X, Minus, Maximize2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WindowFrameProps {
  osWindow: OSWindow;
  children: React.ReactNode;
}

export function WindowFrame({ osWindow, children }: WindowFrameProps) {
  const { id, title, isMaximized, isMinimized, zIndex, x, y, width, height } = osWindow;
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowDimensions, windows } = useOS();
  const dragControls = useDragControls();
  
  const windowRef = useRef<HTMLDivElement>(null);
  const resizeHandlers = useRef<{ move?: (e: PointerEvent) => void, up?: () => void }>({});
  
  const [isResizing, setIsResizing] = useState(false);
  const [localSize, setLocalSize] = useState({ w: width, h: height });
  const [localPosition, setLocalPosition] = useState({ x, y });

  useEffect(() => {
    // Copy the ref to a variable to satisfy the linter and ensure safety
    const handlers = resizeHandlers.current;
    
    return () => {
      // Ensure no dangling event listeners if unmounted while resizing
      if (handlers.move) {
        document.removeEventListener('pointermove', handlers.move);
      }
      if (handlers.up) {
        document.removeEventListener('pointerup', handlers.up);
      }
    };
  }, []);

  // Use props normally, but use local state while dragging/resizing if needed.
  // Actually, simplest fix for the linter: just use props as the source of truth
  // and only use local state for intermediate resizing.
  const currentWidth = isResizing ? localSize.w : width;
  const currentHeight = isResizing ? localSize.h : height;
  const currentX = x;
  const currentY = y;

  // Is this window the currently focused one?
  const isActive = zIndex >= Math.max(...windows.map(w => w.zIndex));

  if (isMinimized) return null;

  return (
    <motion.div
      ref={windowRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        width: isMaximized ? '100vw' : currentWidth,
        height: isMaximized ? 'calc(100vh - 48px)' : currentHeight,
        x: isMaximized ? 0 : currentX,
        y: isMaximized ? 0 : currentY,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }
      }}
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false} // Only drag using the header
      dragMomentum={false}
      onDragEnd={(e, info) => {
        const newX = currentX + info.offset.x;
        const newY = currentY + info.offset.y;
        setLocalPosition({ x: newX, y: newY });
        updateWindowDimensions(id, newX, newY, currentWidth, currentHeight);
      }}
      style={{ zIndex }}
      onPointerDown={() => focusWindow(id)}
      className={cn(
        "absolute rounded-xl overflow-hidden flex flex-col pointer-events-auto",
        "border transition-colors duration-200",
        isActive 
          ? "border-white/30 bg-black/70 backdrop-blur-2xl shadow-[0_4px_40px_rgba(0,240,255,0.05)]" 
          : "border-white/10 bg-black/40 backdrop-blur-md shadow-2xl"
      )}
    >
      {/* Window Header */}
      <div 
        className={cn(
          "h-10 flex items-center justify-between px-3 shrink-0 rounded-t-xl",
          isActive ? "bg-white/5" : "bg-transparent"
        )}
        onPointerDown={(e) => {
           focusWindow(id);
           dragControls.start(e);
        }}
        onDoubleClick={() => maximizeWindow(id)}
      >
        <div className="flex gap-2 items-center">
          {/* Mac OS style window controls */}
          <button 
            onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
            className="w-3 h-3 rounded-full bg-slate-600 hover:bg-rose-500 transition-colors flex items-center justify-center group"
          >
            <X className="w-2 h-2 opacity-0 group-hover:opacity-100 text-black" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
            className="w-3 h-3 rounded-full bg-slate-600 hover:bg-amber-400 transition-colors flex items-center justify-center group"
          >
            <Minus className="w-2 h-2 opacity-0 group-hover:opacity-100 text-black" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }}
            className="w-3 h-3 rounded-full bg-slate-600 hover:bg-emerald-400 transition-colors flex items-center justify-center group"
          >
            <Maximize2 className="w-2 h-2 opacity-0 group-hover:opacity-100 text-black shrink-0" />
          </button>
        </div>
        
        <div className="font-display text-xs text-white/50 tracking-wider uppercase select-none pointer-events-none">
          {title}
        </div>
        
        <div className="w-[44px]" /* spacer for centering */ />
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden relative break-words bg-black/50">
        {children}
      </div>
      
      {/* Absolute Bottom Right Resizer */}
      {!isMaximized && isActive && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-[1px] opacity-20 hover:opacity-100"
          onPointerDown={(e) => {
            e.stopPropagation();
            if (isMaximized) return;
            setIsResizing(true);
            const startW = currentWidth;
            const startH = currentHeight;
            const startX = e.clientX;
            const startY = e.clientY;

            let newW = startW;
            let newH = startH;

            const handlePointerMove = (moveEvent: PointerEvent) => {
              newW = Math.max(300, startW + (moveEvent.clientX - startX));
              newH = Math.max(200, startH + (moveEvent.clientY - startY));
              setLocalSize({ w: newW, h: newH });
            };

            const handlePointerUp = () => {
              setIsResizing(false);
              if (resizeHandlers.current.move) document.removeEventListener('pointermove', resizeHandlers.current.move);
              if (resizeHandlers.current.up) document.removeEventListener('pointerup', resizeHandlers.current.up);
              resizeHandlers.current.move = undefined;
              resizeHandlers.current.up = undefined;
              // Set the actual state with the locally captured new values
              updateWindowDimensions(id, currentX, currentY, newW, newH);
            };

            resizeHandlers.current.move = handlePointerMove;
            resizeHandlers.current.up = handlePointerUp;

            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handlePointerUp);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white">
            <path d="M10 2V10H2" stroke="currentColor" strokeWidth="1" />
            <path d="M6 6V10H2" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}
