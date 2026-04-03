import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ListTodo, AlertCircle, Clock, User, Shield, Trash2, Save, LogOut, Layout, MessageSquare, FileText, Bell, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { db } from '../../firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { cn, formatDate } from '../../lib/utils';
import { Modal } from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

export function TaskModal({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const { user } = useAuthStore();
  const { activeWorkspace, members } = useWorkspaceStore();
  const { showTaskModal, setShowTaskModal, modal, closeModal } = useUIStore();
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as any,
    assigneeId: '',
    dueDate: ''
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !newTask.title) return;
    const path = `workspaces/${activeWorkspace.id}/tasks`;

    try {
      await addDoc(collection(db, path), {
        ...newTask,
        status: 'todo',
        createdAt: Date.now()
      });
      setNewTask({ title: '', description: '', priority: 'medium', assigneeId: '', dueDate: '' });
      setShowTaskModal(false);
      showToast('Task created!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      showToast('Failed to create task', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!activeWorkspace || !modal.data?.taskId) return;
    const path = `workspaces/${activeWorkspace.id}/tasks/${modal.data.taskId}`;
    try {
      await deleteDoc(doc(db, path));
      showToast('Task deleted');
      closeModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      showToast('Failed to delete task', 'error');
    }
  };

  return (
    <>
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl glass-ios border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-music-red to-music-purple" />
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-music-red/20 flex items-center justify-center text-music-red">
                      <ListTodo className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Create New Task</h2>
                  </div>
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    className="p-2 rounded-xl hover:bg-white/10 text-white/30 hover:text-white transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-6">
                  <GlassInput 
                    label="Task Title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="What needs to be done?"
                    required
                  />
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Description</label>
                    <textarea 
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full glass-ios-light bg-white/5 border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-music-red/50 transition-all h-32 resize-none"
                      placeholder="Add more details about this task..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Priority</label>
                      <select 
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                        className="w-full glass-ios-light bg-white/5 border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-music-red/50 transition-all appearance-none"
                      >
                        <option value="low" className="bg-[#12121A]">Low</option>
                        <option value="medium" className="bg-[#12121A]">Medium</option>
                        <option value="high" className="bg-[#12121A]">High</option>
                        <option value="urgent" className="bg-[#12121A]">Urgent</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Assignee</label>
                      <select 
                        value={newTask.assigneeId}
                        onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                        className="w-full glass-ios-light bg-white/5 border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-music-red/50 transition-all appearance-none"
                      >
                        <option value="" className="bg-[#12121A]">Unassigned</option>
                        {members.map(m => (
                          <option key={m.uid} value={m.uid} className="bg-[#12121A]">{m.displayName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <GlassButton 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setShowTaskModal(false)}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton type="submit" className="px-8">
                      Create Task
                    </GlassButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={modal.type === 'deleteTask'}
        onClose={closeModal}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDeleteTask}
      />
    </>
  );
}
