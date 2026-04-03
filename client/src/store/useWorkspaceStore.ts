import { create } from 'zustand';
import { Workspace, Member, Message, Task, Document, Decision, Risk } from '../types';

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  members: Member[];
  messages: Message[];
  tasks: Task[];
  documents: Document[];
  decisions: Decision[];
  risks: Risk[];
  userRole: 'admin' | 'member';
  
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setMembers: (members: Member[]) => void;
  setMessages: (messages: Message[]) => void;
  setTasks: (tasks: Task[]) => void;
  setDocuments: (documents: Document[]) => void;
  setDecisions: (decisions: Decision[]) => void;
  setRisks: (risks: Risk[]) => void;
  setUserRole: (role: 'admin' | 'member') => void;
  
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
  
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setMembers: (members) => set({ members }),
  setMessages: (messages) => set({ messages }),
  setTasks: (tasks) => set({ tasks }),
  setDocuments: (documents) => set({ documents }),
  setDecisions: (decisions) => set({ decisions }),
  setRisks: (risks) => set({ risks }),
  setUserRole: (role) => set({ userRole: role }),
  
  reset: () => set({
    activeWorkspace: null,
    members: [],
    messages: [],
    tasks: [],
    documents: [],
    decisions: [],
    risks: [],
    userRole: 'member'
  }),
}));
