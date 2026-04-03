import { useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAuthStore } from '../store/useAuthStore';
import { Message, Task, Document, Decision, Risk, Member, Workspace } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

export function useRealtimeSync() {
  const { user } = useAuthStore();
  const { 
    activeWorkspace, 
    setMessages, 
    setTasks, 
    setDocuments, 
    setDecisions, 
    setRisks, 
    setMembers,
    setUserRole,
    setActiveWorkspace
  } = useWorkspaceStore();

  // Sync Workspace Data
  useEffect(() => {
    if (!activeWorkspace?.id) return;

    // Messages
    const messagesPath = `workspaces/${activeWorkspace.id}/messages`;
    const qMessages = query(
      collection(db, messagesPath),
      orderBy('timestamp', 'asc')
    );
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (error) => handleFirestoreError(error, OperationType.GET, messagesPath));

    // Tasks
    const tasksPath = `workspaces/${activeWorkspace.id}/tasks`;
    const qTasks = query(
      collection(db, tasksPath),
      orderBy('createdAt', 'desc')
    );
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => handleFirestoreError(error, OperationType.GET, tasksPath));

    // Documents
    const docsPath = `workspaces/${activeWorkspace.id}/documents`;
    const qDocs = query(
      collection(db, docsPath),
      orderBy('updatedAt', 'desc')
    );
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document)));
    }, (error) => handleFirestoreError(error, OperationType.GET, docsPath));

    // Decisions
    const decisionsPath = `workspaces/${activeWorkspace.id}/decisions`;
    const qDecisions = query(
      collection(db, decisionsPath),
      orderBy('timestamp', 'desc')
    );
    const unsubDecisions = onSnapshot(qDecisions, (snapshot) => {
      setDecisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Decision)));
    }, (error) => handleFirestoreError(error, OperationType.GET, decisionsPath));

    // Risks
    const risksPath = `workspaces/${activeWorkspace.id}/risks`;
    const qRisks = query(
      collection(db, risksPath),
      orderBy('timestamp', 'desc')
    );
    const unsubRisks = onSnapshot(qRisks, (snapshot) => {
      setRisks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Risk)));
    }, (error) => handleFirestoreError(error, OperationType.GET, risksPath));

    // Members
    const membersPath = `workspaces/${activeWorkspace.id}/members`;
    const qMembers = query(collection(db, membersPath));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Member));
      setMembers(membersList);
      
      // Update current user role
      const currentUserMember = membersList.find(m => m.uid === user?.uid);
      if (currentUserMember) {
        setUserRole(currentUserMember.role);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, membersPath));

    // Workspace Metadata (for name updates)
    const workspacePath = `workspaces/${activeWorkspace.id}`;
    const unsubWorkspace = onSnapshot(doc(db, 'workspaces', activeWorkspace.id), (snapshot) => {
      if (snapshot.exists()) {
        setActiveWorkspace({ id: snapshot.id, ...snapshot.data() } as Workspace);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, workspacePath));

    return () => {
      unsubMessages();
      unsubTasks();
      unsubDocs();
      unsubDecisions();
      unsubRisks();
      unsubMembers();
      unsubWorkspace();
    };
  }, [activeWorkspace?.id, user?.uid]);
}
