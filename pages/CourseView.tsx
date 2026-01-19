
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course, Lesson, ContentBlock } from '../types';
import { ICONS } from '../constants';

// @ts-ignore
const marked = window.marked;

const MarkdownView = ({ content }: { content: string }) => {
  if (typeof marked === 'undefined') return <div className="text-slate-400 italic">Chargement du contenu...</div>;
  const html = marked.parse(content || '');
  return <div className="prose max-w-none prose-indigo" dangerouslySetInnerHTML={{ __html: html }} />;
};

interface CourseViewProps {
  courses: Course[];
}

const CourseView: React.FC<CourseViewProps> = ({ courses }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const course = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  
  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.modules.flatMap(m => m.lessons);
  }, [course]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(allLessons[0]?.id || null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showSignup, setShowSignup] = useState(true);
  const [email, setEmail] = useState('');

  if (!course) return (
    <div className="h-screen flex items-center justify-center bg-white p-10 text-center">
      <div className="space-y-6">
        <h1 className="text-4xl font-black text-slate-950">Cours introuvable</h1>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-primary text-white rounded-full font-bold">Retour à l'accueil</button>
      </div>
    </div>
  );

  const activeLesson = allLessons.find(l => l.id === activeLessonId);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsEnrolled(true);
      setShowSignup(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fdfdff] overflow-hidden font-sans">
      {/* Overlay d'inscription style "Gated Content" */}
      {showSignup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 backdrop-blur-2xl p-6 animate-fade-in">
          <div className="bg-white rounded-[4rem] p-16 max-w-lg w-full shadow-premium-lg border border-black/5 animate-scale-up text-center">
            <div className="w-24 h-24 bg-primary-soft rounded-[2.5rem] flex items-center justify-center text-primary mx-auto mb-10 shadow-indigo-glow animate-float">
              <ICONS.Sparkles />
            </div>
            <h2 className="text-4xl font-black text-slate-950 mb-4 tracking-tighter leading-none">Accès à la formation</h2>
            <p className="text-xl text-slate-400 font-medium mb-10 leading-relaxed">
              Inscrivez-vous gratuitement pour débloquer l'accès complet aux modules de <strong>{course.title}</strong>.
            </p>
            <form onSubmit={handleSignup} className="space-y-4">
              <input 
                type="email" 
                required
                placeholder="Votre adresse email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-8 py-6 rounded-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-[12px] focus:ring-primary/5 outline-none transition-all text-lg font-bold shadow-inner"
              />
              <button 
                type="submit"
                className="w-full py-6 rounded-full bg-slate-950 text-white font-black text-xl hover:bg-primary transition-all shadow-xl active:scale-95"
              >
                Rejoindre le Studio
              </button>
            </form>
            <p className="mt-8 text-xs font-bold text-slate-300 uppercase tracking-widest">Mastery Chapter Platform</p>
          </div>
        </div>
      )}

      {/* Sidebar de navigation étudiant */}
      <aside className="w-80 lg:w-[400px] border-r border-black/[0.04] flex flex-col bg-white h-full shadow-2xl z-20">
        <div className="p-10 pb-8 flex flex-col gap-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
              <div>
                <h3 className="font-black text-slate-950 tracking-tight leading-none">Academy</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">E-Learning Elite</p>
              </div>
           </div>
           <div className="h-px bg-slate-100" />
           <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight line-clamp-2">{course.title}</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar space-y-10">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id} className="space-y-4">
              <div className="flex items-center gap-3 px-4">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Module {mIdx + 1}</span>
                <div className="flex-1 h-px bg-slate-100/50" />
              </div>
              <div className="space-y-3">
                {mod.lessons.map(les => (
                  <button
                    key={les.id}
                    onClick={() => setActiveLessonId(les.id)}
                    className={`w-full text-left p-5 rounded-[2.2rem] transition-all border group relative overflow-hidden flex items-center gap-4 ${
                      activeLessonId === les.id 
                        ? 'bg-slate-950 text-white shadow-xl border-slate-950' 
                        : 'bg-slate-50/50 text-slate-500 border-transparent hover:bg-white hover:border-primary/20 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${activeLessonId === les.id ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
                    <span className="font-bold text-base tracking-tight truncate">{les.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-8 border-t border-slate-100">
           <div className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-primary">S</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Apprenant</p>
                <p className="text-sm font-bold text-slate-900 truncate">{email || 'Utilisateur invité'}</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Zone de lecture du contenu */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
        <div className="max-w-5xl mx-auto py-24 px-16 pb-40">
          {activeLesson ? (
            <div className="space-y-16 animate-fade-in">
              <header className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="px-5 py-2 rounded-full bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] border border-emerald-100">Accès Débloqué</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <h2 className="text-7xl font-black text-slate-950 tracking-tightest leading-tight">{activeLesson.title}</h2>
                <p className="text-2xl text-slate-400 font-medium leading-relaxed">{activeLesson.description}</p>
              </header>

              <div className="space-y-16">
                {activeLesson.blocks.map((block) => (
                  <div key={block.id} className="bg-white rounded-[5rem] border border-black/[0.03] shadow-premium p-12 lg:p-20">
                    {block.type === 'video' ? (
                      <div className="aspect-video bg-slate-950 rounded-[4rem] overflow-hidden shadow-2xl relative border-8 border-white group">
                         {block.value.includes('youtube.com') || block.value.includes('youtu.be') ? (
                           <iframe 
                             className="w-full h-full"
                             src={block.value.replace('watch?v=', 'embed/')} 
                             frameBorder="0"
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                             allowFullScreen
                           />
                         ) : (
                           <div className="absolute inset-0 flex items-center justify-center text-white/20">
                              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                                <ICONS.Video />
                              </div>
                           </div>
                         )}
                      </div>
                    ) : block.type === 'quiz' ? (
                      <div className="space-y-12">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[2rem] bg-primary text-white flex items-center justify-center shadow-indigo-glow"><ICONS.Sparkles /></div>
                            <h3 className="text-4xl font-black text-slate-950 tracking-tighter">Testez votre maîtrise</h3>
                         </div>
                         <div className="space-y-10">
                            {block.metadata?.questions?.map((q, qIdx) => (
                               <div key={q.id} className="p-12 bg-slate-50/50 rounded-[4rem] border border-black/[0.01] space-y-8">
                                  <p className="text-3xl font-black text-slate-950 tracking-tight leading-snug">
                                    <span className="text-primary mr-3 italic">#{qIdx + 1}</span> {q.question}
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {q.options.map((opt, oIdx) => (
                                        <button key={oIdx} className="p-8 text-left rounded-[2.5rem] bg-white border border-black/[0.03] text-lg font-bold text-slate-600 hover:border-primary hover:text-primary hover:shadow-lg transition-all active:scale-95">
                                          {opt}
                                        </button>
                                     ))}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                    ) : (
                      <MarkdownView content={block.value} />
                    )}
                  </div>
                ))}

                {activeLesson.blocks.length === 0 && (
                  <div className="py-40 text-center border-4 border-dashed border-slate-100 rounded-[6rem] bg-slate-50/30">
                    <p className="text-2xl text-slate-300 font-bold italic">Le contenu de cette leçon arrive bientôt...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-12">
              <div className="w-48 h-48 bg-white rounded-full shadow-premium flex items-center justify-center text-primary animate-pulse border border-black/[0.01]">
                <ICONS.Sparkles />
              </div>
              <h2 className="text-5xl font-black text-slate-950 tracking-tighter">Choisissez votre premier chapitre</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseView;
