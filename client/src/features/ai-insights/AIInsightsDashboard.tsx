import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertTriangle, ListTodo, Clock, RefreshCw, FileText, ChevronRight, MessageSquare, Layout } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { useToast } from '../notifications/ToastProvider';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { generateWorkspaceReport } from '../../services';
import { cn, formatDate } from '../../lib/utils';

export function AIInsightsDashboard() {
  const { activeWorkspace, tasks, decisions, risks } = useWorkspaceStore();
  const { setModal } = useUIStore();
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInsightChevronClick = (payload: { section: string; id?: string; index: number }) => {
    console.warn('[Breakpoint][UI][AIInsightsDashboard] chevron button clicked but detail action is not implemented', payload);
  };

  const handleGenerateReport = async () => {
    console.log('[Trace][UI][AIInsightsDashboard] generate report click', {
      workspaceId: activeWorkspace?.id,
      tasks: tasks.length,
      decisions: decisions.length,
      risks: risks.length,
    });
    if (!activeWorkspace) {
      console.warn('[Breakpoint][Flow][AIInsightsDashboard] generate report blocked by guard (no workspace)');
      return;
    }
    setIsGenerating(true);
    try {
      console.log('[Trace][API][Gemini] generateWorkspaceReport start', { workspaceName: activeWorkspace.name });
      const report = await generateWorkspaceReport(
        activeWorkspace.name,
        tasks,
        decisions.map(d => d.text),
        risks.map(r => r.text)
      );
      console.log('[Trace][API][Gemini] generateWorkspaceReport success', { reportLength: report.length });
      setModal({ type: 'viewReport', data: { report } });
      showToast('Status report generated successfully');
    } catch (error) {
      console.error('[Trace][API][Gemini] generateWorkspaceReport error', error);
      console.error('Failed to generate report:', error);
      showToast('Failed to generate report. Please try again.', 'error');
    } finally {
      console.log('[Trace][UI][AIInsightsDashboard] generate report flow complete');
      setIsGenerating(false);
    }
  };

  const sections = [
    { 
      title: 'Extracted Tasks', 
      icon: ListTodo, 
      color: 'text-music-red', 
      data: tasks.filter(t => t.status === 'backlog'),
      empty: 'No new tasks extracted from discussion yet.'
    },
    { 
      title: 'Key Decisions', 
      icon: CheckCircle2, 
      color: 'text-emerald-400', 
      data: decisions,
      empty: 'No critical decisions detected in recent chat.'
    },
    { 
      title: 'Identified Risks', 
      icon: AlertTriangle, 
      color: 'text-amber-400', 
      data: risks,
      empty: 'No project risks identified by AI analysis.'
    },
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white/5 p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-music-red to-music-purple flex items-center justify-center shadow-lg shadow-music-red/30">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">AI Intelligence Hub</h2>
          </div>
          <p className="text-sm text-white/40 max-w-lg leading-relaxed">
            CollabIQ's AI engine continuously monitors your team's discussion to extract actionable intelligence. 
            Review and convert these insights into project assets.
          </p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <GlassButton 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <FileText className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            <span>{isGenerating ? 'Generating...' : 'Generate Status Report'}</span>
          </GlassButton>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-music-red/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-music-purple/10 blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {sections.map((section, idx) => (
          <GlassCard key={idx} className="flex flex-col h-full border-white/5">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2">
                <section.icon className={cn("w-4 h-4", section.color)} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{section.title}</h3>
              </div>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/40">
                {section.data.length}
              </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
              {section.data.length > 0 ? section.data.map((item: any, itemIdx: number) => (
                <motion.div
                  key={item.id || itemIdx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: itemIdx * 0.05 }}
                >
                  <GlassCard variant="light" className="p-4 group hover:border-white/20 transition-all">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", section.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-white/80">
                          {item.title || item.text}
                        </p>
                        {item.description && (
                          <p className="text-[10px] text-white/30 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(item.timestamp || item.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-white/20 hover:text-white transition-all"
                        onClick={() => handleInsightChevronClick({ section: section.title, id: item.id, index: itemIdx })}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center py-12 opacity-10 text-center">
                  <section.icon className="w-12 h-12 mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest px-8">{section.empty}</p>
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Timeline View (Bonus) */}
      <GlassCard variant="light" className="p-8">
        <div className="flex items-center gap-2 mb-8">
          <Clock className="w-4 h-4 text-music-purple" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Intelligence Timeline</h3>
        </div>
        
        <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
          {[...tasks, ...decisions, ...risks].sort((a: any, b: any) => (b.timestamp || b.createdAt) - (a.timestamp || a.createdAt)).slice(0, 5).map((item: any, idx) => (
            <div key={idx} className="relative pl-10">
              <div className={cn(
                "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-[#0B0B0F] flex items-center justify-center z-10",
                item.status ? "bg-music-red" : item.text ? "bg-emerald-400" : "bg-amber-400"
              )}>
                {item.status ? <Layout className="w-2.5 h-2.5 text-white" /> : <MessageSquare className="w-2.5 h-2.5 text-white" />}
              </div>
              <div>
                <p className="text-xs font-bold text-white/30 mb-1">{formatDate(item.timestamp || item.createdAt)}</p>
                <p className="text-sm font-medium text-white/80">{item.title || item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
