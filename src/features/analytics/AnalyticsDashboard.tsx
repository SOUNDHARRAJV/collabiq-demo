import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, PieChart, TrendingUp, Users, Activity, Sparkles, RefreshCw, ChevronRight, Layout, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import { getProjectInsights } from '../../services/gemini';
import { cn } from '../../lib/utils';

export function AnalyticsDashboard() {
  const { tasks, members } = useWorkspaceStore();
  const [insights, setInsights] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const workloadData = members.map(member => ({
    name: member.displayName,
    tasks: tasks.filter(t => t.assigneeId === member.uid).length
  }));

  const statusData = [
    { name: 'Backlog', value: tasks.filter(t => t.status === 'backlog').length, color: '#FFFFFF33' },
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#FF2D55' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#AF52DE' },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length, color: '#FFCC00' },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#34C759' },
  ];

  const handleRefreshInsights = async () => {
    if (tasks.length === 0) return;
    setIsRefreshing(true);
    try {
      const newInsights = await getProjectInsights(tasks);
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefreshInsights();
  }, [tasks.length]);

  const stats = [
    { label: 'Total Tasks', value: tasks.length, icon: Layout, color: 'text-white' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, icon: Activity, color: 'text-music-purple' },
    { label: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, icon: AlertTriangle, color: 'text-music-red' },
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <GlassCard key={idx} variant="light" className="flex items-center gap-4 p-6">
            <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{stat.label}</p>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <GlassCard className="h-96 flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-music-red" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Workload Distribution</h3>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff33" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#ffffff33" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#12121A', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                  {workloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#FF2D55' : '#AF52DE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Task Status Breakdown */}
        <GlassCard className="h-96 flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-music-purple" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Task Status</h3>
            </div>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#12121A', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 pr-8">
              {statusData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{entry.name}</span>
                  <span className="text-xs font-bold ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AI Insights Section */}
      <GlassCard variant="dark" className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-music-red to-music-purple flex items-center justify-center shadow-lg shadow-music-red/30">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">AI Project Insights</h3>
              <p className="text-xs text-white/30 font-medium">Actionable intelligence based on current velocity</p>
            </div>
          </div>
          <GlassButton 
            variant="secondary" 
            size="sm" 
            onClick={handleRefreshInsights}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </GlassButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.length > 0 ? insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard variant="light" className="h-full p-6 border-l-4 border-l-music-purple/50 hover:border-l-music-purple transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-music-purple/20 flex items-center justify-center text-music-purple text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-white/80">{insight}</p>
                </div>
              </GlassCard>
            </motion.div>
          )) : (
            <div className="col-span-3 py-12 text-center opacity-20">
              <Sparkles className="w-12 h-12 mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Generating insights...</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
