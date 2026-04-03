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

    // Messages (ordered by timestamp, oldest first)
    const messagesPath = `workspaces/${activeWorkspace.id}/messages`;
    const qMessages = query(
      collection(db, messagesPath),
      orderBy('timestamp', 'asc')
    );
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (error) => {
      console.error('Failed to sync messages:', error);
      // Don't throw - gracefully degrade; Firestore listeners keep retrying
    });

    // Tasks (ordered by creation date, newest first)
    const tasksPath = `workspaces/${activeWorkspace.id}/tasks`;
    const qTasks = query(
      collection(db, tasksPath),
      orderBy('createdAt', 'desc')
    );
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      console.error('Failed to sync tasks:', error);
      // Don't throw - gracefully degrade
    });

    // Documents (ordered by update time, newest first)
    const docsPath = `workspaces/${activeWorkspace.id}/documents`;
    const qDocs = query(
      collection(db, docsPath),
      orderBy('updatedAt', 'desc')
    );
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document)));
    }, (error) => {
      console.error('Failed to sync documents:', error);
      // Don't throw - gracefully degrade
    });

    // Decisions (ordered by timestamp, newest first)
    const decisionsPath = `workspaces/${activeWorkspace.id}/decisions`;
    const qDecisions = query(
      collection(db, decisionsPath),
      orderBy('timestamp', 'desc')
    );
    const unsubDecisions = onSnapshot(qDecisions, (snapshot) => {
      setDecisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Decision)));
    }, (error) => {
      console.error('Failed to sync decisions:', error);
      // Don't throw - gracefully degrade
    });

    // Risks (ordered by timestamp, newest first)
    const risksPath = `workspaces/${activeWorkspace.id}/risks`;
    const qRisks = query(
      collection(db, risksPath),
      orderBy('timestamp', 'desc')
    );
    const unsubRisks = onSnapshot(qRisks, (snapshot) => {
      setRisks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Risk)));
    }, (error) => {
      console.error('Failed to sync risks:', error);
      // Don't throw - gracefully degrade
    });

    // Members (no specific order, all members in workspace)
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
    }, (error) => {
      console.error('Failed to sync members:', error);
      // Don't throw - gracefully degrade
    });

    // Workspace Metadata (for name and member updates)
    const workspacePath = `workspaces/${activeWorkspace.id}`;
    const unsubWorkspace = onSnapshot(doc(db, 'workspaces', activeWorkspace.id), (snapshot) => {
      if (snapshot.exists()) {
        setActiveWorkspace({ id: snapshot.id, ...snapshot.data() } as Workspace);
      }
    }, (error) => {
      console.error('Failed to sync workspace:', error);
      // Don't throw - gracefully degrade
    });

    return () => {
      // Safely unsubscribe from all listeners
      try { unsubMessages(); } catch (e) { console.debug('Error unsubbing messages:', e); }
      try { unsubTasks(); } catch (e) { console.debug('Error unsubbing tasks:', e); }
      try { unsubDocs(); } catch (e) { console.debug('Error unsubbing docs:', e); }
      try { unsubDecisions(); } catch (e) { console.debug('Error unsubbing decisions:', e); }
      try { unsubRisks(); } catch (e) { console.debug('Error unsubbing risks:', e); }
      try { unsubMembers(); } catch (e) { console.debug('Error unsubbing members:', e); }
      try { unsubWorkspace(); } catch (e) { console.debug('Error unsubbing workspace:', e); }
    };
  }, [activeWorkspace?.id, user?.uid, setMessages, setTasks, setDocuments, setDecisions, setRisks, setMembers, setUserRole, setActiveWorkspace]);
}
