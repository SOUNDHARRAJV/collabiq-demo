import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogIn, Globe, Zap, Shield, ArrowRight, CheckCircle2, MessageSquare, Layout, FileText, BarChart2 } from 'lucide-react';
import { auth } from '../../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { useToast } from '../notifications/ToastProvider';
import { cn } from '../../lib/utils';

export function LoginView() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async () => {
    console.log('handleLogin triggered');
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      console.log('Starting signInWithPopup...');
      const result = await signInWithPopup(auth, provider);
      console.log('Login successful:', result.user.email);
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by your browser. Please allow popups for this site.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Login was cancelled.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login window was closed before completion.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#0B0B0F] relative overflow-hidden">
      {/* Simple Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-music-red/5 via-transparent to-music-purple/5 pointer-events-none" />

      <div className="max-w-md w-full relative z-[9999]">
        <GlassCard className="p-10 flex flex-col items-center gap-8 border-white/10 shadow-2xl bg-white/[0.03] backdrop-blur-xl">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-music-red to-music-purple flex items-center justify-center shadow-2xl shadow-music-red/40 mx-auto mb-6">
              <Sparkles className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Collab<span className="text-music-red">IQ</span>
            </h1>
            <p className="text-sm text-white/40 font-medium uppercase tracking-widest">Sign in to your workspace</p>
          </div>

          <button 
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-14 flex items-center justify-center gap-4 text-lg font-bold bg-white text-black hover:bg-white/90 shadow-2xl rounded-xl transition-all duration-200 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-[10000] pointer-events-auto"
            style={{ pointerEvents: 'auto' }}
          >
            {isLoggingIn ? (
              <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-4 w-full opacity-20">
            <div className="flex-1 h-px bg-white" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Login</span>
            <div className="flex-1 h-px bg-white" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
