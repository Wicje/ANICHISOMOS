'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOS, OSWindow } from '@/lib/os-context';
import { Folder, File as FileIcon, FileText, Image as ImageIcon, Video, Box, Search, Plus, Trash2, Cloud, Download, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { get, set } from 'idb-keyval';
import { format } from 'date-fns';

type FileItem = {
  id: string;
  name: string;
  type: 'image' | 'doc' | 'video' | 'design' | 'folder' | 'project' | 'unknown';
  date: string;
  size: string;
  content?: string; // base64 or text
  projectId?: string;
};

const initialFiles: FileItem[] = [
  { id: '1', name: 'Nike Campaign', type: 'project', date: 'Oct 23', size: '--', projectId: 'nike-campaign' },
  { id: '2', name: 'Tesla Redesign', type: 'project', date: 'Oct 22', size: '--', projectId: 'tesla-redesign' },
  { id: '3', name: 'Portfolio OS', type: 'project', date: 'Oct 20', size: '--', projectId: 'portfolio-v3' },
  { id: '4', name: 'Moodboard_01.png', type: 'image', date: 'Oct 19', size: '2.4 MB' },
  { id: '5', name: 'Site_Design.fig', type: 'design', date: 'Oct 19', size: '14.2 MB' },
];

export function FileManager({ window }: { window: OSWindow }) {
  const { loadProject } = useOS();
  const [activeTab, setActiveTab] = useState('My Cloud Drive');
  const tabs = ['My Cloud Drive', 'Shared With Me', 'Google Drive', 'Dropbox'];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    get('anichisom_os_files').then((saved) => {
      if (saved) {
        setFiles(saved);
      } else {
        setFiles(initialFiles);
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      set('anichisom_os_files', files);
    }
  }, [files, isLoaded]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        let type: FileItem['type'] = 'unknown';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('text/') || file.name.endsWith('.md')) type = 'doc';
        else if (file.name.endsWith('.fig') || file.name.endsWith('.sketch')) type = 'design';

        const newFile: FileItem = {
          id: crypto.randomUUID(),
          name: file.name,
          type,
          date: format(new Date(), 'MMM dd'),
          size: (file.size / 1024).toFixed(1) + ' KB',
          content: event.target?.result as string
        };
        setFiles(prev => [newFile, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const downloadToLocal = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    let content = file.content;
    let mime = 'text/plain';
    
    // For projects or unknown content we fallback to JSON
    if (file.type === 'project' || (!content && file.type !== 'image')) {
      content = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(file, null, 2));
    }
    
    if (content) {
      if (!content.startsWith('data:')) {
         // ensure it's a data url if it's not base64 already
         content = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
      }
      const a = document.createElement('a');
      a.href = content;
      a.download = file.name + (file.type === 'project' ? '.json' : '');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  if (!isLoaded) return null;

  return (
    <div className="w-full h-full flex bg-[#0a0a0a]/90 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-48 border-r border-white/5 p-4 flex flex-col gap-2 shrink-0">
        <div className="font-display text-xs text-white/40 uppercase tracking-widest mb-4 px-2">Locations</div>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "text-left px-3 py-1.5 rounded-md text-sm transition-colors",
              activeTab === tab ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            {tab}
          </button>
        ))}
        
        <div className="mt-8 font-display text-xs text-white/40 uppercase tracking-widest mb-4 px-2">Tags</div>
        <div className="flex flex-wrap gap-2 px-2">
          <span className="w-3 h-3 rounded-full bg-neon-blue cursor-pointer hover:scale-125 transition-transform" />
          <span className="w-3 h-3 rounded-full bg-electric-purple cursor-pointer hover:scale-125 transition-transform" />
          <span className="w-3 h-3 rounded-full bg-acid-green cursor-pointer hover:scale-125 transition-transform" />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-sm focus-within:border-white/30 transition-colors w-64">
            <Search className="w-4 h-4 text-white/50" />
            <input 
              type="text" 
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-white placeholder:text-white/30 w-full"
            />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            multiple 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 flex items-center justify-center rounded-md bg-white text-black hover:bg-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#0a0a0a] to-[#111111]">
          <div className="flex items-center gap-3 mb-6 px-1">
             <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Cloud className="w-4 h-4 text-blue-400" />
             </div>
             <h2 className="text-xl font-medium tracking-tight">{activeTab}</h2>
          </div>
          {filteredFiles.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/40 font-mono text-sm">
              No files found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map(file => (
                <div 
                  key={file.id} 
                  onDoubleClick={() => file.type === 'project' && file.projectId && loadProject(file.projectId)}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                    <button onClick={(e) => downloadToLocal(file, e)} className="p-1 hover:bg-white/10 rounded" title="Download to Local">
                      <Download className="w-4 h-4 text-white/50 hover:text-white" />
                    </button>
                    <button onClick={(e) => deleteFile(file.id, e)} className="p-1 hover:bg-white/10 rounded" title="Delete">
                      <Trash2 className="w-4 h-4 text-white/50 hover:text-rose-500" />
                    </button>
                  </div>
                  <div className="w-16 h-16 mb-4 flex items-center justify-center">
                    {file.type === 'folder' && <Folder className="w-12 h-12 text-neon-blue/80 group-hover:text-neon-blue" fill="currentColor" />}
                    {file.type === 'project' && (
                       <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors shadow-lg">
                          <Folder className="w-6 h-6 text-white" fill="currentColor" />
                       </div>
                    )}
                    {file.type === 'image' && (
                      file.content ? 
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.content} alt={file.name} className="w-12 h-12 object-cover rounded" /> :
                        <ImageIcon className="w-12 h-12 text-electric-purple/80 group-hover:text-electric-purple" />
                    )}
                    {file.type === 'doc' && <FileText className="w-12 h-12 text-white/50 group-hover:text-white/80" />}
                    {file.type === 'video' && <Video className="w-12 h-12 text-acid-green/80 group-hover:text-acid-green" />}
                    {(file.type === 'design' || file.type === 'unknown') && <Box className="w-12 h-12 text-orange-400/80 group-hover:text-orange-400" />}
                  </div>
                  <div className="text-sm text-center text-white/90 font-medium truncate w-full">{file.name}</div>
                  <div className="text-xs text-white/40 mt-1">{file.date} • {file.size}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
