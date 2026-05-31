'use client';

import React, { useState, useEffect } from 'react';
import { OSWindow } from '@/lib/os-context';
import { db, doc, updateDoc, collection, getDocs, sendPasswordResetEmail, auth } from '@/lib/firebase';
import { ShieldCheck, UserCheck, UserX, Key, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminPanel({ window }: { window: OSWindow }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const qs = await getDocs(collection(db, 'users'));
      const loaded: any[] = [];
      qs.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() });
      });
      setUsers(loaded);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const qs = await getDocs(collection(db, 'users'));
        if (!active) return;
        const loaded: any[] = [];
        qs.forEach(doc => {
          loaded.push({ id: doc.id, ...doc.data() });
        });
        setUsers(loaded);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => { active = false; };
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { status: 'approved' });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { role });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Password reset email sent to ${email}`);
    } catch (e: any) {
      alert(`Error sending reset email: ${e.message}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] text-white font-sans overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
         <h2 className="text-lg font-medium flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Access Control Panel
         </h2>
         <button onClick={fetchUsers} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
         {loading ? (
            <div className="flex justify-center py-8">
               <Loader2 className="w-6 h-6 animate-spin text-white/50" />
            </div>
         ) : users.length === 0 ? (
            <div className="text-center text-white/50 text-sm py-8">No users found.</div>
         ) : (
            <div className="grid gap-3">
               {users.map(u => (
                  <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                     <div className="flex flex-col">
                        <span className="font-semibold text-sm">{u.name}</span>
                        <span className="text-xs text-white/50 font-mono">{u.email}</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-white/40">Role:</span>
                           <select 
                             value={u.role || 'filmmaker'} 
                             onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                             className="bg-black border border-white/20 rounded px-2 py-1 text-xs outline-none"
                             disabled={u.status !== 'approved' && u.role !== 'admin'}
                           >
                              <option value="admin">Admin</option>
                              <option value="technician">Technician</option>
                              <option value="filmmaker">Filmmaker</option>
                           </select>
                        </div>

                        {u.status === 'pending' ? (
                           <button onClick={() => handleApprove(u.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded shadow text-xs font-medium transition-colors">
                              <UserCheck className="w-4 h-4" /> Approve
                           </button>
                        ) : (
                           <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-emerald-400 text-xs px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                 Active
                              </div>
                              <button onClick={() => handleResetPassword(u.email)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors" title="Send Password Reset">
                                 <Key className="w-4 h-4" />
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
