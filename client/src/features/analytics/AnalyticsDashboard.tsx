import { ComponentType, useMemo } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CheckCircle2, Clock3, ListTodo, Users } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { Task } from '../../types';

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: '#94A3B8',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
};

const STATUS_COLORS: Record<Task['status'], string> = {
  backlog: '#94A3B8',
  todo: '#3B82F6',
  'in-progress': '#F59E0B',
  review: '#A855F7',
  done: '#22C55E',
};

function hoursBetween(from: number, to: number) {
  return (to - from) / (1000 * 60 * 60);
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <GlassCard variant="light" className="p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-music-red" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-[11px] text-white/40">{helper}</p>
      </div>
    </GlassCard>
  );
}

export function AnalyticsDashboard() {
  const { tasks, members } = useWorkspaceStore();

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'done');
    const inProgress = tasks.filter((task) => task.status === 'in-progress').length;
    const doneCount = completed.length;
    const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const averageCompletionHours = doneCount
      ? Math.round(
          completed.reduce((sum, task) => sum + Math.max(0, hoursBetween(task.createdAt, Date.now())), 0) / doneCount
        )
      : 0;

    console.log('[Trace][Analytics] metrics recomputed', {
      total,
      doneCount,
      inProgress,
      completionRate,
      averageCompletionHours,
    });

    return {
      total,
      doneCount,
      inProgress,
      completionRate,
      averageCompletionHours,
      memberCount: members.length,
    };
  }, [tasks, members.length]);

  const statusData = useMemo(
    () => [
      { name: 'Backlog', value: tasks.filter((task) => task.status === 'backlog').length, color: STATUS_COLORS.backlog },
      { name: 'To Do', value: tasks.filter((task) => task.status === 'todo').length, color: STATUS_COLORS.todo },
      {
        name: 'In Progress',
        value: tasks.filter((task) => task.status === 'in-progress').length,
        color: STATUS_COLORS['in-progress'],
      },
      { name: 'Review', value: tasks.filter((task) => task.status === 'review').length, color: STATUS_COLORS.review },
      { name: 'Done', value: tasks.filter((task) => task.status === 'done').length, color: STATUS_COLORS.done },
    ],
    [tasks]
  );

  const priorityData = useMemo(
    () => [
      { name: 'Low', value: tasks.filter((task) => task.priority === 'low').length, color: PRIORITY_COLORS.low },
      { name: 'Medium', value: tasks.filter((task) => task.priority === 'medium').length, color: PRIORITY_COLORS.medium },
      { name: 'High', value: tasks.filter((task) => task.priority === 'high').length, color: PRIORITY_COLORS.high },
      { name: 'Urgent', value: tasks.filter((task) => task.priority === 'urgent').length, color: PRIORITY_COLORS.urgent },
    ],
    [tasks]
  );

  const workloadData = useMemo(() => {
    return members.map((member) => ({
      name: member.displayName,
      tasks: tasks.filter((task) => task.assigneeId === member.uid).length,
    }));
  }, [members, tasks]);

  const trendData = useMemo(() => {
    const byDay = new Map<string, number>();
    tasks.forEach((task) => {
      const day = new Date(task.createdAt).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });

    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([day, created]) => ({ day: day.slice(5), created }));
  }, [tasks]);

  const hasData = tasks.length > 0;

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Tasks" value={metrics.total} helper="All statuses" icon={ListTodo} />
        <MetricCard label="In Progress" value={metrics.inProgress} helper="Currently active" icon={Activity} />
        <MetricCard label="Completed" value={metrics.doneCount} helper={`${metrics.completionRate}% completion`} icon={CheckCircle2} />
        <MetricCard label="Team Members" value={metrics.memberCount} helper="Available assignees" icon={Users} />
      </div>

      {!hasData ? (
        <GlassCard className="p-10 text-center">
          <p className="text-lg font-semibold">No analytics data yet</p>
          <p className="text-sm text-white/50 mt-2">Create tasks to populate status, priority, and workload charts.</p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <GlassCard className="h-96 p-5">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Task Status Breakdown</p>
              <ResponsiveContainer width="100%" height="92%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#12121A', border: '1px solid #ffffff20' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="h-96 p-5">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Priority Distribution</p>
              <ResponsiveContainer width="100%" height="92%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff70" />
                  <YAxis stroke="#ffffff70" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#12121A', border: '1px solid #ffffff20' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <GlassCard className="h-96 p-5">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Team Workload</p>
              <ResponsiveContainer width="100%" height="92%">
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff70" />
                  <YAxis stroke="#ffffff70" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#12121A', border: '1px solid #ffffff20' }} />
                  <Bar dataKey="tasks" fill="#FF2D55" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="h-96 p-5">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Task Creation Trend</p>
              <ResponsiveContainer width="100%" height="92%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
                  <XAxis dataKey="day" stroke="#ffffff70" />
                  <YAxis stroke="#ffffff70" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#12121A', border: '1px solid #ffffff20' }} />
                  <Line type="monotone" dataKey="created" stroke="#A855F7" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          <GlassCard variant="dark" className="p-5">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">Quick Insights</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-[11px] text-white/50">Completion Rate</p>
                <p className="text-xl font-bold mt-1">{metrics.completionRate}%</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-[11px] text-white/50">Average Completion Time</p>
                <p className="text-xl font-bold mt-1 flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-white/70" />
                  {metrics.averageCompletionHours}h
                </p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-[11px] text-white/50">Unassigned Tasks</p>
                <p className="text-xl font-bold mt-1">{tasks.filter((task) => !task.assigneeId).length}</p>
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
