import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Sparkles, LogOut, MessageSquare, Layout, FileText, BarChart2, Shield, ArrowRight, Globe, Zap, Search, Clock, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { auth, db } from '../../firebase';
import { cn } from '../../lib/utils';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface UserWorkspace {
  id: string;
  name: string;
  members: string[];
  createdAt?: Timestamp;
}

interface ActivityItem {
  id: string;
  title: string;
  type: 'task' | 'document' | 'comment';
  workspaceId: string;
  timestamp: number;
  user: string;
}

export function OnboardingView() {
  const { user } = useAuthStore();
  const { setModal } = useUIStore();
  const { setWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();
  const [userWorkspaces, setUserWorkspaces] = useState<UserWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserWorkspaces = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('[Trace][UI][OnboardingView] fetching user workspaces');
        const q = query(
          collection(db, 'workspaces'),
          where('members', 'array-contains', user.uid)
        );
        const snapshot = await getDocs(q);
        const workspaces: UserWorkspace[] = [];
        snapshot.forEach(doc => {
          workspaces.push({
            id: doc.id,
            name: doc.data().name || 'Unnamed Workspace',
            members: doc.data().members || [],
            createdAt: doc.data().createdAt,
          });
        });
        setUserWorkspaces(workspaces);
        console.log('[Trace][UI][OnboardingView] user workspaces loaded', { count: workspaces.length });
      } catch (error) {
        console.error('[Trace][UI][OnboardingView] failed to load workspaces', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserWorkspaces();
  }, [user?.uid]);

  const features = [
    { icon: MessageSquare, title: 'AI Discussions', desc: 'Real-time chat with automated task extraction.' },
    { icon: Layout, title: 'Kanban Board', desc: 'Visual project management with instant sync.' },
    { icon: FileText, title: 'Collaborative Docs', desc: 'Markdown-based real-time document editing.' },
    { icon: BarChart2, title: 'Live Analytics', desc: 'Data-driven insights and workload tracking.' },
  ];

  const handleLogout = () => auth.signOut();

  const handleCreateWorkspaceClick = () => {
    console.log('[Trace][UI][OnboardingView] create workspace card click');
    setModal({ type: 'createWorkspace' });
  };

  const handleJoinWorkspaceClick = () => {
    console.log('[Trace][UI][OnboardingView] join workspace card click');
    setModal({ type: 'joinWorkspace' });
  };

  const handleOpenWorkspace = (workspace: UserWorkspace) => {
    console.log('[Trace][UI][OnboardingView] open workspace', { id: workspace.id });
    setWorkspace({ id: workspace.id, ...workspace } as any);
    navigate(`/workspace/${workspace.id}`, { replace: true });
  };

  const handleLogoutClick = async () => {
    console.log('[Trace][UI][OnboardingView] sign out click start');
    try {
      await handleLogout();
      console.log('[Trace][UI][OnboardingView] sign out click success');
    } catch (error) {
      console.error('[Trace][UI][OnboardingView] sign out click error', error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col p-6 music-bg overflow-auto relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-music-red/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-music-purple/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full mx-auto flex flex-col gap-16 relative z-10"
      >
        {/* Header with User Info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-music-red to-music-purple">{user?.displayName?.split(' ')[0] || 'there'}</span>
            </h1>
            <p className="text-white/50 mt-2">Let's get back to your teams and ongoing work</p>
          </div>
          <GlassButton variant="ghost" size="sm" onClick={handleLogoutClick} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </GlassButton>
        </div>

        {/* My Teams Section */}
        {!loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-music-red" />
                  My Teams
                </h2>
                <p className="text-sm text-white/40 mt-1">{userWorkspaces.length} active workspace{userWorkspaces.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            {userWorkspaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userWorkspaces.map((workspace, idx) => (
                  <motion.div
                    key={workspace.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleOpenWorkspace(workspace)}
                  >
                    <GlassCard 
                      hover 
                      className="p-6 flex flex-col gap-4 group cursor-pointer border-white/5 hover:border-music-red/30 h-full"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-music-red/20 to-music-purple/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Layout className="text-music-red w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded">
                          {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-music-red transition-colors">{workspace.name}</h3>
                        <p className="text-xs text-white/40 mt-1">Tap to open workspace</p>
                      </div>
                      <div className="flex items-center gap-2 text-music-red font-bold uppercase tracking-widest text-[10px] group-hover:translate-x-1 transition-transform">
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            ) : (
              <GlassCard variant="light" className="p-8 text-center border-white/5">
                <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No teams yet. Create or join a workspace to get started.</p>
              </GlassCard>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-music-purple" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <GlassCard 
              hover 
              onClick={handleCreateWorkspaceClick}
              className="p-8 flex flex-col gap-6 group border-white/5 hover:border-music-red/30 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-music-red/20 flex items-center justify-center text-music-red group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Create Workspace</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  Start a new project and invite your team.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-2 text-music-red font-bold uppercase tracking-widest text-[10px]">
                <span>Create New</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>

            <GlassCard 
              hover 
              onClick={handleJoinWorkspaceClick}
              className="p-8 flex flex-col gap-6 group border-white/5 hover:border-music-purple/30 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-music-purple/20 flex items-center justify-center text-music-purple group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Join Workspace</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  Enter an ID to connect with teammates.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-2 text-music-purple font-bold uppercase tracking-widest text-[10px]">
                <span>Enter ID</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-music-purple" />
            Platform Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, idx) => (
              <GlassCard key={idx} variant="light" className="p-6 border-white/5 hover:border-white/10 transition-colors">
                <f.icon className="w-6 h-6 text-music-red mb-3" />
                <h4 className="text-sm font-bold tracking-tight mb-2">{f.title}</h4>
                <p className="text-[12px] text-white/30 leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
