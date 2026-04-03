import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Clock, MessageSquare } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeDiscussion } from '../../services/gemini';
import { cn, formatDate } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

export function ChatDashboard() {
  const { user } = useAuthStore();
  const { activeWorkspace, messages, setDecisions, setRisks, setTasks } = useWorkspaceStore();
  const [newMessage, setNewMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeWorkspace || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    const path = `workspaces/${activeWorkspace.id}/messages`;

    try {
      await addDoc(collection(db, path), {
        text: messageText,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        timestamp: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      console.error('Error sending message:', error);
    }
  };

  const handleAnalyze = async () => {
    if (messages.length === 0 || !activeWorkspace) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDiscussion(messages.slice(-20));
      
      // Save analysis results to Firestore
      for (const task of analysis.tasks) {
        const path = `workspaces/${activeWorkspace.id}/tasks`;
        try {
          await addDoc(collection(db, path), {
            ...task,
            status: 'backlog',
            createdAt: Date.now()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, path);
        }
      }
      for (const decision of analysis.decisions) {
        const path = `workspaces/${activeWorkspace.id}/decisions`;
        try {
          await addDoc(collection(db, path), {
            text: decision,
            timestamp: Date.now()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, path);
        }
      }
      for (const risk of analysis.risks) {
        const path = `workspaces/${activeWorkspace.id}/risks`;
        try {
          await addDoc(collection(db, path), {
            text: risk,
            timestamp: Date.now()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, path);
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 relative">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg: any, idx) => {
            const isMe = msg.userId === user?.uid;
            const showAvatar = idx === 0 || messages[idx - 1].userId !== msg.userId;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-end gap-3",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                {showAvatar ? (
                  <img 
                    src={msg.userPhoto || `https://ui-avatars.com/api/?name=${msg.userName}`} 
                    className="w-8 h-8 rounded-full border border-white/10 shadow-lg"
                    alt={msg.userName}
                  />
                ) : (
                  <div className="w-8" />
                )}
                
                <div className={cn(
                  "flex flex-col max-w-[70%]",
                  isMe ? "items-end" : "items-start"
                )}>
                  {showAvatar && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 px-1">
                      {msg.userName} • {formatDate(msg.timestamp)}
                    </span>
                  )}
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg",
                    isMe 
                      ? "bg-gradient-to-br from-music-red to-music-purple text-white rounded-br-none" 
                      : "glass-ios-light text-white rounded-bl-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="relative">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <GlassInput
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-12 py-3.5 rounded-2xl"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-music-red hover:text-white transition-colors disabled:opacity-30"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <GlassButton 
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || messages.length === 0}
            className="flex items-center gap-2 h-[46px]"
          >
            <Sparkles className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
            <span className="hidden sm:inline">AI Analysis</span>
          </GlassButton>
        </form>
      </div>

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4" />
            <p className="text-xl font-bold tracking-tight">Start a discussion</p>
            <p className="text-sm">Messages will appear here in real-time</p>
          </div>
        </div>
      )}
    </div>
  );
}
