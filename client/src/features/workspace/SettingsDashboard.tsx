import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Trash2, Save, LogOut, Mail, Camera, Layout, MessageSquare, FileText, Bell, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { db, auth } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cn, formatDate } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

export function SettingsDashboard() {
  const { user } = useAuthStore();
  const { activeWorkspace, userRole } = useWorkspaceStore();
  const { setModal } = useUIStore();
  const [profileName, setProfileName] = useState(user?.displayName || '');
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Trace][UI][SettingsDashboard] update profile submit', { hasUser: !!user, profileNameLength: profileName.length });
    if (!user || !profileName) {
      console.warn('[Breakpoint][Flow][SettingsDashboard] update profile blocked by guard', { hasUser: !!user, hasProfileName: !!profileName });
      return;
    }
    setIsSaving(true);
    const path = `users/${user.uid}`;
    try {
      console.log('[Trace][API][Firestore] update profile start', { path });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profileName
      });
      console.log('[Trace][API][Firestore] update profile success', { path });
      setIsSaving(false);
    } catch (error) {
      console.error('[Trace][API][Firestore] update profile error', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      setIsSaving(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Trace][UI][SettingsDashboard] update workspace submit', {
      workspaceId: activeWorkspace?.id,
      workspaceNameLength: workspaceName.length,
      userRole,
    });
    if (!activeWorkspace || !workspaceName || userRole !== 'admin') {
      console.warn('[Breakpoint][Flow][SettingsDashboard] update workspace blocked by guard', {
        hasWorkspace: !!activeWorkspace,
        hasWorkspaceName: !!workspaceName,
        userRole,
      });
      return;
    }
    setIsSaving(true);
    const path = `workspaces/${activeWorkspace.id}`;
    try {
      console.log('[Trace][API][Firestore] update workspace start', { path });
      await updateDoc(doc(db, 'workspaces', activeWorkspace.id), {
        name: workspaceName
      });
      console.log('[Trace][API][Firestore] update workspace success', { path });
      setIsSaving(false);
    } catch (error) {
      console.error('[Trace][API][Firestore] update workspace error', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      setIsSaving(false);
    }
  };

  const handleLogout = () => auth.signOut();

  const handleCameraClick = () => {
    console.warn('[Breakpoint][UI][SettingsDashboard] camera button clicked but upload handler is not implemented');
  };

  const handleLogoutClick = async () => {
    console.log('[Trace][UI][SettingsDashboard] logout click start');
    try {
      await handleLogout();
      console.log('[Trace][UI][SettingsDashboard] logout click success');
    } catch (error) {
      console.error('[Trace][UI][SettingsDashboard] logout click error', error);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <GlassCard className="p-8 flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-music-purple/20 flex items-center justify-center text-music-purple">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Profile Settings</h3>
              <p className="text-xs text-white/30 font-medium">Manage your personal information</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
                  className="w-20 h-20 rounded-3xl border-2 border-white/10 group-hover:scale-105 transition-transform"
                  alt="Profile"
                />
                <button type="button" onClick={handleCameraClick} className="absolute bottom-0 right-0 w-8 h-8 rounded-xl bg-music-red flex items-center justify-center shadow-lg shadow-music-red/30 hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold tracking-tight">{user?.displayName}</p>
                <p className="text-xs text-white/30 font-medium">{user?.email}</p>
              </div>
            </div>

            <GlassInput 
              label="Display Name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your name"
            />

            <GlassButton 
              type="submit" 
              disabled={isSaving || profileName === user?.displayName}
              className="w-full"
            >
              Update Profile
            </GlassButton>
          </form>
        </GlassCard>

        {/* Workspace Settings */}
        <GlassCard className="p-8 flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-music-red/20 flex items-center justify-center text-music-red">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Workspace Settings</h3>
              <p className="text-xs text-white/30 font-medium">Manage workspace configuration</p>
            </div>
          </div>

          <form onSubmit={handleUpdateWorkspace} className="space-y-6">
            <GlassInput 
              label="Workspace Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              disabled={userRole !== 'admin'}
            />

            <div className="space-y-2">
              <p className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Workspace ID</p>
              <div className="glass-ios-light bg-white/5 border-white/5 rounded-xl px-4 py-2.5 text-sm text-white/50 font-mono">
                {activeWorkspace?.id}
              </div>
            </div>

            <GlassButton 
              type="submit" 
              disabled={isSaving || workspaceName === activeWorkspace?.name || userRole !== 'admin'}
              className="w-full"
            >
              Update Workspace
            </GlassButton>
          </form>
        </GlassCard>
      </div>

      {/* Danger Zone */}
      <GlassCard variant="dark" className="p-8 border-red-500/20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-red-400">Danger Zone</h3>
            <p className="text-xs text-white/30 font-medium">Irreversible actions for your workspace</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-ios-light p-6 rounded-2xl border border-red-500/10 flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-bold tracking-tight">Delete Workspace</h4>
              <p className="text-xs text-white/30 mt-1">Permanently delete this workspace and all its data.</p>
            </div>
            <GlassButton 
              variant="danger" 
              size="sm" 
              className="mt-auto"
              disabled={userRole !== 'admin'}
              onClick={() => setModal({ type: 'deleteWorkspace' })}
            >
              Delete Workspace
            </GlassButton>
          </div>

          <div className="glass-ios-light p-6 rounded-2xl border-white/5 flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-bold tracking-tight">Logout Session</h4>
              <p className="text-xs text-white/30 mt-1">Sign out of your current account on this device.</p>
            </div>
            <GlassButton 
              variant="secondary" 
              size="sm" 
              className="mt-auto"
              onClick={handleLogoutClick}
            >
              Sign Out
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
