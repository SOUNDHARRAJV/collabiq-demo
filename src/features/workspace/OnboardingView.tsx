import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Sparkles, LogOut, MessageSquare, Layout, FileText, BarChart2, Shield, ArrowRight, Globe, Zap, Search } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { auth } from '../../firebase';
import { cn } from '../../lib/utils';

export function OnboardingView() {
  const { user } = useAuthStore();
  const { setModal } = useUIStore();

  const features = [
    { icon: MessageSquare, title: 'AI Discussions', desc: 'Real-time chat with automated task extraction.' },
    { icon: Layout, title: 'Kanban Board', desc: 'Visual project management with instant sync.' },
    { icon: FileText, title: 'Collaborative Docs', desc: 'Markdown-based real-time document editing.' },
    { icon: BarChart2, title: 'Live Analytics', desc: 'Data-driven insights and workload tracking.' },
  ];

  const handleLogout = () => auth.signOut();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 music-bg overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-music-red/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-music-purple/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full flex flex-col items-center gap-12 relative z-10"
      >
        {/* Logo & Welcome */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-music-red to-music-purple flex items-center justify-center shadow-2xl shadow-music-red/40 mx-auto mb-8"
          >
            <Sparkles className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight text-white">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-music-red to-music-purple">CollabIQ</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            The intelligent workspace where discussion becomes action. 
            Connect your team and let AI handle the project management.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <GlassCard 
            hover 
            onClick={() => setModal({ type: 'createWorkspace' })}
            className="p-8 flex flex-col gap-6 group border-white/5 hover:border-music-red/30"
          >
            <div className="w-14 h-14 rounded-2xl bg-music-red/20 flex items-center justify-center text-music-red group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">Create Workspace</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Start a new project and invite your team to collaborate in real-time.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center gap-2 text-music-red font-bold uppercase tracking-widest text-[10px]">
              <span>Get Started</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </GlassCard>

          <GlassCard 
            hover 
            onClick={() => setModal({ type: 'joinWorkspace' })}
            className="p-8 flex flex-col gap-6 group border-white/5 hover:border-music-purple/30"
          >
            <div className="w-14 h-14 rounded-2xl bg-music-purple/20 flex items-center justify-center text-music-purple group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">Join Workspace</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Enter a workspace ID to connect with your existing team.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center gap-2 text-music-purple font-bold uppercase tracking-widest text-[10px]">
              <span>Enter ID</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </GlassCard>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {features.map((f, idx) => (
            <GlassCard key={idx} variant="light" className="p-6 border-white/5">
              <f.icon className="w-6 h-6 text-white/30 mb-4" />
              <h4 className="text-sm font-bold tracking-tight mb-1">{f.title}</h4>
              <p className="text-[10px] text-white/30 leading-relaxed">{f.desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-6 pt-8 border-t border-white/5 w-full justify-center">
          <div className="flex items-center gap-3">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
              className="w-10 h-10 rounded-full border-2 border-white/10"
              alt="Profile"
            />
            <div>
              <p className="text-sm font-bold tracking-tight">{user?.displayName}</p>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">{user?.email}</p>
            </div>
          </div>
          <GlassButton variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
}
