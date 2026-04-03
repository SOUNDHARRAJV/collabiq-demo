import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Trash2, Clock, User, AlertCircle, CheckCircle2, ListTodo, PlayCircle, Search, Filter } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cn, formatDate } from '../../lib/utils';
import { Task } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

interface KanbanColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  onMoveTask: (id: string, status: Task['status']) => void;
  onDeleteTask: (id: string) => void;
  isAdmin: boolean;
  onAddTask: () => void;
}

function KanbanColumn({ title, status, tasks, onMoveTask, onDeleteTask, isAdmin, onAddTask }: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onMoveTask(taskId, status);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'backlog': return <ListTodo className="w-4 h-4 text-white/30" />;
      case 'todo': return <AlertCircle className="w-4 h-4 text-music-red" />;
      case 'in-progress': return <PlayCircle className="w-4 h-4 text-music-purple" />;
      case 'review': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'done': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex-1 min-w-[320px] h-full flex flex-col gap-4 p-4 rounded-2xl transition-all duration-300",
        isOver ? "bg-white/10 ring-2 ring-music-red/30" : "bg-white/2"
      )}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{title}</h3>
          <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/40">
            {tasks.length}
          </span>
        </div>
        {isAdmin && (
          <button 
            onClick={onAddTask}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              draggable
              onDragStart={(e: any) => e.dataTransfer.setData('taskId', task.id)}
              className="cursor-grab active:cursor-grabbing"
            >
              <GlassCard variant="light" className="group relative p-4 border-l-4 border-l-music-red/50 hover:border-l-music-red transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-semibold leading-tight pr-6">{task.title}</h4>
                  {isAdmin && (
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-white/50 line-clamp-2 mb-4 leading-relaxed">
                  {task.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                      task.priority === 'urgent' ? "bg-red-500/20 text-red-400" :
                      task.priority === 'high' ? "bg-amber-500/20 text-amber-400" :
                      task.priority === 'medium' ? "bg-blue-500/20 text-blue-400" :
                      "bg-white/10 text-white/40"
                    )}>
                      {task.priority}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] text-white/30 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(task.createdAt)}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest">Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanDashboard() {
  const { tasks, activeWorkspace, userRole } = useWorkspaceStore();
  const { setModal, setShowTaskModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleMoveTask = async (taskId: string, newStatus: Task['status']) => {
    if (!activeWorkspace) return;
    const path = `workspaces/${activeWorkspace.id}/tasks/${taskId}`;
    try {
      await updateDoc(doc(db, path), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      console.error('Error moving task:', error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setModal({ type: 'deleteTask', data: { taskId } });
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: { title: string; status: Task['status'] }[] = [
    { title: 'Backlog', status: 'backlog' },
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'in-progress' },
    { title: 'Review', status: 'review' },
    { title: 'Completed', status: 'done' },
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-ios-light bg-white/5 border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-music-red/30 transition-all"
            />
          </div>
          <GlassButton variant="secondary" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </GlassButton>
        </div>
        
        {userRole === 'admin' && (
          <GlassButton 
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </GlassButton>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto flex gap-6 pb-4 custom-scrollbar">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            status={col.status}
            tasks={filteredTasks.filter(t => t.status === col.status)}
            onMoveTask={handleMoveTask}
            onDeleteTask={handleDeleteTask}
            isAdmin={userRole === 'admin'}
            onAddTask={() => setShowTaskModal(true)}
          />
        ))}
      </div>
    </div>
  );
}
