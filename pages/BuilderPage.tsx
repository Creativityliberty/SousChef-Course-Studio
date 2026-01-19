
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course, Module, Lesson, ContentBlock, ContentType, QuizQuestion } from '../types';
import { ICONS } from '../constants';
import { THEME } from '../constants/theme';
import { generateLessonContent, generateQuiz } from '../services/geminiService';

// @ts-ignore
const marked = window.marked;

const MarkdownView = ({ content }: { content: string }) => {
  if (typeof marked === 'undefined') return <div className="text-slate-400 italic">Chargement...</div>;
  const html = marked.parse(content || '');
  return <div className="prose max-w-none prose-indigo" dangerouslySetInnerHTML={{ __html: html }} />;
};

interface BuilderPageProps {
  courses: Course[];
  onUpdateCourse: (course: Course) => void;
}

const BuilderPage: React.FC<BuilderPageProps> = ({ courses, onUpdateCourse }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const course = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuizGenerating, setIsQuizGenerating] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [activeError, setActiveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!course) return <div className="p-20 text-center font-bold text-slate-400">Cours introuvable.</div>;

  const activeLesson = course.modules.flatMap(m => m.lessons).find(l => l.id === activeLessonId);

  const handleUpdateCourse = (updates: Partial<Course>) => {
    onUpdateCourse({ ...course, ...updates });
  };

  const handleUpdateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    const newModules = course.modules.map(m => ({
      ...m,
      lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
    }));
    handleUpdateCourse({ modules: newModules });
  };

  const addModule = () => {
    const newModule: Module = { id: `m-${Date.now()}`, title: 'Nouveau Module', lessons: [] };
    handleUpdateCourse({ modules: [...course.modules, newModule] });
  };

  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `l-${Date.now()}`,
      title: 'Nouvelle Leçon',
      description: 'Résumé de la leçon...',
      blocks: [],
      isDraft: true
    };
    const newModules = course.modules.map(m => 
      m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
    );
    handleUpdateCourse({ modules: newModules });
    setActiveLessonId(newLesson.id);
  };

  const addContentBlock = (lessonId: string, type: ContentType, value = "", metadata = {}) => {
    const newBlock: ContentBlock = { id: `b-${Date.now()}`, type, value, metadata };
    const newModules = course.modules.map(m => ({
      ...m,
      lessons: m.lessons.map(l => l.id === lessonId ? { ...l, blocks: [...l.blocks, newBlock] } : l)
    }));
    handleUpdateCourse({ modules: newModules });
    if (type === 'text') setEditingBlockId(newBlock.id);
  };

  const handleMagicContent = async () => {
    if (!activeLesson) return;
    setIsGenerating(true);
    setActiveError(null);
    const result = await generateLessonContent(activeLesson.title, course.title);
    if (result.error) {
      setActiveError(result.error);
    } else {
      addContentBlock(activeLesson.id, 'text', result.data || "");
    }
    setIsGenerating(false);
  };

  const handleMagicQuiz = async () => {
    if (!activeLesson) return;
    setIsQuizGenerating(true);
    setActiveError(null);
    const contentText = activeLesson.blocks.filter(b => b.type === 'text').map(b => b.value).join('\n');
    const result = await generateQuiz(activeLesson.title, contentText || activeLesson.description);
    if (result.error) {
      setActiveError(result.error);
    } else if (result.data) {
      addContentBlock(activeLesson.id, 'quiz', JSON.stringify(result.data), { questions: result.data });
    }
    setIsQuizGenerating(false);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#/view/${course.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* 🏛️ SIDEBAR STUDIO */}
      <div className="w-80 lg:w-[450px] border-r border-black/[0.04] flex flex-col bg-slate-50/50 h-full shadow-2xl z-20">
        <div className="p-12 pb-8 flex flex-col gap-10">
          <div className="flex items-center justify-between">
             <button onClick={() => navigate('/')} className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-100 flex items-center justify-center transition-all border border-black/[0.05] shadow-sm">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
             </button>
             <h2 className="font-black text-slate-950 tracking-tighter text-2xl">Studio</h2>
             <button onClick={addModule} className="w-14 h-14 rounded-2xl bg-primary text-white hover:scale-110 shadow-glow flex items-center justify-center">
                <ICONS.Plus />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 pt-2 custom-scrollbar space-y-12">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id} className="space-y-6">
              <div className="flex items-center gap-5 px-4">
                 <span className="w-9 h-9 rounded-2xl bg-slate-950 flex items-center justify-center text-[12px] font-black text-white shadow-lg">{mIdx + 1}</span>
                 <input 
                    className="flex-1 text-[13px] font-bold text-slate-900 uppercase tracking-widest bg-transparent border-none outline-none focus:text-primary transition-colors"
                    value={mod.title}
                    onChange={(e) => {
                      const newModules = course.modules.map(m => m.id === mod.id ? { ...m, title: e.target.value } : m);
                      handleUpdateCourse({ modules: newModules });
                    }}
                  />
              </div>
              <div className="space-y-4">
                {mod.lessons.map(les => (
                  <button
                    key={les.id}
                    onClick={() => { setActiveLessonId(les.id); setActiveError(null); }}
                    className={`w-full text-left p-7 rounded-[2.5rem] transition-all border ${
                      activeLessonId === les.id ? 'bg-white shadow-xl border-primary ring-4 ring-primary/5' : 'bg-white/40 border-transparent hover:bg-white'
                    }`}
                  >
                    <span className="font-bold text-lg tracking-tight truncate block">{les.title}</span>
                  </button>
                ))}
                <button onClick={() => addLesson(mod.id)} className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:text-primary transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 bg-white/30">
                  <ICONS.Plus /> Ajouter un chapitre
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🎨 ZONE D'ÉDITION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#FAFBFF]">
        {/* BARRE D'ACTIONS TOP */}
        <div className="sticky top-0 z-40 p-10 flex justify-end gap-4 pointer-events-none">
            <button 
              onClick={() => window.open(`#/view/${course.id}`, '_blank')}
              className="pointer-events-auto px-8 py-4 rounded-full bg-white border border-black/5 shadow-premium-lg font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Aperçu Étudiant
            </button>
            <button 
              onClick={handleShare}
              className={`pointer-events-auto px-8 py-4 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-glow ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white hover:bg-primary'}`}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              {copied ? 'Lien copié !' : 'Partager'}
            </button>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="max-w-5xl mx-auto py-20 px-16 pb-80">
          {activeLesson ? (
            <div className="space-y-20 animate-fade-in">
              <header className="space-y-12">
                 <div className="flex items-center gap-4">
                    <span className="w-2 h-10 bg-primary rounded-full"></span>
                    <h2 className="text-primary font-black text-xs uppercase tracking-[0.4em]">Modification du Chapitre</h2>
                 </div>
                 <div className="space-y-6">
                    <input 
                      className="w-full text-7xl lg:text-8xl font-black text-slate-950 bg-transparent outline-none tracking-tightest leading-tight"
                      value={activeLesson.title}
                      onChange={(e) => handleUpdateLesson(activeLesson.id, { title: e.target.value })}
                    />
                    <textarea 
                      className="w-full text-3xl text-slate-400 font-medium bg-transparent outline-none border-none resize-none leading-relaxed"
                      value={activeLesson.description}
                      onChange={(e) => handleUpdateLesson(activeLesson.id, { description: e.target.value })}
                      rows={2}
                    />
                 </div>
              </header>

              {/* BLOCKS CONTENT */}
              <div className="space-y-16">
                 {activeLesson.blocks.map((block) => (
                    <div key={block.id} className="group relative bg-white rounded-[5rem] border border-black/[0.03] shadow-premium p-16 hover:shadow-premiumLg transition-all duration-700">
                       <div className="absolute -top-6 left-16 px-10 py-3 bg-white border border-black/5 rounded-full text-[11px] font-black text-slate-400 uppercase tracking-widest shadow-md">
                          {block.type}
                       </div>
                       
                       {block.type === 'video' ? (
                          <input 
                            placeholder="Lien YouTube..." 
                            className="w-full bg-slate-50 border border-slate-100 rounded-full px-12 py-8 font-bold text-2xl outline-none focus:bg-white transition-all shadow-inner"
                            value={block.value}
                            onChange={(e) => {
                               const newBlocks = activeLesson.blocks.map(b => b.id === block.id ? { ...b, value: e.target.value } : b);
                               handleUpdateLesson(activeLesson.id, { blocks: newBlocks });
                            }}
                          />
                       ) : block.type === 'text' ? (
                          <div onClick={() => setEditingBlockId(block.id)} className="cursor-text min-h-[200px]">
                             {editingBlockId === block.id ? (
                                <textarea 
                                  autoFocus 
                                  onBlur={() => setEditingBlockId(null)}
                                  className="w-full min-h-[400px] text-2xl text-slate-800 bg-transparent outline-none border-none resize-none"
                                  value={block.value}
                                  onChange={(e) => {
                                     const newBlocks = activeLesson.blocks.map(b => b.id === block.id ? { ...b, value: e.target.value } : b);
                                     handleUpdateLesson(activeLesson.id, { blocks: newBlocks });
                                  }}
                                />
                             ) : (
                                <MarkdownView content={block.value || "*Cliquez pour écrire...*"} />
                             )}
                          </div>
                       ) : (
                          <div className="text-xl font-bold p-10 bg-slate-50 rounded-[4rem]">Quiz généré avec succès.</div>
                       )}

                       <button 
                        onClick={() => {
                           const newBlocks = activeLesson.blocks.filter(b => b.id !== block.id);
                           handleUpdateLesson(activeLesson.id, { blocks: newBlocks });
                        }}
                        className="absolute top-12 right-12 w-14 h-14 rounded-full text-slate-300 hover:text-white hover:bg-rose-500 flex items-center justify-center bg-white shadow-md transition-all"
                       >
                          <ICONS.Trash />
                       </button>
                    </div>
                 ))}
              </div>
            </div>
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-12">
               <div className="w-56 h-56 bg-white rounded-[5rem] shadow-premium-lg flex items-center justify-center text-primary border border-black/[0.02]">
                 <div className="w-28 h-28 rounded-full border-[12px] border-primary/5 border-t-primary animate-spin" />
              </div>
              <h2 className="text-7xl font-black text-slate-950 tracking-tighter">Studio Créatif</h2>
            </div>
          )}
        </div>

        {/* PILOTE IA BAR */}
        {activeLesson && (
          <div className="fixed bottom-14 left-[calc(50%+225px)] -translate-x-1/2 z-[100] glass bg-white/95 p-4 rounded-full border border-black/5 shadow-premiumLg flex items-center gap-4 animate-scale-up">
            <button 
              onClick={handleMagicContent}
              disabled={isGenerating}
              className="px-10 py-6 rounded-full bg-slate-950 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-primary transition-all shadow-lg"
            >
              {isGenerating ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ICONS.Sparkles />}
              Magie Contenu
            </button>
            <button 
              onClick={handleMagicQuiz}
              disabled={isQuizGenerating}
              className="px-10 py-6 rounded-full bg-primary-soft text-primary font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-primary hover:text-white transition-all border border-primary/10"
            >
              {isQuizGenerating ? <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <ICONS.Sparkles />}
              Quiz IA
            </button>
            <div className="w-px h-10 bg-slate-200 mx-2" />
            <button onClick={() => addContentBlock(activeLesson.id, 'video')} className="w-14 h-14 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><ICONS.Video /></button>
            <button onClick={() => addContentBlock(activeLesson.id, 'text')} className="w-14 h-14 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400"><ICONS.Text /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuilderPage;
