import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Shield, User, Mail, Clock, MoreVertical, Trash2, CheckCircle2, XCircle, Activity, Layout, MessageSquare, FileText } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cn, formatDate } from '../../lib/utils';
import { Member } from '../../types';

export function WorkspaceDashboard() {
  const { activeWorkspace, members, userRole, tasks, messages, documents } = useWorkspaceStore();
  const { setModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (userRole !== 'admin' || !activeWorkspace) return;
    try {
      await updateDoc(doc(db, `workspaces/${activeWorkspace.id}/members`, memberId), {
        role: newRole
      });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (userRole !== 'admin' || !activeWorkspace) return;
    try {
      await deleteDoc(doc(db, `workspaces/${activeWorkspace.id}/members`, memberId));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const filteredMembers = members.filter(m => 
    m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Members', value: members.length, icon: Users, color: 'text-white' },
    { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'done').length, icon: Layout, color: 'text-music-red' },
    { label: 'Total Messages', value: messages.length, icon: MessageSquare, color: 'text-music-purple' },
    { label: 'Documents', value: documents.length, icon: FileText, color: 'text-emerald-400' },
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
      {/* Workspace Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <GlassCard key={idx} variant="light" className="flex items-center gap-4 p-6">
            <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{stat.label}</p>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Members Section */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-music-red/20 flex items-center justify-center text-music-red">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Team Members</h3>
              <p className="text-xs text-white/30 font-medium">Manage roles and permissions for your team</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                type="text" 
                placeholder="Filter members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 glass-ios-light bg-white/5 border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-music-red/30 transition-all"
              />
            </div>
            {userRole === 'admin' && (
              <GlassButton 
                onClick={() => setModal({ type: 'inviteMember' })}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </GlassButton>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member) => (
              <motion.div
                key={member.uid}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <GlassCard className="p-6 group relative border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                      <img 
                        src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}`} 
                        className={cn(
                          "w-16 h-16 rounded-2xl border-2 border-white/10 transition-transform group-hover:scale-105",
                          !member.isOnline && "grayscale opacity-50"
                        )}
                        alt={member.displayName}
                      />
                      {member.isOnline && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-4 border-[#0B0B0F]" />
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1.5",
                        member.role === 'admin' ? "bg-music-red/20 text-music-red" : "bg-white/10 text-white/40"
                      )}>
                        <Shield className="w-3 h-3" />
                        {member.role}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg",
                        member.isOnline ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-white/20"
                      )}>
                        {member.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h4 className="text-base font-bold tracking-tight truncate">{member.displayName}</h4>
                    <p className="text-xs text-white/30 font-medium truncate">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                    {userRole === 'admin' && member.uid !== activeWorkspace?.ownerId && (
                      <>
                        <GlassButton 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 text-[10px] uppercase tracking-widest font-bold"
                          onClick={() => handleUpdateRole(member.uid, member.role === 'admin' ? 'member' : 'admin')}
                        >
                          Change Role
                        </GlassButton>
                        <GlassButton 
                          variant="ghost" 
                          size="sm" 
                          className="text-white/20 hover:text-red-400 p-2"
                          onClick={() => handleRemoveMember(member.uid)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </GlassButton>
                      </>
                    )}
                    {member.uid === activeWorkspace?.ownerId && (
                      <div className="flex-1 text-center py-2 text-[10px] uppercase tracking-widest font-bold text-white/20">
                        Workspace Owner
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Activity Logs (Bonus) */}
      <GlassCard variant="dark" className="p-8">
        <div className="flex items-center gap-2 mb-8">
          <Activity className="w-4 h-4 text-music-purple" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {[...messages, ...tasks].sort((a: any, b: any) => (b.timestamp || b.createdAt) - (a.timestamp || a.createdAt)).slice(0, 5).map((activity: any, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30">
                  {activity.text ? <MessageSquare className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {activity.userName || 'System'} {activity.text ? 'sent a message' : `created task: ${activity.title}`}
                  </p>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{formatDate(activity.timestamp || activity.createdAt)}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/10" />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
