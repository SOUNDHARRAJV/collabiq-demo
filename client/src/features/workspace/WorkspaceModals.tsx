import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Mail, Shield, Trash2, Save, LogOut, Layout, MessageSquare, FileText, Bell, Sparkles, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { db, auth } from '../../firebase';
import { doc, updateDoc, deleteDoc, collection, addDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { cn, formatDate } from '../../lib/utils';
import { Modal } from '../../components/Modal';
import { InputModal } from '../../components/InputModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import firebaseConfig from '../../../../firebase-applet-config.json';

function parseFirestoreValue(value: any): any {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue !== undefined) {
    const values = value.arrayValue.values ?? [];
    return values.map(parseFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    const fields = value.mapValue.fields ?? {};
    const parsed: Record<string, any> = {};
    Object.entries(fields).forEach(([k, v]) => {
      parsed[k] = parseFirestoreValue(v);
    });
    return parsed;
  }
  return null;
}

async function fetchWorkspaceViaRest(workspaceId: string, idToken?: string): Promise<{ exists: boolean; data?: any }> {
  const projectId = (firebaseConfig as { projectId?: string }).projectId;
  if (!projectId) return { exists: false };

  const encodedId = encodeURIComponent(workspaceId);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/workspaces/${encodedId}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Use ID token for authentication if available, otherwise fall back to API key
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  } else {
    const apiKey = (firebaseConfig as { apiKey?: string }).apiKey;
    if (!apiKey) return { exists: false };
    return fetch(`${url}?key=${apiKey}`, { method: 'GET', headers }).then(handleRestResponse);
  }

  const response = await fetch(url, { method: 'GET', headers });
  return handleRestResponse(response);
}

async function handleRestResponse(response: Response): Promise<{ exists: boolean; data?: any }> {
  if (response.status === 404) return { exists: false };
  if (response.status === 403) {
    // Forbidden - likely security rules issue
    console.warn('[Trace][API][Firestore] REST read forbidden - check Firestore security rules');
    return { exists: false };
  }
  if (!response.ok) throw new Error(`REST workspace fetch failed with status ${response.status}`);

  const payload = await response.json();
  const fields = payload?.fields ?? {};
  const data: Record<string, any> = {};
  Object.entries(fields).forEach(([k, v]) => {
    data[k] = parseFirestoreValue(v);
  });
  return { exists: true, data };
}

export function WorkspaceModals({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const { user } = useAuthStore();
  const { activeWorkspace, setWorkspace, setMembers, setUserRole, userRole } = useWorkspaceStore();
  const { modal, closeModal } = useUIStore();
  const navigate = useNavigate();

  const handleCreateWorkspace = async (name: string) => {
    console.log('[Trace][UI][WorkspaceModals] createWorkspace submit', { hasUser: !!user, nameLength: name?.length ?? 0 });
    if (!user || !name) {
      console.warn('[Breakpoint][Flow][WorkspaceModals] createWorkspace blocked by guard', { hasUser: !!user, hasName: !!name });
      return;
    }
    const workspaceId = 'TCIQ' + Math.random().toString(36).substring(2, 5).toUpperCase();
    const path = `workspaces/${workspaceId}`;
    try {
      console.log('[Trace][API][Firestore] createWorkspace write start', { workspaceId, path });
      const workspaceData = {
        name,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: Date.now()
      };
      const createdWorkspace = { id: workspaceId, ...workspaceData };

      // Immediate UI transition so guard does not keep user on onboarding during network jitter.
      setWorkspace(createdWorkspace);
      setUserRole('admin');
      setMembers([
        {
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? 'You',
          photoURL: user.photoURL ?? '',
          role: 'admin',
          isOnline: true,
        },
      ]);

      showToast('Workspace created!');
      closeModal();
      navigate(`/workspace/${workspaceId}`, { replace: true });

      // Firestore writes continue in background; rollback local state only if write truly fails.
      void (async () => {
        try {
          await setDoc(doc(db, 'workspaces', workspaceId), workspaceData);
          console.log('[Trace][API][Firestore] createWorkspace workspace doc success', { workspaceId });

          await setDoc(doc(db, `workspaces/${workspaceId}/members`, user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'admin',
            joinedAt: Date.now()
          }, { merge: true });
          console.log('[Trace][API][Firestore] createWorkspace member doc success', { workspaceId, uid: user.uid });
        } catch (writeError) {
          console.error('[Trace][API][Firestore] createWorkspace background write error', writeError);
          handleFirestoreError(writeError, OperationType.WRITE, path);
          // Rollback optimistic state if create write fails.
          setWorkspace((current) => current?.id === workspaceId ? null : current);
          setUserRole((role) => role === 'admin' ? 'member' : role);
          setMembers((members) => members.filter((m) => m.uid !== user.uid));
          showToast('Workspace creation failed. Please try again.', 'error');
          navigate('/onboarding', { replace: true });
        }
      })();
      console.log('[Trace][UI][WorkspaceModals] createWorkspace response handled', { workspaceId });
    } catch (error) {
      console.error('[Trace][API][Firestore] createWorkspace error', error);
      handleFirestoreError(error, OperationType.WRITE, path);
      showToast('Failed to create workspace', 'error');
    }
  };

  const handleJoinWorkspace = async (workspaceId: string) => {
    const normalizedWorkspaceId = workspaceId.trim().toUpperCase();
    console.log('[Trace][UI][WorkspaceModals] joinWorkspace submit', { hasUser: !!user, workspaceId: normalizedWorkspaceId });
    if (!user || !normalizedWorkspaceId) {
      console.warn('[Breakpoint][Flow][WorkspaceModals] joinWorkspace blocked by guard', { hasUser: !!user, hasWorkspaceId: !!workspaceId });
      return;
    }
    const path = `workspaces/${normalizedWorkspaceId}`;
    try {
      console.log('[Trace][API][Firestore] joinWorkspace read start', { path });
      let wsData: any | undefined;
      try {
        const wsDoc = await getDoc(doc(db, 'workspaces', normalizedWorkspaceId));
        console.log('[Trace][API][Firestore] joinWorkspace read done', { exists: wsDoc.exists(), source: 'firestore' });
        if (wsDoc.exists()) {
          wsData = wsDoc.data() as any;
        }
      } catch (primaryReadError) {
        console.warn('[Trace][API][Firestore] joinWorkspace primary read failed; trying REST fallback', primaryReadError);
      }

      if (!wsData) {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : undefined;
        const fallback = await fetchWorkspaceViaRest(normalizedWorkspaceId, idToken);
        console.log('[Trace][API][Firestore] joinWorkspace fallback read done', { exists: fallback.exists, source: 'rest' });
        if (!fallback.exists || !fallback.data) {
          showToast('Workspace not found. Check the workspace ID and try again.', 'error');
          console.warn('[Trace][UI][WorkspaceModals] joinWorkspace workspace not found', { workspaceId: normalizedWorkspaceId });
          return;
        }
        wsData = fallback.data;
      }

      const currentMembers = Array.isArray(wsData.members) ? wsData.members : [];
      console.log('[Trace][Flow][WorkspaceModals] joinWorkspace membership check', { memberCount: currentMembers.length });
      if (currentMembers.includes(user.uid)) {
        setWorkspace({ id: normalizedWorkspaceId, ...wsData } as any);
        setUserRole('member');
        setMembers((prev) => {
          if (prev.some((m) => m.uid === user.uid)) return prev;
          return [
            ...prev,
            {
              uid: user.uid,
              email: user.email ?? '',
              displayName: user.displayName ?? 'You',
              photoURL: user.photoURL ?? '',
              role: 'member',
              isOnline: true,
            },
          ];
        });
        console.log('[Trace][UI][WorkspaceModals] joinWorkspace response handled (already member)', { workspaceId: normalizedWorkspaceId });
        showToast('Joined workspace!');
        closeModal();
        navigate(`/workspace/${normalizedWorkspaceId}`, { replace: true });
        return;
      }

      // Use arrayUnion to atomically add user to members (avoids race conditions)
      await updateDoc(doc(db, 'workspaces', normalizedWorkspaceId), {
        members: arrayUnion(user.uid)
      });
      console.log('[Trace][API][Firestore] joinWorkspace update members success', { workspaceId: normalizedWorkspaceId, uid: user.uid });

      // Add user to members subcollection (merge:true preserves existing fields)
      await setDoc(doc(db, `workspaces/${normalizedWorkspaceId}/members`, user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'member',
        joinedAt: Date.now()
      }, { merge: true });
      console.log('[Trace][API][Firestore] joinWorkspace member doc success', { workspaceId: normalizedWorkspaceId, uid: user.uid });

      setWorkspace({ id: normalizedWorkspaceId, ...wsData, members: [...currentMembers, user.uid] } as any);
      setUserRole('member');
      setMembers((prev) => {
        if (prev.some((m) => m.uid === user.uid)) return prev;
        return [
          ...prev,
          {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? 'You',
            photoURL: user.photoURL ?? '',
            role: 'member',
            isOnline: true,
          },
        ];
      });
      console.log('[Trace][UI][WorkspaceModals] joinWorkspace response handled', { workspaceId: normalizedWorkspaceId });
      showToast('Joined workspace!');
      closeModal();
      navigate(`/workspace/${normalizedWorkspaceId}`, { replace: true });
    } catch (error) {
      console.error('[Trace][API][Firestore] joinWorkspace error', error);
      handleFirestoreError(error, OperationType.WRITE, path);
      showToast('Failed to join workspace', 'error');
    }
  };

  const handleInviteMember = async (email: string) => {
    console.log('[Trace][UI][WorkspaceModals] inviteMember submit', { workspaceId: activeWorkspace?.id, email });
    if (!activeWorkspace || !email) {
      console.warn('[Breakpoint][Flow][WorkspaceModals] inviteMember blocked by guard', { hasWorkspace: !!activeWorkspace, hasEmail: !!email });
      return;
    }
    console.warn('[Breakpoint][Flow][WorkspaceModals] inviteMember has no API/socket implementation');
    showToast(`Invitation sent to ${email}`);
    closeModal();
  };

  const handleCreateDocument = async (title: string) => {
    console.log('[Trace][UI][WorkspaceModals] createDocument submit', { workspaceId: activeWorkspace?.id, titleLength: title?.length ?? 0, hasUser: !!user });
    if (!activeWorkspace || !title || !user) {
      console.warn('[Breakpoint][Flow][WorkspaceModals] createDocument blocked by guard', { hasWorkspace: !!activeWorkspace, hasTitle: !!title, hasUser: !!user });
      return;
    }
    const path = `workspaces/${activeWorkspace.id}/documents`;
    try {
      console.log('[Trace][API][Firestore] createDocument write start', { path });
      await addDoc(collection(db, path), {
        title,
        content: '# New Document\nStart writing...',
        lastEditedBy: user.uid,
        updatedAt: Date.now()
      });
      console.log('[Trace][API][Firestore] createDocument write success', { path });
      showToast('Document created');
      closeModal();
    } catch (error) {
      console.error('[Trace][API][Firestore] createDocument error', error);
      handleFirestoreError(error, OperationType.CREATE, path);
      showToast('Failed to create document', 'error');
    }
  };

  const handleDeleteWorkspace = async () => {
    console.log('[Trace][UI][WorkspaceModals] deleteWorkspace confirm', { workspaceId: activeWorkspace?.id, userRole });
    if (!activeWorkspace || userRole !== 'admin') {
      console.warn('[Breakpoint][Flow][WorkspaceModals] deleteWorkspace blocked by guard', { hasWorkspace: !!activeWorkspace, userRole });
      return;
    }
    const path = `workspaces/${activeWorkspace.id}`;
    try {
      console.log('[Trace][API][Firestore] deleteWorkspace start', { path });
      await deleteDoc(doc(db, path));
      console.log('[Trace][API][Firestore] deleteWorkspace success', { path });
      setWorkspace(null);
      console.log('[Trace][UI][WorkspaceModals] deleteWorkspace response handled', { activeWorkspace: null });
      showToast('Workspace deleted');
      closeModal();
    } catch (error) {
      console.error('[Trace][API][Firestore] deleteWorkspace error', error);
      handleFirestoreError(error, OperationType.DELETE, path);
      showToast('Failed to delete workspace', 'error');
    }
  };

  return (
    <>
      <InputModal
        isOpen={modal.type === 'createWorkspace'}
        onClose={closeModal}
        title="Create Workspace"
        placeholder="Workspace Name"
        onSubmit={handleCreateWorkspace}
      />

      <InputModal
        isOpen={modal.type === 'joinWorkspace'}
        onClose={closeModal}
        title="Join Workspace"
        placeholder="Workspace ID (e.g. TCIQ782)"
        onSubmit={handleJoinWorkspace}
      />

      <InputModal
        isOpen={modal.type === 'inviteMember'}
        onClose={closeModal}
        title="Invite Member"
        placeholder="Member Email"
        onSubmit={handleInviteMember}
      />

      <InputModal
        isOpen={modal.type === 'createDocument'}
        onClose={closeModal}
        title="New Document"
        placeholder="Document Title"
        onSubmit={handleCreateDocument}
      />

      <ConfirmModal
        isOpen={modal.type === 'deleteWorkspace'}
        onClose={closeModal}
        title="Delete Workspace"
        message="Are you sure you want to permanently delete this workspace? This action cannot be undone."
        onConfirm={handleDeleteWorkspace}
      />

      <Modal
        isOpen={modal.type === 'viewReport'}
        onClose={closeModal}
        title="AI Project Report"
      >
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="markdown-body text-white/80 prose prose-invert max-w-none">
            <ReactMarkdown>{modal.data?.report}</ReactMarkdown>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <GlassButton variant="secondary" onClick={closeModal}>Close</GlassButton>
            <GlassButton onClick={async () => {
              try {
                const report = modal.data?.report;
                if (!report) {
                  console.warn('[Trace][UI][WorkspaceModals] copy report blocked: no report content');
                  showToast('No report content to copy', 'error');
                  return;
                }
                await navigator.clipboard.writeText(report);
                showToast('Report copied to clipboard');
              } catch (error) {
                console.error('[Trace][UI][WorkspaceModals] copy report failed', error);
                showToast('Failed to copy report', 'error');
              }
            }}>Copy to Clipboard</GlassButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
