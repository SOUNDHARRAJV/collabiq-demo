import { useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAuthStore } from '../store/useAuthStore';
import { Message, Task, Document, Decision, Risk, Member, Workspace } from '../types';

const toNumber = (value: unknown, fallback = Date.now()) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

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
    setWorkspace
  } = useWorkspaceStore();

  // Sync Workspace Data
  useEffect(() => {
    if (!activeWorkspace?.id) {
      console.log('[Trace][Realtime] skip sync: no active workspace');
      return;
    }

    console.log('[Trace][Realtime] subscribe start', { workspaceId: activeWorkspace.id, userId: user?.uid });

    // Messages (ordered by timestamp, oldest first)
    const messagesPath = `workspaces/${activeWorkspace.id}/messages`;
    const qMessages = query(
      collection(db, messagesPath),
      orderBy('timestamp', 'asc')
    );
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      console.log('[Trace][Realtime] messages snapshot', { count: snapshot.docs.length });
      const normalized = snapshot.docs.map((docItem) => {
        const raw = docItem.data() as Partial<Message>;
        return {
          id: docItem.id,
          text: raw.text ?? '',
          userId: raw.userId ?? '',
          userName: raw.userName ?? 'Unknown',
          userPhoto: raw.userPhoto ?? '',
          timestamp: toNumber(raw.timestamp, 0),
        } as Message;
      });
      setMessages(normalized);
    }, (error) => {
      console.error('[Trace][Realtime] messages listener error', error);
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
      console.log('[Trace][Realtime] tasks snapshot', { count: snapshot.docs.length });
      const normalized = snapshot.docs.map((docItem) => {
        const raw = docItem.data() as Partial<Task>;
        return {
          id: docItem.id,
          title: raw.title ?? '',
          description: raw.description ?? '',
          status: (raw.status as Task['status']) ?? 'backlog',
          priority: (raw.priority as Task['priority']) ?? 'medium',
          assigneeId: raw.assigneeId || '',
          dueDate: raw.dueDate || '',
          createdAt: toNumber(raw.createdAt, Date.now()),
        } as Task;
      });
      setTasks(normalized);
    }, (error) => {
      console.error('[Trace][Realtime] tasks listener error', error);
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
      console.log('[Trace][Realtime] documents snapshot', { count: snapshot.docs.length });
      const normalized = snapshot.docs.map((docItem) => {
        const raw = docItem.data() as Partial<Document>;
        return {
          id: docItem.id,
          title: raw.title ?? '',
          content: raw.content ?? '',
          lastEditedBy: raw.lastEditedBy ?? '',
          updatedAt: toNumber(raw.updatedAt, Date.now()),
        } as Document;
      });
      setDocuments(normalized);
    }, (error) => {
      console.error('[Trace][Realtime] documents listener error', error);
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
      console.log('[Trace][Realtime] decisions snapshot', { count: snapshot.docs.length });
      const normalized = snapshot.docs.map((docItem) => {
        const raw = docItem.data() as Partial<Decision>;
        return {
          id: docItem.id,
          text: raw.text ?? '',
          timestamp: toNumber(raw.timestamp, Date.now()),
        } as Decision;
      });
      setDecisions(normalized);
    }, (error) => {
      console.error('[Trace][Realtime] decisions listener error', error);
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
      console.log('[Trace][Realtime] risks snapshot', { count: snapshot.docs.length });
      const normalized = snapshot.docs.map((docItem) => {
        const raw = docItem.data() as Partial<Risk>;
        return {
          id: docItem.id,
          text: raw.text ?? '',
          timestamp: toNumber(raw.timestamp, Date.now()),
        } as Risk;
      });
      setRisks(normalized);
    }, (error) => {
      console.error('[Trace][Realtime] risks listener error', error);
      console.error('Failed to sync risks:', error);
      // Don't throw - gracefully degrade
    });

    // Members (no specific order, all members in workspace)
    const membersPath = `workspaces/${activeWorkspace.id}/members`;
    const qMembers = query(collection(db, membersPath));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      const membersList = snapshot.docs.map((docItem) => {
        const raw = docItem.data() as Partial<Member>;
        return {
          uid: docItem.id,
          email: raw.email ?? '',
          displayName: raw.displayName ?? 'Unknown Member',
          photoURL: raw.photoURL ?? '',
          role: raw.role === 'admin' ? 'admin' : 'member',
          isOnline: !!raw.isOnline,
        } as Member;
      });
      console.log('[Trace][Realtime] members snapshot', { count: membersList.length });
      setMembers(membersList);
      
      // Update current user role
      const currentUserMember = membersList.find(m => m.uid === user?.uid);
      if (currentUserMember) {
        console.log('[Trace][Realtime] current user role resolved', { uid: user?.uid, role: currentUserMember.role });
        setUserRole(currentUserMember.role);
      } else {
        // Prevent stale role state when membership doc is missing or still propagating
        console.warn('[Trace][Realtime] current user role missing in members snapshot; defaulting to member', {
          uid: user?.uid,
          workspaceId: activeWorkspace.id,
        });
        setUserRole('member');
      }
    }, (error) => {
      console.error('[Trace][Realtime] members listener error', error);
      console.error('Failed to sync members:', error);
      // Don't throw - gracefully degrade
    });

    // Workspace Metadata (for name and member updates)
    const unsubWorkspace = onSnapshot(doc(db, 'workspaces', activeWorkspace.id), (snapshot) => {
      if (snapshot.exists()) {
        console.log('[Trace][Realtime] workspace snapshot', { workspaceId: snapshot.id });
        const raw = snapshot.data() as Partial<Workspace>;
        setWorkspace({
          id: snapshot.id,
          name: raw.name ?? 'Workspace',
          ownerId: raw.ownerId ?? '',
          members: Array.isArray(raw.members) ? raw.members : [],
          createdAt: toNumber(raw.createdAt, Date.now()),
          teamId: raw.teamId,
          createdBy: raw.createdBy,
        });
      }
    }, (error) => {
      console.error('[Trace][Realtime] workspace listener error', error);
      console.error('Failed to sync workspace:', error);
      // Don't throw - gracefully degrade
    });

    return () => {
      console.log('[Trace][Realtime] unsubscribe start', { workspaceId: activeWorkspace.id });
      // Safely unsubscribe from all listeners
      try { unsubMessages(); } catch (e) { console.debug('Error unsubbing messages:', e); }
      try { unsubTasks(); } catch (e) { console.debug('Error unsubbing tasks:', e); }
      try { unsubDocs(); } catch (e) { console.debug('Error unsubbing docs:', e); }
      try { unsubDecisions(); } catch (e) { console.debug('Error unsubbing decisions:', e); }
      try { unsubRisks(); } catch (e) { console.debug('Error unsubbing risks:', e); }
      try { unsubMembers(); } catch (e) { console.debug('Error unsubbing members:', e); }
      try { unsubWorkspace(); } catch (e) { console.debug('Error unsubbing workspace:', e); }
    };
  }, [activeWorkspace?.id, user?.uid]);
}
