
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course, Module, Lesson, ContentBlock, ContentType, QuizQuestion } from '../types';
import { ICONS } from '../constants';
import { generateLessonContent, generateQuiz } from '../services/geminiService';

// @ts-ignore
const marked = window.marked;

const MarkdownView = ({ content }: { content: string }) => {
  if (typeof marked === 'undefined') return <div className="text-slate-400 italic">Chargement du moteur de rendu...</div>;
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
      addContentBlock(activeLesson.id, 'text', result.data || "Contenu généré.");
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
    } else if (result.data && result.data.length > 0) {
      addContentBlock(activeLesson.id, 'quiz', JSON.stringify(result.data), { questions: result.data });
    }
    setIsQuizGenerating(false);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Sidebar de navigation du cours */}
      <div className="w-80 lg:w-[450px] border-r border-black/[0.04] flex flex-col bg-slate-50/50 h-full shadow-2xl z-20">
        <div className="p-12 pb-8 flex flex-col gap-10">
          <div className="flex items-center justify-between">
             <button onClick={() => navigate('/')} className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-100 flex items-center justify-center transition-all border border-black/[0.05] shadow-sm">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
             </button>
             <div className="text-center">
                <h2 className="font-black text-slate-950 tracking-tighter text-2xl leading-none">Studio</h2>
                <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mt-2">Architecture</p>
             </div>
             <button onClick={addModule} className="w-14 h-14 rounded-2xl bg-primary text-white hover:rotate-90 hover:scale-110 transition-all shadow-indigo-glow flex items-center justify-center">
                <ICONS.Plus />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 pt-2 custom-scrollbar space-y-12">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id} className="space-y-6 animate-fade-in">
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
                    className={`w-full text-left p-7 rounded-[2.5rem] transition-all border group relative overflow-hidden flex items-center gap-6 ${
                      activeLessonId === les.id 
                        ? 'bg-white shadow-xl border-primary ring-4 ring-primary/5' 
                        : 'bg-white/40 text-slate-500 border-black/[0.02] hover:bg-white hover:border-primary/20 hover:shadow-lg'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${les.isDraft ? 'bg-amber-400' : 'bg-emerald-400'} shadow-md`} />
                    <span className={`font-bold text-lg tracking-tight truncate ${activeLessonId === les.id ? 'text-slate-950' : ''}`}>{les.title}</span>
                  </button>
                ))}
                <button 
                  onClick={() => addLesson(mod.id)}
                  className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 bg-white/30"
                >
                  <ICONS.Plus /> Ajouter un chapitre
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Surface de travail de l'éditeur */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#FAFBFF]">
        {/* Barre d'erreurs persistante */}
        {activeError && (
          <div className="sticky top-10 left-0 right-0 z-[110] px-16 animate-fade-in">
            <div className="max-w-3xl mx-auto bg-rose-50 border border-rose-200 p-8 rounded-[3.5rem] shadow-2xl flex items-center justify-between backdrop-blur-md">
               <div className="flex items-center gap-6 text-rose-800">
                  <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0 text-xl font-black">!</div>
                  <div className="space-y-1">
                    <p className="font-black text-xs uppercase tracking-widest opacity-60">Erreur Serveur</p>
                    <p className="font-bold text-base leading-snug">{activeError}</p>
                  </div>
               </div>
               <button onClick={() => setActiveError(null)} className="text-rose-400 hover:text-rose-950 font-black p-4 transition-colors">✕</button>
            </div>
          </div>
        )}

        {/* Pilote Automatique (Floating Bar) */}
        {activeLesson && (
          <div className="fixed bottom-14 left-[calc(50%+225px)] -translate-x-1/2 z-[100] glass bg-white/95 p-4 rounded-full border border-black/[0.05] shadow-premium-lg flex items-center gap-4 animate-scale-up">
            <button 
              onClick={handleMagicContent}
              disabled={isGenerating}
              className="px-10 py-6 rounded-full bg-slate-950 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-primary transition-all disabled:opacity-40 group shadow-lg"
            >
              {isGenerating ? <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" /> : <ICONS.Sparkles className="group-hover:rotate-12 transition-transform" />}
              {isGenerating ? 'Rédaction...' : 'Générer la Leçon'}
            </button>
            <button 
              onClick={handleMagicQuiz}
              disabled={isQuizGenerating}
              className="px-10 py-6 rounded-full bg-primary-soft text-primary font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-primary hover:text-white transition-all disabled:opacity-40 group border border-primary/10"
            >
              {isQuizGenerating ? <div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" /> : <ICONS.Sparkles className="group-hover:rotate-12 transition-transform" />}
              {isQuizGenerating ? 'Analyse...' : 'Générer Quiz'}
            </button>
            <div className="w-[1px] h-12 bg-slate-200 mx-1" />
            <button onClick={() => addContentBlock(activeLesson.id!, 'video')} className="w-16 h-16 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-all"><ICONS.Video /></button>
            <button onClick={() => addContentBlock(activeLesson.id!, 'text')} className="w-16 h-16 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-all"><ICONS.Text /></button>
          </div>
        )}

        <div className="max-w-5xl mx-auto py-32 px-16 pb-80">
          {activeLesson ? (
            <div className="space-y-24 animate-fade-in">
              <header className="space-y-12">
                <div className="flex items-center gap-8">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-10 bg-primary rounded-full" />
                      <span className="text-primary font-black text-xs uppercase tracking-[0.4em]">Zone d'Édition</span>
                   </div>
                   <div className="flex-1 h-px bg-slate-100" />
                   <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Status:</span>
                      <button 
                        onClick={() => handleUpdateLesson(activeLesson.id, { isDraft: !activeLesson.isDraft })}
                        className={`px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-sm transition-all ${activeLesson.isDraft ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}
                      >
                        {activeLesson.isDraft ? 'Brouillon' : 'Finalisé'}
                      </button>
                   </div>
                </div>
                <div className="space-y-6">
                  <input 
                    type="text" 
                    value={activeLesson.title}
                    onChange={(e) => handleUpdateLesson(activeLesson.id, { title: e.target.value })}
                    className="w-full text-7xl lg:text-8xl font-black text-slate-950 bg-transparent outline-none focus:text-primary transition-colors border-none p-0 tracking-tightest leading-[1.1]"
                    placeholder="Titre de la leçon..."
                  />
                  <textarea 
                    value={activeLesson.description}
                    onChange={(e) => handleUpdateLesson(activeLesson.id, { description: e.target.value })}
                    className="w-full text-3xl text-slate-400 font-medium bg-transparent outline-none border-none resize-none p-0 leading-relaxed placeholder:text-slate-100"
                    rows={2}
                    placeholder="Partagez l'essence de cette leçon..."
                  />
                </div>
              </header>

              <div className="space-y-20">
                {activeLesson.blocks.map((block) => (
                  <div key={block.id} className="group relative bg-white rounded-[5rem] border border-black/[0.03] shadow-premium p-20 hover:shadow-premium-lg transition-all duration-1000 animate-scale-up">
                    <div className="absolute -top-6 left-16 px-10 py-3 bg-white border border-black/[0.05] rounded-full text-[11px] font-black text-slate-400 uppercase tracking-widest shadow-md">
                      Contenu {block.type}
                    </div>
                    
                    <div className="relative">
                      {block.type === 'video' ? (
                        <div className="space-y-12">
                          <input 
                            type="text" 
                            placeholder="Lien vers votre ressource vidéo..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-full px-12 py-8 font-bold text-slate-950 outline-none focus:bg-white focus:ring-[20px] focus:ring-primary/5 focus:border-primary/40 transition-all text-2xl shadow-inner"
                            value={block.value}
                            onChange={(e) => {
                              const newBlocks = activeLesson.blocks.map(b => b.id === block.id ? { ...b, value: e.target.value } : b);
                              handleUpdateLesson(activeLesson.id, { blocks: newBlocks });
                            }}
                          />
                          {block.value && (
                            <div className="aspect-video bg-slate-950 rounded-[4.5rem] overflow-hidden shadow-2xl relative group/video border-8 border-white">
                               <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-slate-900/80 flex items-center justify-center">
                                  <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-2xl flex items-center justify-center text-white scale-100 group-hover:scale-110 transition-transform duration-700">
                                     <ICONS.Video />
                                  </div>
                               </div>
                            </div>
                          )}
                        </div>
                      ) : block.type === 'quiz' ? (
                        <div className="space-y-16">
                          <div className="flex items-center gap-6">
                             <div className="p-5 bg-amber-100 text-amber-600 rounded-3xl shadow-sm"><ICONS.Sparkles /></div>
                             <h4 className="text-5xl font-black text-slate-950 tracking-tighter">Test de Maîtrise</h4>
                          </div>
                          <div className="space-y-12">
                             {block.metadata?.questions?.map((q: QuizQuestion, qIdx: number) => (
                                <div key={q.id} className="p-16 bg-slate-50/50 rounded-[4rem] border border-black/[0.01] space-y-12">
                                   <div className="flex gap-8">
                                      <span className="w-14 h-14 rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-xl shadow-2xl">{qIdx + 1}</span>
                                      <p className="flex-1 text-3xl font-black text-slate-950 tracking-tight leading-tight">{q.question}</p>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {q.options.map((opt, oIdx) => (
                                         <div key={oIdx} className={`p-10 rounded-[3rem] text-lg font-bold border transition-all duration-500 ${oIdx === q.correctAnswer ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xl shadow-emerald-500/30' : 'bg-white border-slate-200 text-slate-500'}`}>
                                            {opt}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             ))}
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          {editingBlockId === block.id ? (
                            <textarea 
                              autoFocus
                              className="w-full min-h-[500px] text-2xl text-slate-800 font-medium leading-relaxed bg-transparent outline-none border-none resize-none p-0 custom-scrollbar"
                              value={block.value}
                              onBlur={() => setEditingBlockId(null)}
                              onChange={(e) => {
                                const newBlocks = activeLesson.blocks.map(b => b.id === block.id ? { ...b, value: e.target.value } : b);
                                handleUpdateLesson(activeLesson.id, { blocks: newBlocks });
                              }}
                              placeholder="Votre savoir mérite d'être partagé..."
                            />
                          ) : (
                            <div 
                              onClick={() => setEditingBlockId(block.id)}
                              className="cursor-text min-h-[300px] hover:bg-slate-50/50 rounded-[3rem] p-4 transition-all duration-700"
                            >
                              <MarkdownView content={block.value || "*Cliquez pour rédiger votre contenu d'expert...*"} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        const newBlocks = activeLesson.blocks.filter(b => b.id !== block.id);
                        handleUpdateLesson(activeLesson.id, { blocks: newBlocks });
                      }}
                      className="absolute top-12 right-12 w-16 h-16 rounded-full text-slate-300 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all duration-500 flex items-center justify-center bg-white border border-black/[0.03] shadow-lg"
                    >
                      <ICONS.Trash />
                    </button>
                  </div>
                ))}

                {activeLesson.blocks.length === 0 && (
                  <div className="py-72 text-center border-4 border-dashed border-slate-200 rounded-[6rem] bg-white/20 flex flex-col items-center justify-center space-y-12">
                    <div className="w-32 h-32 bg-primary-soft rounded-full flex items-center justify-center text-primary animate-pulse border-2 border-primary/20">
                      <ICONS.Sparkles />
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-5xl font-black text-slate-950 tracking-tighter">Prêt pour l'Impact ?</h3>
                      <p className="text-2xl text-slate-400 font-medium px-24 max-w-2xl leading-relaxed mx-auto">Générez du contenu magistral ou des quiz de validation en un clic avec votre copilote IA.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[80vh] flex flex-col items-center justify-center text-center space-y-16">
              <div className="w-56 h-56 bg-white rounded-[5rem] shadow-premium-lg flex items-center justify-center text-primary border border-black/[0.02]">
                 <div className="w-28 h-28 rounded-full border-[12px] border-primary/5 border-t-primary animate-spin" />
              </div>
              <div className="space-y-6">
                <h2 className="text-7xl font-black text-slate-950 tracking-tighter">Studio Créatif</h2>
                <p className="text-2xl text-slate-300 max-w-lg font-medium leading-relaxed mx-auto">Sélectionnez un chapitre dans la structure à gauche pour sculpter votre savoir.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;
