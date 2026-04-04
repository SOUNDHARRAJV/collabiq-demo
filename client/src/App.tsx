import { ReactElement, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from './store/useAuthStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
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

function RouteMountLogger({ name, children }: { name: string; children: ReactElement }) {
  useEffect(() => {
    console.log('[Trace][Router] mount', { routeComponent: name });
    return () => {
      console.log('[Trace][Router] unmount', { routeComponent: name });
    };
  }, [name]);

  console.log('[Trace][Router] render', { routeComponent: name });
  return children;
}

export default function App() {
  const { user, setUser, setLoading, loading } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { showToast } = useToast();
  const location = useLocation();
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize Real-time Sync (Firestore)
  useRealtimeSync();

  // Initialize Socket.io for presence tracking
  useSocket();

  useEffect(() => {
    // Ensure route guards do not run before the first auth snapshot arrives.
    setLoading(true);
    setAuthInitialized(false);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[Trace][Auth] onAuthStateChanged', { hasUser: !!user, path: window.location.pathname });
      setUser(user);
      setAuthInitialized(true);
      if (!user) {
        // Reset workspace state on logout to prevent leaking data to next user
        useWorkspaceStore.getState().reset();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  useEffect(() => {
    console.log('[Trace][Router] location change', {
      path: location.pathname,
      hasUser: !!user,
      hasWorkspace: !!activeWorkspace,
      loading,
      authInitialized,
    });
  }, [location.pathname, user, activeWorkspace, loading, authInitialized]);

  if (loading || !authInitialized) {
    console.warn('[Trace][Router] blocked by guard', {
      guard: !authInitialized ? 'auth-init' : 'loading',
      path: location.pathname,
    });
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
    console.warn('[Trace][Router] blocked by guard', { guard: 'user', path: location.pathname, fallback: 'LoginView' });
    return <LoginView />;
  }

  const dashboardPaths = new Set([
    '/chat',
    '/kanban',
    '/documents',
    '/analytics',
    '/ai-insights',
    '/workspace',
    '/settings',
  ]);

  if (!activeWorkspace) {
    if (dashboardPaths.has(location.pathname)) {
      console.warn('[Trace][Router] blocked by guard', {
        guard: 'workspace',
        path: location.pathname,
        fallback: 'OnboardingView',
      });
    }

    return (
      <>
        <OnboardingView />
        <WorkspaceModals showToast={showToast} />
      </>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<RouteMountLogger name="ChatDashboard"><ChatDashboard /></RouteMountLogger>} />
        <Route path="/kanban" element={<RouteMountLogger name="KanbanDashboard"><KanbanDashboard /></RouteMountLogger>} />
        <Route path="/documents" element={<RouteMountLogger name="DocumentsDashboard"><DocumentsDashboard /></RouteMountLogger>} />
        <Route path="/analytics" element={<RouteMountLogger name="AnalyticsDashboard"><AnalyticsDashboard /></RouteMountLogger>} />
        <Route path="/ai-insights" element={<RouteMountLogger name="AIInsightsDashboard"><AIInsightsDashboard /></RouteMountLogger>} />
        <Route path="/workspace" element={<RouteMountLogger name="WorkspaceDashboard"><WorkspaceDashboard /></RouteMountLogger>} />
        <Route path="/workspace/:workspaceId" element={<RouteMountLogger name="WorkspaceDashboard"><WorkspaceDashboard /></RouteMountLogger>} />
        <Route path="/settings" element={<RouteMountLogger name="SettingsDashboard"><SettingsDashboard /></RouteMountLogger>} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
      
      {/* Global Modals */}
      <WorkspaceModals showToast={showToast} />
      <TaskModal showToast={showToast} />
    </MainLayout>
  );
}
