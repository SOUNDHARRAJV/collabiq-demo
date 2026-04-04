import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Loader2, Plus, Search, User2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { db } from '../../firebase';
import { cn, formatDate } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import { Task } from '../../types';

type ColumnConfig = {
  title: string;
  status: Task['status'];
  accent: string;
  dot: string;
};

const COLUMNS: ColumnConfig[] = [
  { title: 'Backlog', status: 'backlog', accent: 'border-slate-400/50', dot: 'bg-slate-400' },
  { title: 'To Do', status: 'todo', accent: 'border-blue-400/50', dot: 'bg-blue-400' },
  { title: 'In Progress', status: 'in-progress', accent: 'border-amber-400/50', dot: 'bg-amber-400' },
  { title: 'Review', status: 'review', accent: 'border-purple-400/50', dot: 'bg-purple-400' },
  { title: 'Done', status: 'done', accent: 'border-emerald-400/50', dot: 'bg-emerald-400' },
];

const STATUS_SHORTCUTS: Record<string, Task['status']> = {
  '1': 'backlog',
  '2': 'todo',
  '3': 'in-progress',
  '4': 'review',
  '5': 'done',
};

function priorityDot(priority: Task['priority']) {
  if (priority === 'urgent') return 'bg-red-500';
  if (priority === 'high') return 'bg-orange-400';
  if (priority === 'medium') return 'bg-blue-400';
  return 'bg-slate-300';
}

export function KanbanDashboard() {
  const { tasks, members, activeWorkspace, userRole } = useWorkspaceStore();
  const { setShowTaskModal, setModal } = useUIStore();
  const [search, setSearch] = useState('');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const memberNameMap = useMemo(
    () => new Map(members.map((member) => [member.uid, member.displayName])),
    [members]
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        (memberNameMap.get(task.assigneeId || '') || '').toLowerCase().includes(query)
      );
    });
  }, [tasks, search, memberNameMap]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<Task['status'], Task[]> = {
      backlog: [],
      todo: [],
      'in-progress': [],
      review: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  const openCreateModal = () => {
    console.log('[Trace][Kanban] open create modal');
    setModal({ type: 'newTask', data: {} });
    setShowTaskModal(true);
  };

  const openEditModal = (task: Task) => {
    console.log('[Trace][Kanban] open edit modal', { taskId: task.id });
    setModal({ type: 'newTask', data: { task } });
    setShowTaskModal(true);
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    if (!activeWorkspace?.id) return;
    const current = tasks.find((task) => task.id === taskId);
    if (!current || current.status === status) return;

    const path = `workspaces/${activeWorkspace.id}/tasks/${taskId}`;
    setUpdatingTaskId(taskId);

    try {
      console.log('[Trace][Kanban] update status start', { taskId, status, path });
      await updateDoc(doc(db, path), { status });
      console.log('[Trace][Kanban] update status success', { taskId, status, path });
    } catch (error) {
      console.error('[Trace][Kanban] update status error', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const onCardKeyDown = async (event: React.KeyboardEvent<HTMLDivElement>, task: Task) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditModal(task);
      return;
    }

    if (event.altKey && STATUS_SHORTCUTS[event.key]) {
      event.preventDefault();
      await updateTaskStatus(task.id, STATUS_SHORTCUTS[event.key]);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, description, assignee"
            className="w-full glass-ios-light bg-white/5 border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-music-red/30"
          />
        </div>

        {userRole === 'admin' && (
          <GlassButton onClick={openCreateModal} className="flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </GlassButton>
        )}
      </div>

      <div className="flex-1 overflow-x-auto pb-2">
        <div className="min-w-[1320px] h-full grid grid-cols-5 gap-5">
          {COLUMNS.map((column) => {
            const columnTasks = tasksByStatus[column.status] || [];

            return (
              <div
                key={column.status}
                onDragOver={(event) => event.preventDefault()}
                onDrop={async () => {
                  if (!draggingTaskId) return;
                  await updateTaskStatus(draggingTaskId, column.status);
                  setDraggingTaskId(null);
                }}
                className="h-full rounded-2xl bg-white/5 border border-white/10 p-3 flex flex-col"
              >
                <div className="px-2 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', column.dot)} />
                    <h3 className="text-xs uppercase tracking-widest text-white/60 font-bold">{column.title}</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {columnTasks.map((task) => {
                      const assignee = task.assigneeId ? memberNameMap.get(task.assigneeId) : undefined;

                      return (
                        <motion.div
                          key={task.id}
                          layout
                          draggable
                          onDragStart={() => setDraggingTaskId(task.id)}
                          onKeyDown={(event) => onCardKeyDown(event, task)}
                          tabIndex={0}
                          role="button"
                          aria-label={`Open task ${task.title}`}
                          onClick={() => openEditModal(task)}
                          className="outline-none"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                        >
                          <GlassCard
                            variant="light"
                            className={cn(
                              'p-4 border-l-4 cursor-pointer focus-within:ring-2 focus-within:ring-music-red/40 hover:bg-white/10 transition-all',
                              column.accent
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
                              {updatingTaskId === task.id ? <Loader2 className="w-4 h-4 animate-spin text-white/50" /> : null}
                            </div>

                            <p className="mt-2 text-xs text-white/60 line-clamp-3 min-h-[48px]">
                              {task.description || 'No description provided.'}
                            </p>

                            <div className="mt-3 space-y-2 text-[11px] text-white/60">
                              <div className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full', priorityDot(task.priority))} />
                                <span className="uppercase tracking-widest font-semibold">{task.priority}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <User2 className="w-3.5 h-3.5" />
                                <span>{assignee || 'Unassigned'}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                              </div>
                            </div>
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {columnTasks.length === 0 ? (
                    <div className="h-36 rounded-2xl border border-dashed border-white/15 flex items-center justify-center text-center px-4">
                      <p className="text-xs text-white/35">No tasks in {column.title}. Drop a task here.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-white/35">Keyboard shortcuts: focus a task and press Alt+1..5 to move it across columns.</p>
    </div>
  );
}
