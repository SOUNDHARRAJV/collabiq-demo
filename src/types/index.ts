export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'member';
  lastActive?: number;
  isOnline?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: number;
  teamId?: string;
  createdBy?: string;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string;
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  dueDate?: string;
  createdAt: number;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  lastEditedBy: string;
  updatedAt: number;
}

export interface Decision {
  id: string;
  text: string;
  timestamp: number;
}

export interface Risk {
  id: string;
  text: string;
  timestamp: number;
}

export interface Member {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'member';
  isOnline?: boolean;
}

export type ViewType = 'chat' | 'kanban' | 'documents' | 'analytics' | 'ai-insights' | 'workspace' | 'settings';

export interface ModalState {
  type: 'createWorkspace' | 'joinWorkspace' | 'inviteMember' | 'updateWorkspaceName' | 'createDocument' | 'deleteWorkspace' | 'deleteTask' | 'viewReport' | 'newTask' | null;
  data?: any;
}
