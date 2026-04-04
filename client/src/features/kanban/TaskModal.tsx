import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ListTodo, Loader2, Save, Trash2, X } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { ConfirmModal } from '../../components/ConfirmModal';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import { Task } from '../../types';

type TaskModalProps = {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

type FormState = {
  title: string;
  description: string;
  priority: Task['priority'];
  assigneeId: string;
  dueDate: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  priority: 'medium',
  assigneeId: '',
  dueDate: '',
};

function toDateInputValue(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const titleLength = form.title.trim().length;
  const descriptionLength = form.description.trim().length;

  if (titleLength < 5 || titleLength > 200) {
    errors.title = 'Title must be between 5 and 200 characters.';
  }

  if (descriptionLength > 5000) {
    errors.description = 'Description cannot exceed 5000 characters.';
  }

  if (form.dueDate) {
    const due = new Date(`${form.dueDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(due.getTime()) || due <= today) {
      errors.dueDate = 'Due date must be in the future.';
    }
  }

  return errors;
}

export function TaskModal({ showToast }: TaskModalProps) {
  const { activeWorkspace, members } = useWorkspaceStore();
  const { showTaskModal, setShowTaskModal, modal, setModal, closeModal } = useUIStore();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const editingTask = (modal.data?.task as Task | undefined) ?? null;
  const isEditMode = !!editingTask;

  useEffect(() => {
    if (!showTaskModal) return;

    if (isEditMode && editingTask) {
      const nextState: FormState = {
        title: editingTask.title ?? '',
        description: editingTask.description ?? '',
        priority: editingTask.priority ?? 'medium',
        assigneeId: editingTask.assigneeId ?? '',
        dueDate: toDateInputValue(editingTask.dueDate),
      };
      setForm(nextState);
      setErrors({});
      console.log('[Trace][TaskModal] hydrate edit form', { taskId: editingTask.id });
      return;
    }

    setForm(EMPTY_FORM);
    setErrors({});
    console.log('[Trace][TaskModal] hydrate create form');
  }, [showTaskModal, isEditMode, editingTask]);

  const modalTitle = useMemo(() => (isEditMode ? 'Edit Task' : 'Create Task'), [isEditMode]);

  const closeTaskModal = () => {
    if (isSaving || isDeleting) return;
    setShowTaskModal(false);
    closeModal();
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeWorkspace?.id) {
      showToast('Select a workspace before saving tasks.', 'error');
      return;
    }

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      console.warn('[Trace][TaskModal] validation failed', validationErrors);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      assigneeId: form.assigneeId || '',
      dueDate: form.dueDate ? new Date(`${form.dueDate}T23:59:59`).toISOString() : '',
    };

    setIsSaving(true);

    if (isEditMode && editingTask) {
      const taskPath = `workspaces/${activeWorkspace.id}/tasks/${editingTask.id}`;
      try {
        console.log('[Trace][TaskModal] update start', { taskPath, taskId: editingTask.id });
        await updateDoc(doc(db, taskPath), payload);
        console.log('[Trace][TaskModal] update success', { taskPath, taskId: editingTask.id });
        showToast('Task updated successfully.', 'success');
        closeTaskModal();
      } catch (error) {
        console.error('[Trace][TaskModal] update error', error);
        handleFirestoreError(error, OperationType.UPDATE, taskPath);
        showToast('Failed to update task.', 'error');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const collectionPath = `workspaces/${activeWorkspace.id}/tasks`;
    try {
      console.log('[Trace][TaskModal] create start', { collectionPath });
      await addDoc(collection(db, collectionPath), {
        ...payload,
        status: 'todo',
        createdAt: Date.now(),
      });
      console.log('[Trace][TaskModal] create success', { collectionPath });
      showToast('Task created successfully.', 'success');
      closeTaskModal();
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error('[Trace][TaskModal] create error', error);
      handleFirestoreError(error, OperationType.CREATE, collectionPath);
      showToast('Failed to create task.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!activeWorkspace?.id || !editingTask?.id) return;
    const taskPath = `workspaces/${activeWorkspace.id}/tasks/${editingTask.id}`;

    setIsDeleting(true);
    try {
      console.log('[Trace][TaskModal] delete start', { taskPath, taskId: editingTask.id });
      await deleteDoc(doc(db, taskPath));
      console.log('[Trace][TaskModal] delete success', { taskPath, taskId: editingTask.id });
      showToast('Task deleted.', 'success');
      setShowDeleteConfirm(false);
      closeTaskModal();
    } catch (error) {
      console.error('[Trace][TaskModal] delete error', error);
      handleFirestoreError(error, OperationType.DELETE, taskPath);
      showToast('Failed to delete task.', 'error');
    } finally {
      setIsDeleting(false);
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
              onClick={closeTaskModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-ios border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-music-red to-music-purple" />
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-music-red/20 flex items-center justify-center text-music-red">
                      <ListTodo className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{modalTitle}</h2>
                  </div>
                  <button
                    onClick={closeTaskModal}
                    className="p-2 rounded-xl hover:bg-white/10 text-white/30 hover:text-white transition-all"
                    aria-label="Close task modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <GlassInput
                    label="Task Title"
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="What needs to be done?"
                    error={errors.title}
                    disabled={isSaving || isDeleting}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="w-full glass-ios-light bg-white/5 border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-music-red/50 transition-all h-36 resize-none"
                      placeholder="Add detailed context for this task"
                      disabled={isSaving || isDeleting}
                    />
                    {errors.description && <p className="text-[10px] text-red-400 ml-1">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Priority</label>
                      <select
                        value={form.priority}
                        onChange={(e) => handleChange('priority', e.target.value as Task['priority'])}
                        className="w-full glass-ios-light bg-white/5 border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-music-red/50 transition-all"
                        disabled={isSaving || isDeleting}
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
                        value={form.assigneeId}
                        onChange={(e) => handleChange('assigneeId', e.target.value)}
                        className="w-full glass-ios-light bg-white/5 border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-music-red/50 transition-all"
                        disabled={isSaving || isDeleting}
                      >
                        <option value="" className="bg-[#12121A]">Unassigned</option>
                        {members.map((member) => (
                          <option key={member.uid} value={member.uid} className="bg-[#12121A]">
                            {member.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <GlassInput
                      label="Due Date"
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => handleChange('dueDate', e.target.value)}
                      error={errors.dueDate}
                      disabled={isSaving || isDeleting}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      {isEditMode && (
                        <GlassButton
                          type="button"
                          variant="danger"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isSaving || isDeleting}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </GlassButton>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <GlassButton
                        type="button"
                        variant="secondary"
                        onClick={closeTaskModal}
                        disabled={isSaving || isDeleting}
                      >
                        Cancel
                      </GlassButton>
                      <GlassButton type="submit" disabled={isSaving || isDeleting} className="flex items-center gap-2 min-w-32 justify-center">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{isEditMode ? 'Save Changes' : 'Create Task'}</span>
                      </GlassButton>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Task"
        message="This action cannot be undone. Do you want to continue?"
        onConfirm={handleDeleteTask}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Task'}
        isDanger
        loading={isDeleting}
      />
    </>
  );
}
