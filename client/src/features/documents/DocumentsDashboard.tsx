import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, Trash2, Save, Clock, User, ChevronRight, FileEdit, FileCode } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useUIStore } from '../../store/useUIStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { cn, formatDate } from '../../lib/utils';
import { Document } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

export function DocumentsDashboard() {
  const { documents, activeWorkspace, userRole } = useWorkspaceStore();
  const { setModal } = useUIStore();
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeDoc) {
      setContent(activeDoc.content);
    }
  }, [activeDoc]);

  const handleSave = async () => {
    console.log('[Trace][UI][DocumentsDashboard] save click', { docId: activeDoc?.id, workspaceId: activeWorkspace?.id, contentLength: content.length });
    if (!activeDoc || !activeWorkspace) {
      console.warn('[Breakpoint][Flow][DocumentsDashboard] save blocked by guard', { hasActiveDoc: !!activeDoc, hasWorkspace: !!activeWorkspace });
      return;
    }
    setIsSaving(true);
    const path = `workspaces/${activeWorkspace.id}/documents/${activeDoc.id}`;
    try {
      console.log('[Trace][API][Firestore] saveDocument update start', { path });
      await updateDoc(doc(db, path), {
        content,
        updatedAt: Date.now()
      });
      console.log('[Trace][API][Firestore] saveDocument update success', { path });
      setIsSaving(false);
    } catch (error) {
      console.error('[Trace][API][Firestore] saveDocument update error', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      console.error('Error saving document:', error);
      setIsSaving(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    console.log('[Trace][UI][DocumentsDashboard] deleteDoc click', { docId, userRole, workspaceId: activeWorkspace?.id });
    if (!activeWorkspace || userRole !== 'admin') {
      console.warn('[Breakpoint][Flow][DocumentsDashboard] deleteDoc blocked by guard', { hasWorkspace: !!activeWorkspace, userRole });
      return;
    }
    const path = `workspaces/${activeWorkspace.id}/documents/${docId}`;
    try {
      console.log('[Trace][API][Firestore] deleteDocument start', { path });
      await deleteDoc(doc(db, path));
      console.log('[Trace][API][Firestore] deleteDocument success', { path });
      if (activeDoc?.id === docId) setActiveDoc(null);
    } catch (error) {
      console.error('[Trace][API][Firestore] deleteDocument error', error);
      handleFirestoreError(error, OperationType.DELETE, path);
      console.error('Error deleting document:', error);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex p-6 gap-6 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 h-full flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-music-red" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Documents</h3>
          </div>
          <button 
            onClick={() => setModal({ type: 'createDocument' })}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-ios-light bg-white/5 border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-music-red/30 transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group btn-press",
                activeDoc?.id === doc.id 
                  ? "glass-ios bg-white/10 text-white shadow-lg" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                activeDoc?.id === doc.id ? "bg-music-red/20 text-music-red" : "bg-white/5 text-white/20 group-hover:text-white/40"
              )}>
                <FileCode className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold truncate">{doc.title}</p>
                <p className="text-[10px] text-white/30 font-medium">{formatDate(doc.updatedAt)}</p>
              </div>
              {userRole === 'admin' && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDoc(doc.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteDoc(doc.id);
                    }
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                  aria-label="Delete document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          ))}
          
          {filteredDocs.length === 0 && (
            <div className="text-center py-12 opacity-20">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">No documents</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 h-full flex flex-col gap-6">
        {activeDoc ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col gap-6"
          >
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-music-red/20 flex items-center justify-center text-music-red">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{activeDoc.title}</h2>
                  <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    <span>Last edited {formatDate(activeDoc.updatedAt)}</span>
                  </div>
                </div>
              </div>
              <GlassButton 
                onClick={handleSave}
                disabled={isSaving || content === activeDoc.content}
                className="flex items-center gap-2"
              >
                <Save className={cn("w-4 h-4", isSaving && "animate-spin")} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </GlassButton>
            </div>

            <GlassCard className="flex-1 p-0 overflow-hidden border-white/5">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your document in Markdown..."
                className="w-full h-full bg-transparent p-8 text-sm leading-relaxed text-white/80 placeholder:text-white/20 focus:outline-none resize-none custom-scrollbar"
              />
            </GlassCard>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center opacity-20">
            <div className="text-center">
              <FileText className="w-24 h-24 mx-auto mb-6" />
              <h2 className="text-2xl font-bold tracking-tight">Select a document</h2>
              <p className="text-sm">Choose a file from the sidebar to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
