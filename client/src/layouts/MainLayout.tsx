import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { 
  MessageSquare, 
  Layout, 
  FileText, 
  BarChart2, 
  Settings, 
  Users, 
  LogOut, 
  Plus, 
  Search, 
  Bell, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { cn } from '../lib/utils';
import { auth } from '../firebase';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuthStore();
  const { activeWorkspace, members, decisions, risks, userRole } = useWorkspaceStore();
  const { activeView, setActiveView, setModal } = useUIStore();

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Discussion' },
    { id: 'board', icon: Layout, label: 'Kanban Board' },
    { id: 'docs', icon: FileText, label: 'Documents' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'insights', icon: Sparkles, label: 'AI Insights' },
    { id: 'workspace', icon: Users, label: 'Workspace' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => auth.signOut();

  return (
    <div className="flex h-screen w-screen overflow-hidden music-bg text-white font-sans">
      {/* Sidebar */}
      <aside className="w-72 h-full flex flex-col p-6 gap-8 z-20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-music-red to-music-purple flex items-center justify-center shadow-lg shadow-music-red/30">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CollabIQ</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group btn-press',
                activeView === item.id 
                  ? 'glass-ios bg-white/10 text-white shadow-lg' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 transition-colors',
                activeView === item.id ? 'text-music-red' : 'group-hover:text-white'
              )} />
              <span className="font-medium text-sm">{item.label}</span>
              {activeView === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-music-red shadow-[0_0_8px_rgba(255,45,85,0.8)]"
                />
              )}
            </button>
          ))}
        </nav>

        <GlassCard variant="dark" className="mt-auto flex items-center gap-3 p-3">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
            className="w-10 h-10 rounded-full border-2 border-white/10"
            alt="Profile"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.displayName}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{userRole}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-white/40 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </GlassCard>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full flex flex-col relative z-10 p-6 pl-0">
        <GlassCard className="flex-1 flex flex-col overflow-hidden border-white/5 shadow-2xl">
          {/* Header */}
          <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-white/2 backdrop-blur-md">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold tracking-tight">
                {navItems.find(i => i.id === activeView)?.label}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  {activeWorkspace?.name || 'No Workspace'} • {activeWorkspace?.id}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-music-red transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="glass-ios-light bg-white/5 border-white/5 rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-music-red/30 transition-all"
                />
              </div>
              <GlassButton variant="secondary" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-music-red rounded-full border-2 border-[#0B0B0F]" />
              </GlassButton>
              {userRole === 'admin' && (
                <GlassButton 
                  onClick={() => setModal({ type: 'inviteMember' })}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Invite</span>
                </GlassButton>
              )}
            </div>
          </header>

          {/* View Content */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </GlassCard>
      </main>

      {/* Right Sidebar (Context Panel) */}
      <aside className="w-80 h-full p-6 pl-0 flex flex-col gap-6 z-20">
        <GlassCard variant="dark" className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {/* AI Decisions */}
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">AI Decisions</h3>
            </div>
            <div className="space-y-3">
              {decisions.length > 0 ? decisions.map((d) => (
                <div key={d.id} className="glass-ios-light p-3 rounded-xl text-xs leading-relaxed border-l-2 border-emerald-400/50">
                  {d.text}
                </div>
              )) : (
                <p className="text-[10px] text-white/20 italic px-1">No decisions detected yet...</p>
              )}
            </div>
          </div>

          {/* Project Risks */}
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Project Risks</h3>
            </div>
            <div className="space-y-3">
              {risks.length > 0 ? risks.map((r) => (
                <div key={r.id} className="glass-ios-light p-3 rounded-xl text-xs leading-relaxed border-l-2 border-amber-400/50">
                  {r.text}
                </div>
              )) : (
                <p className="text-[10px] text-white/20 italic px-1">No risks identified...</p>
              )}
            </div>
          </div>

          {/* Active Members */}
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Users className="w-4 h-4 text-music-red" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Active Members</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <div key={m.uid} className="relative group">
                  <img 
                    src={m.photoURL || `https://ui-avatars.com/api/?name=${m.displayName}`} 
                    className={cn(
                      "w-8 h-8 rounded-full border border-white/10 transition-transform group-hover:scale-110",
                      m.isOnline ? "ring-2 ring-emerald-400/50" : "opacity-50 grayscale"
                    )}
                    title={m.displayName}
                    alt={m.displayName}
                  />
                  {m.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#12121A]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </aside>
    </div>
  );
}
