'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { get, set, clear } from 'idb-keyval';

export type OSWindow = {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  width: number;
  height: number;
  x: number;
  y: number;
  data?: any; // For passing initial state or props to the app
};

export type Snapshot = {
  id: string;
  timestamp: number;
  name: string;
  windows: OSWindow[];
};

type OSContextType = {
  windows: OSWindow[];
  snapshots: Snapshot[];
  openWindow: (appId: string, title?: string, data?: any) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  updateWindowDimensions: (id: string, x: number, y: number, width: number, height: number) => void;
  applyWorkspaceLayout: (layout: 'creative-split') => void;
  loadProject: (projectId: string) => void;
  saveSnapshot: (name: string) => void;
  restoreSnapshot: (id: string) => void;
  wipeSession: () => Promise<void>;
};

const OSContext = createContext<OSContextType | undefined>(undefined);

export function OSProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<OSWindow[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const highestZIndexRef = useRef(10);

  useEffect(() => {
    get('anichisom_os_snapshots').then(data => {
      if (data) setSnapshots(data);
    });
  }, []);

  const saveSnapshot = useCallback((name: string) => {
    const newSnapshot: Snapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      name,
      windows: JSON.parse(JSON.stringify(windows))
    };
    setSnapshots(prev => {
      const updated = [newSnapshot, ...prev];
      set('anichisom_os_snapshots', updated);
      return updated;
    });
  }, [windows]);

  const restoreSnapshot = useCallback((id: string) => {
    const snap = snapshots.find(s => s.id === id);
    if (snap) {
      setWindows(JSON.parse(JSON.stringify(snap.windows)));
      const highest = Math.max(10, ...snap.windows.map(w => w.zIndex));
      highestZIndexRef.current = highest;
    }
  }, [snapshots]);

  const wipeSession = useCallback(async () => {
    // Leave no trace - clear indexdb and local storage
    await clear();
    localStorage.clear();
    window.location.reload();
  }, []);

  const focusWindow = useCallback((id: string) => {
    highestZIndexRef.current += 1;
    const nextZ = highestZIndexRef.current;
    
    setWindows((curr) => 
      curr.map((w) => w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w)
    );
  }, []);

  const openWindow = useCallback((appId: string, title?: string, data?: any) => {
    const defaultTitles: Record<string, string> = {
      'terminal': 'Terminal',
      'browser': 'Mini Browser',
      'files': 'File Manager',
      'moodboard': 'Moodboard',
      'code': 'Code Editor',
      'campaign': 'Campaign Lab'
    };

    const newId = `${appId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const windowTitle = title || defaultTitles[appId] || 'App';
    
    highestZIndexRef.current += 1;
    const nextZ = highestZIndexRef.current;

    setWindows((curr) => {
      // Prevent duplicate instances of the same app; focus it instead
      const existing = curr.find((w) => w.appId === appId);
      if (existing) {
        return curr.map((w) => 
          w.appId === appId 
            ? { ...w, zIndex: nextZ, isMinimized: false } 
            : w
        );
      }
      
      const offset = (curr.length % 5) * 40;
      const newWindow: OSWindow = {
        id: newId,
        appId,
        title: windowTitle,
        isMinimized: false,
        isMaximized: false,
        zIndex: nextZ,
        width: 800,
        height: 600,
        x: 100 + offset,
        y: 100 + offset,
        data,
      };
      
      return [...curr, newWindow];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((curr) => curr.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((curr) => curr.map((w) => w.id === id ? { ...w, isMinimized: true } : w));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((curr) => curr.map((w) => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  }, []);

  const updateWindowDimensions = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    setWindows((curr) => curr.map((w) => w.id === id ? { ...w, x, y, width, height } : w));
  }, []);

  const loadProject = useCallback((projectId: string) => {
    // Determine project specific layout
    const padding = 40;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const topSpace = 30; // menubar
    const gap = 10;
    
    // Clear all windows
    setWindows([]);
    
    setTimeout(() => {
      let nextZ = highestZIndexRef.current;
      
      const newWindows: OSWindow[] = [];
      const halfW = (w - (padding * 2) - gap) / 2;
      const termH = Math.min(300, h * 0.3);
      const topH = h - topSpace - padding - padding - termH - gap;

      newWindows.push({
        id: `browser-${Date.now()}-1`,
        appId: 'browser',
        title: `${projectId} - Live Preview`,
        isMinimized: false,
        isMaximized: false,
        zIndex: ++nextZ,
        width: halfW,
        height: topH,
        x: padding,
        y: topSpace + padding,
        data: { projectId }
      });

      newWindows.push({
        id: `code-${Date.now()}-2`,
        appId: 'code',
        title: `${projectId} - Source Code`,
        isMinimized: false,
        isMaximized: false,
        zIndex: ++nextZ,
        width: halfW,
        height: topH,
        x: padding + halfW + gap,
        y: topSpace + padding,
        data: { projectId }
      });

      newWindows.push({
        id: `moodboard-${Date.now()}-3`,
        appId: 'moodboard',
        title: `${projectId} - Moodboard`,
        isMinimized: true, // Start minimized so they can open it from dock
        isMaximized: false,
        zIndex: ++nextZ,
        width: 800,
        height: 600,
        x: 100,
        y: 100,
        data: { projectId }
      });

      newWindows.push({
        id: `terminal-${Date.now()}-4`,
        appId: 'terminal',
        title: `Terminal`,
        isMinimized: false,
        isMaximized: false,
        zIndex: ++nextZ,
        width: w - (padding * 2),
        height: termH,
        x: padding,
        y: topSpace + padding + topH + gap,
        data: { projectId }
      });

      setWindows(newWindows);
      highestZIndexRef.current = nextZ;
    }, 100);
  }, []);
  const applyWorkspaceLayout = useCallback((layout: 'creative-split') => {
    if (layout === 'creative-split') {
      const padding = 40;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const topSpace = 30; // menubar
      
      const gap = 10;
      const halfW = (w - (padding * 2) - gap) / 2;
      const termH = Math.min(300, h * 0.3);
      const topH = h - topSpace - padding - padding - termH - gap;
      
      // We will ensure moodboard, code, and terminal exist
      let nextZ = highestZIndexRef.current;

      setWindows(curr => {
        const layoutApps = ['moodboard', 'code', 'terminal'];
        
        let newWindows = [...curr];
        
        layoutApps.forEach(appId => {
           if (!newWindows.find(w => w.appId === appId)) {
             newWindows.push({
                id: `${appId}-preset`,
                appId,
                title: appId === 'code' ? 'Code Editor' : appId === 'moodboard' ? 'Moodboard' : 'Terminal',
                isMinimized: false,
                isMaximized: false,
                zIndex: ++nextZ,
                width: 400,
                height: 400,
                x: 0,
                y: 0
             });
           }
        });

        // Set dimensions
        return newWindows.map(win => {
          if (win.appId === 'moodboard') {
            return { ...win, x: padding, y: topSpace + padding, width: halfW, height: topH, isMaximized: false, isMinimized: false, zIndex: ++nextZ };
          }
          if (win.appId === 'code') {
            return { ...win, x: padding + halfW + gap, y: topSpace + padding, width: halfW, height: topH, isMaximized: false, isMinimized: false, zIndex: ++nextZ };
          }
          if (win.appId === 'terminal') {
            return { ...win, x: padding, y: topSpace + padding + topH + gap, width: w - (padding * 2), height: termH, isMaximized: false, isMinimized: false, zIndex: ++nextZ };
          }
          return win;
        });
      });
      highestZIndexRef.current = nextZ;
    }
  }, []);

  const value = useMemo(() => ({
    windows,
    snapshots,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowDimensions,
    applyWorkspaceLayout,
    loadProject,
    saveSnapshot,
    restoreSnapshot,
    wipeSession
  }), [windows, snapshots, openWindow, closeWindow, focusWindow, minimizeWindow, maximizeWindow, updateWindowDimensions, applyWorkspaceLayout, loadProject, saveSnapshot, restoreSnapshot, wipeSession]);

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
}
