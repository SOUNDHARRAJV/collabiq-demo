import { create } from 'zustand';
import { Workspace, Member, Message, Task, Document, Decision, Risk } from '../types';

const DEBUG = false; // Set to true to enable debug logging

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  members: Member[];
  messages: Message[];
  tasks: Task[];
  documents: Document[];
  decisions: Decision[];
  risks: Risk[];
  userRole: 'admin' | 'member';
  
  // Safe full setters (for initial/complete loads)
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setMembers: (members: Member[]) => void;
  setMessages: (messages: Message[]) => void;
  setTasks: (tasks: Task[]) => void;
  setDocuments: (documents: Document[]) => void;
  setDecisions: (decisions: Decision[]) => void;
  setRisks: (risks: Risk[]) => void;
  setUserRole: (role: 'admin' | 'member') => void;
  
  // Partial update functions (add/update single items with deduplication)
  addOrUpdateMessage: (message: Message) => void;
  addOrUpdateTask: (task: Task) => void;
  addOrUpdateDocument: (document: Document) => void;
  addOrUpdateDecision: (decision: Decision) => void;
  addOrUpdateRisk: (risk: Risk) => void;
  addOrUpdateMember: (member: Member) => void;
  
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: null,
  members: [],
  messages: [],
  tasks: [],
  documents: [],
  decisions: [],
  risks: [],
  userRole: 'member',
  
  // Safe full setters with logging
  setActiveWorkspace: (workspace) => {
    if (DEBUG) console.log('[Store] setActiveWorkspace:', workspace?.id);
    set({ activeWorkspace: workspace });
  },
  setMembers: (members) => {
    if (DEBUG) console.log('[Store] setMembers:', members.length, 'items');
    set({ members });
  },
  setMessages: (messages) => {
    if (DEBUG) console.log('[Store] setMessages:', messages.length, 'items');
    set({ messages });
  },
  setTasks: (tasks) => {
    if (DEBUG) console.log('[Store] setTasks:', tasks.length, 'items');
    set({ tasks });
  },
  setDocuments: (documents) => {
    if (DEBUG) console.log('[Store] setDocuments:', documents.length, 'items');
    set({ documents });
  },
  setDecisions: (decisions) => {
    if (DEBUG) console.log('[Store] setDecisions:', decisions.length, 'items');
    set({ decisions });
  },
  setRisks: (risks) => {
    if (DEBUG) console.log('[Store] setRisks:', risks.length, 'items');
    set({ risks });
  },
  setUserRole: (role) => {
    if (DEBUG) console.log('[Store] setUserRole:', role);
    set({ userRole: role });
  },
  
  // Partial updates with deduplication and logging
  addOrUpdateMessage: (message) => {
    set((state) => {
      const existing = state.messages.findIndex(m => m.id === message.id);
      let updated: Message[];
      
      if (existing >= 0) {
        // Update existing: merge properties
        updated = state.messages.map((m, i) => i === existing ? { ...m, ...message } : m);
        if (DEBUG) console.log('[Store] updateMessage:', message.id);
      } else {
        // Add new: prepend (most recent first)
        updated = [message, ...state.messages];
        if (DEBUG) console.log('[Store] addMessage:', message.id);
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
        if (DEBUG) console.log('[Store] updateTask:', task.id);
      } else {
        updated = [task, ...state.tasks];
        if (DEBUG) console.log('[Store] addTask:', task.id);
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
        if (DEBUG) console.log('[Store] updateDocument:', document.id);
      } else {
        updated = [document, ...state.documents];
        if (DEBUG) console.log('[Store] addDocument:', document.id);
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
        if (DEBUG) console.log('[Store] updateDecision:', decision.id);
      } else {
        updated = [decision, ...state.decisions];
        if (DEBUG) console.log('[Store] addDecision:', decision.id);
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
        if (DEBUG) console.log('[Store] updateRisk:', risk.id);
      } else {
        updated = [risk, ...state.risks];
        if (DEBUG) console.log('[Store] addRisk:', risk.id);
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
        if (DEBUG) console.log('[Store] updateMember:', member.uid);
      } else {
        updated = [...state.members, member];
        if (DEBUG) console.log('[Store] addMember:', member.uid);
      }
      
      return { members: updated };
    });
  },
  
  reset: () => {
    if (DEBUG) console.log('[Store] reset');
    set({
      activeWorkspace: null,
      members: [],
      messages: [],
      tasks: [],
      documents: [],
      decisions: [],
      risks: [],
      userRole: 'member'
    });
  },
}));
