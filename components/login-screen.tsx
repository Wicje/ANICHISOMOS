'use client';

import React, { useState } from 'react';
import { useOS, OSRole } from '@/lib/os-context';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, doc, getDoc, setDoc, sendPasswordResetEmail, db } from '@/lib/firebase';
import { AlertCircle, Loader2, ChevronLeft } from 'lucide-react';

const PROFILES = [
  { id: 'admin', name: 'Administrator', icon: '', color: 'bg-white/20 text-white', defaultEmail: 'anichisom4top@gmail.com' },
  { id: 'ziklag', name: 'Ziklag Team', icon: 'Z', color: 'bg-blue-500/20 text-blue-200', defaultEmail: '' },
  { id: 'filmmaker', name: 'Filmmaker', icon: 'F', color: 'bg-rose-500/20 text-rose-200', defaultEmail: '' },
];

export function LoginScreen() {
  const { setCurrentUser } = useOS();
  
  const [step, setStep] = useState<'profiles' | 'auth'>('profiles');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = PROFILES.find(p => p.id === profileId);
    if (profile?.defaultEmail) {
      setEmail(profile.defaultEmail);
    } else {
      setEmail('');
    }
    setPassword('');
    setError('');
    setMessage('');
    setStep('auth');
  };

  const handleBack = () => {
    setStep('profiles');
    setError('');
    setMessage('');
  };

  const selectedProfile = PROFILES.find(p => p.id === selectedProfileId);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.status === 'pending') {
              setError('Your account is pending admin approval.');
              await auth.signOut();
              setIsLoading(false);
              return;
            }
            setCurrentUser({
              id: user.uid,
              name: data.name || user.email?.split('@')[0] || 'User',
              role: data.role as OSRole || selectedProfileId || 'filmmaker'
            });
          } else {
              setError('Account configuration error. Please contact a system administrator.');
              await auth.signOut();
          }
        } catch (docErr: any) {
          // Offline fallback
          if (user.email?.toLowerCase() === 'anichisom4top@gmail.com') {
             setCurrentUser({
               id: user.uid,
               name: user.email?.split('@')[0] || 'Admin',
               role: 'admin'
             });
          } else {
             setError('Failed to contact server. Please check your connection.');
             await auth.signOut();
          }
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const isFirstAdmin = user.email?.toLowerCase() === 'anichisom4top@gmail.com';

        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            name: name || user.email?.split('@')[0],
            role: isFirstAdmin ? 'admin' : (selectedProfileId || 'filmmaker'),
            status: isFirstAdmin ? 'approved' : 'pending'
          });
          await auth.signOut();
          setIsLogin(true);
          setMessage(isFirstAdmin ? 'Admin account created successfully! You can log in.' : 'Account created! Please wait for admin approval.');
        } catch (err: any) {
           setError('Account created, but could not contact the server to complete setup. Please try logging in later.');
           await auth.signOut();
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
          setError('An account with this email already exists.');
      } else {
          setError(err.message || 'An authentication error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
      if (!email) {
          setError('Please enter your email to reset password.');
          return;
      }
      setIsLoading(true);
      setError('');
      setMessage('');
      try {
          await sendPasswordResetEmail(auth, email);
          setMessage('Password reset email sent (check spam folder).');
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center font-sans z-[9999]"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {step === 'profiles' ? (
          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
             <div className="text-white/80 font-medium text-xl mb-4">Select Workspace Role</div>
             <div className="flex items-center justify-center gap-8">
               {PROFILES.map(profile => (
                 <div 
                   key={profile.id} 
                   onClick={() => handleProfileSelect(profile.id)}
                   className="flex flex-col items-center gap-3 cursor-pointer group"
                 >
                   <div className={`w-20 h-20 rounded-full flex items-center justify-center border border-white/10 shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:border-white/30 backdrop-blur-md ${profile.color}`}>
                     <span className="text-3xl font-light">{profile.icon}</span>
                   </div>
                   <div className="text-white/70 font-medium text-sm group-hover:text-white transition-colors">
                     {profile.name}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6 p-8 rounded-2xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={handleBack}
              className="absolute top-4 left-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mt-2">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center border border-white/20 shadow-2xl mb-4 ${selectedProfile?.color}`}>
                  <span className="text-2xl font-light">{selectedProfile?.icon}</span>
               </div>
               <div className="text-white font-bold text-lg">{selectedProfile?.name} Access</div>
            </div>

            {error && (
                <div className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {message && (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-lg">
                    {message}
                </div>
            )}

            <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
                {!isLogin && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-white/50 font-medium ml-1">Full Name</label>
                        <input 
                            required 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                            placeholder="Full Name"
                        />
                    </div>
                )}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/50 font-medium ml-1">Email Address</label>
                    <input 
                        required 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="name@example.com"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/50 font-medium ml-1">Password</label>
                    <input 
                        required 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="••••••••"
                    />
                </div>

                <button disabled={isLoading} type="submit" className="w-full bg-white text-black hover:bg-white/90 font-medium rounded-xl px-4 py-3 text-sm transition-colors mt-2 flex items-center justify-center">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black/50" /> : (isLogin ? 'Log In' : 'Request Account')}
                </button>
            </form>

            <div className="w-full flex items-center justify-between mt-2 pt-6 border-t border-white/10">
                <button onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }} className="text-xs text-white/50 hover:text-white transition-colors">
                    {isLogin ? 'Create Account' : 'Back to Login'}
                </button>
                {isLogin && (
                    <button onClick={handleResetPassword} className="text-xs text-white/50 hover:text-white transition-colors">
                        Forgot Password?
                    </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
