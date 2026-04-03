import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from './store/useAuthStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { useUIStore } from './store/useUIStore';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { useSocket } from './hooks/useSocket';
import { useToast } from './features/notifications/ToastProvider';

// Layouts & Views
import { MainLayout } from './layouts/MainLayout';
import { LoginView } from './features/workspace/LoginView';
import { OnboardingView } from './features/workspace/OnboardingView';

// Dashboards
import { ChatDashboard } from './features/chat/ChatDashboard';
import { KanbanDashboard } from './features/kanban/KanbanDashboard';
import { DocumentsDashboard } from './features/documents/DocumentsDashboard';
import { AnalyticsDashboard } from './features/analytics/AnalyticsDashboard';
import { AIInsightsDashboard } from './features/ai-insights/AIInsightsDashboard';
import { WorkspaceDashboard } from './features/workspace/WorkspaceDashboard';
import { SettingsDashboard } from './features/workspace/SettingsDashboard';

// Modals
import { WorkspaceModals } from './features/workspace/WorkspaceModals';
import { TaskModal } from './features/kanban/TaskModal';

export default function App() {
  const { user, setUser, setLoading, loading } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { activeView } = useUIStore();
  const { showToast } = useToast();

  // Initialize Real-time Sync (Firestore)
  useRealtimeSync();

  // Initialize Socket.io for presence tracking
  useSocket();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        // Reset workspace state on logout to prevent leaking data to next user
        useWorkspaceStore.getState().reset();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen music-bg flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-music-red/20 border-t-music-red rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-music-red/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!activeWorkspace) {
    return <OnboardingView />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'chat': return <ChatDashboard />;
      case 'kanban': return <KanbanDashboard />;
      case 'documents': return <DocumentsDashboard />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'ai-insights': return <AIInsightsDashboard />;
      case 'workspace': return <WorkspaceDashboard />;
      case 'settings': return <SettingsDashboard />;
      default: return <ChatDashboard />;
    }
  };

  return (
    <MainLayout>
      {renderView()}
      
      {/* Global Modals */}
      <WorkspaceModals showToast={showToast} />
      <TaskModal showToast={showToast} />
    </MainLayout>
  );
}
