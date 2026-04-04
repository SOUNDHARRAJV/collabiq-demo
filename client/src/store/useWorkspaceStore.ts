import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, Member, Message, Task, Document, Decision, Risk } from '../types';

const DEBUG = true; // Button flow tracing enabled
type Updater<T> = T | ((prev: T) => T);

function resolveNext<T>(prev: T, next: Updater<T>): T {
  return typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
}

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  members: Member[];
  activeUserIds: string[];
  messages: Message[];
  tasks: Task[];
  documents: Document[];
  decisions: Decision[];
  risks: Risk[];
  userRole: 'admin' | 'member';
  
  // Safe full setters (for initial/complete loads)
  setWorkspace: (workspace: Updater<Workspace | null>) => void;
  setActiveWorkspace: (workspace: Updater<Workspace | null>) => void;
  setMembers: (members: Updater<Member[]>) => void;
  setActiveUserIds: (userIds: Updater<string[]>) => void;
  setMessages: (messages: Updater<Message[]>) => void;
  setTasks: (tasks: Updater<Task[]>) => void;
  setDocuments: (documents: Updater<Document[]>) => void;
  setDecisions: (decisions: Updater<Decision[]>) => void;
  setRisks: (risks: Updater<Risk[]>) => void;
  setUserRole: (role: Updater<'admin' | 'member'>) => void;
  
  // Partial update functions (add/update single items with deduplication)
  addOrUpdateMessage: (message: Message) => void;
  addOrUpdateTask: (task: Task) => void;
  addOrUpdateDocument: (document: Document) => void;
  addOrUpdateDecision: (decision: Decision) => void;
  addOrUpdateRisk: (risk: Risk) => void;
  addOrUpdateMember: (member: Member) => void;
  
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(persist((set) => ({
  activeWorkspace: null,
  members: [],
  activeUserIds: [],
  messages: [],
  tasks: [],
  documents: [],
  decisions: [],
  risks: [],
  userRole: 'member',

  setWorkspace: (workspace) => {
    set((state) => {
      const nextWorkspace = resolveNext(state.activeWorkspace, workspace);
      if (DEBUG) console.log('[Trace][Store][Workspace] setWorkspace', { prev: state.activeWorkspace?.id ?? null, next: nextWorkspace?.id ?? null });
      if (nextWorkspace === state.activeWorkspace) return state;
      return { activeWorkspace: nextWorkspace };
    });
  },
  
  // Safe full setters with logging
  setActiveWorkspace: (workspace) => {
    set((state) => {
      const nextWorkspace = resolveNext(state.activeWorkspace, workspace);
      if (DEBUG) console.log('[Trace][Store][Workspace] setActiveWorkspace', { prev: state.activeWorkspace?.id ?? null, next: nextWorkspace?.id ?? null });
      if (nextWorkspace === state.activeWorkspace) return state;
      return { activeWorkspace: nextWorkspace };
    });
  },
  setMembers: (members) => {
    set((state) => {
      const nextMembers = resolveNext(state.members, members);
      if (DEBUG) console.log('[Trace][Store][Workspace] setMembers', { prev: state.members.length, next: nextMembers.length });
      if (nextMembers === state.members) return state;
      return { members: nextMembers };
    });
  },
  setActiveUserIds: (userIds) => {
    set((state) => {
      const nextIds = resolveNext(state.activeUserIds, userIds);
      if (DEBUG) console.log('[Trace][Store][Workspace] setActiveUserIds', { prev: state.activeUserIds.length, next: nextIds.length });
      if (nextIds === state.activeUserIds) return state;
      return { activeUserIds: nextIds };
    });
  },
  setMessages: (messages) => {
    set((state) => {
      const nextMessages = resolveNext(state.messages, messages);
      if (DEBUG) console.log('[Trace][Store][Workspace] setMessages', { prev: state.messages.length, next: nextMessages.length });
      if (nextMessages === state.messages) return state;
      return { messages: nextMessages };
    });
  },
  setTasks: (tasks) => {
    set((state) => {
      const nextTasks = resolveNext(state.tasks, tasks);
      if (DEBUG) console.log('[Trace][Store][Workspace] setTasks', { prev: state.tasks.length, next: nextTasks.length });
      if (nextTasks === state.tasks) return state;
      return { tasks: nextTasks };
    });
  },
  setDocuments: (documents) => {
    set((state) => {
      const nextDocuments = resolveNext(state.documents, documents);
      if (DEBUG) console.log('[Trace][Store][Workspace] setDocuments', { prev: state.documents.length, next: nextDocuments.length });
      if (nextDocuments === state.documents) return state;
      return { documents: nextDocuments };
    });
  },
  setDecisions: (decisions) => {
    set((state) => {
      const nextDecisions = resolveNext(state.decisions, decisions);
      if (DEBUG) console.log('[Trace][Store][Workspace] setDecisions', { prev: state.decisions.length, next: nextDecisions.length });
      if (nextDecisions === state.decisions) return state;
      return { decisions: nextDecisions };
    });
  },
  setRisks: (risks) => {
    set((state) => {
      const nextRisks = resolveNext(state.risks, risks);
      if (DEBUG) console.log('[Trace][Store][Workspace] setRisks', { prev: state.risks.length, next: nextRisks.length });
      if (nextRisks === state.risks) return state;
      return { risks: nextRisks };
    });
  },
  setUserRole: (role) => {
    set((state) => {
      const nextRole = resolveNext(state.userRole, role);
      if (DEBUG) console.log('[Trace][Store][Workspace] setUserRole', { prev: state.userRole, next: nextRole });
      if (nextRole === state.userRole) return state;
      return { userRole: nextRole };
    });
  },
  
  // Partial updates with deduplication and logging
  addOrUpdateMessage: (message) => {
    set((state) => {
      const existing = state.messages.findIndex(m => m.id === message.id);
      let updated: Message[];
      
      if (existing >= 0) {
        // Update existing: merge properties
        updated = state.messages.map((m, i) => i === existing ? { ...m, ...message } : m);
        if (DEBUG) console.log('[Trace][Store][Workspace] updateMessage', { id: message.id });
      } else {
        // Add new: prepend (most recent first)
        updated = [message, ...state.messages];
        if (DEBUG) console.log('[Trace][Store][Workspace] addMessage', { id: message.id });
      }
      
      return { messages: updated };
    });
  },
  
  addOrUpdateTask: (task) => {
    set((state) => {
      const existing = state.tasks.findIndex(t => t.id === task.id);
      let updated: Task[];
      
      if (existing >= 0) {
        updated = state.tasks.map((t, i) => i === existing ? { ...t, ...task } : t);
        if (DEBUG) console.log('[Trace][Store][Workspace] updateTask', { id: task.id });
      } else {
        updated = [task, ...state.tasks];
        if (DEBUG) console.log('[Trace][Store][Workspace] addTask', { id: task.id });
      }
      
      return { tasks: updated };
    });
  },
  
  addOrUpdateDocument: (document) => {
    set((state) => {
      const existing = state.documents.findIndex(d => d.id === document.id);
      let updated: Document[];
      
      if (existing >= 0) {
        updated = state.documents.map((d, i) => i === existing ? { ...d, ...document } : d);
        if (DEBUG) console.log('[Trace][Store][Workspace] updateDocument', { id: document.id });
      } else {
        updated = [document, ...state.documents];
        if (DEBUG) console.log('[Trace][Store][Workspace] addDocument', { id: document.id });
      }
      
      return { documents: updated };
    });
  },
  
  addOrUpdateDecision: (decision) => {
    set((state) => {
      const existing = state.decisions.findIndex(d => d.id === decision.id);
      let updated: Decision[];
      
      if (existing >= 0) {
        updated = state.decisions.map((d, i) => i === existing ? { ...d, ...decision } : d);
        if (DEBUG) console.log('[Trace][Store][Workspace] updateDecision', { id: decision.id });
      } else {
        updated = [decision, ...state.decisions];
        if (DEBUG) console.log('[Trace][Store][Workspace] addDecision', { id: decision.id });
      }
      
      return { decisions: updated };
    });
  },
  
  addOrUpdateRisk: (risk) => {
    set((state) => {
      const existing = state.risks.findIndex(r => r.id === risk.id);
      let updated: Risk[];
      
      if (existing >= 0) {
        updated = state.risks.map((r, i) => i === existing ? { ...r, ...risk } : r);
        if (DEBUG) console.log('[Trace][Store][Workspace] updateRisk', { id: risk.id });
      } else {
        updated = [risk, ...state.risks];
        if (DEBUG) console.log('[Trace][Store][Workspace] addRisk', { id: risk.id });
      }
      
      return { risks: updated };
    });
  },
  
  addOrUpdateMember: (member) => {
    set((state) => {
      const existing = state.members.findIndex(m => m.uid === member.uid);
      let updated: Member[];
      
      if (existing >= 0) {
        updated = state.members.map((m, i) => i === existing ? { ...m, ...member } : m);
        if (DEBUG) console.log('[Trace][Store][Workspace] updateMember', { uid: member.uid });
      } else {
        updated = [...state.members, member];
        if (DEBUG) console.log('[Trace][Store][Workspace] addMember', { uid: member.uid });
      }
      
      return { members: updated };
    });
  },
  
  reset: () => {
    if (DEBUG) console.log('[Trace][Store][Workspace] reset');
    set({
      activeWorkspace: null,
      members: [],
      activeUserIds: [],
      messages: [],
      tasks: [],
      documents: [],
      decisions: [],
      risks: [],
      userRole: 'member'
    });
  },
}), {
  name: 'collabiq-workspace-store',
  partialize: (state) => ({
    activeWorkspace: state.activeWorkspace,
    userRole: state.userRole,
  }),
}));
