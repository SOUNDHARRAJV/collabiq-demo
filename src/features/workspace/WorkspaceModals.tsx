import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Mail, Shield, Trash2, Save, LogOut, Layout, MessageSquare, FileText, Bell, Sparkles, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc, collection, addDoc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { cn, formatDate } from '../../lib/utils';
import { Modal } from '../../components/Modal';
import { InputModal } from '../../components/InputModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import ReactMarkdown from 'react-markdown';

export function WorkspaceModals({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const { user } = useAuthStore();
  const { activeWorkspace, setActiveWorkspace, userRole } = useWorkspaceStore();
  const { modal, closeModal } = useUIStore();

  const handleCreateWorkspace = async (name: string) => {
    if (!user || !name) return;
    const workspaceId = 'TCIQ' + Math.random().toString(36).substring(2, 5).toUpperCase();
    const path = `workspaces/${workspaceId}`;
    try {
      const workspaceData = {
        name,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, 'workspaces', workspaceId), workspaceData);
      
      // Add creator as admin member
      await setDoc(doc(db, `workspaces/${workspaceId}/members`, user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'admin',
        joinedAt: Date.now()
      });

      setActiveWorkspace({ id: workspaceId, ...workspaceData });
      showToast('Workspace created!');
      closeModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      showToast('Failed to create workspace', 'error');
    }
  };

  const handleJoinWorkspace = async (workspaceId: string) => {
    if (!user || !workspaceId) return;
    const path = `workspaces/${workspaceId}`;
    try {
      const wsDoc = await getDocFromServer(doc(db, 'workspaces', workspaceId));
      if (!wsDoc.exists()) {
        showToast('Workspace not found', 'error');
        return;
      }

      const wsData = wsDoc.data();
      if (wsData.members.includes(user.uid)) {
        setActiveWorkspace({ id: workspaceId, ...wsData } as any);
        showToast('Joined workspace!');
        closeModal();
        return;
      }

      // Add user to members array
      await updateDoc(doc(db, 'workspaces', workspaceId), {
        members: [...wsData.members, user.uid]
      });

      // Add user to members subcollection
      await setDoc(doc(db, `workspaces/${workspaceId}/members`, user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'member',
        joinedAt: Date.now()
      });

      setActiveWorkspace({ id: workspaceId, ...wsData } as any);
      showToast('Joined workspace!');
      closeModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      showToast('Failed to join workspace', 'error');
    }
  };

  const handleInviteMember = async (email: string) => {
    if (!activeWorkspace || !email) return;
    showToast(`Invitation sent to ${email}`);
    closeModal();
  };

  const handleCreateDocument = async (title: string) => {
    if (!activeWorkspace || !title || !user) return;
    const path = `workspaces/${activeWorkspace.id}/documents`;
    try {
      await addDoc(collection(db, path), {
        title,
        content: '# New Document\nStart writing...',
        lastEditedBy: user.uid,
        updatedAt: Date.now()
      });
      showToast('Document created');
      closeModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      showToast('Failed to create document', 'error');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace || userRole !== 'admin') return;
    const path = `workspaces/${activeWorkspace.id}`;
    try {
      await deleteDoc(doc(db, path));
      setActiveWorkspace(null);
      showToast('Workspace deleted');
      closeModal();
    } catch (error) {
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
            <GlassButton onClick={() => {
              navigator.clipboard.writeText(modal.data?.report);
              showToast('Report copied to clipboard');
            }}>Copy to Clipboard</GlassButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
