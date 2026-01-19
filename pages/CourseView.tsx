
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course, Lesson, ContentBlock } from '../types';
import { ICONS } from '../constants';
import { THEME } from '../constants/theme';

// @ts-ignore
const marked = window.marked;

const MarkdownView = ({ content }: { content: string }) => {
  if (typeof marked === 'undefined') return <div className="text-slate-400">Chargement...</div>;
  const html = marked.parse(content || '');
  return <div className="prose max-w-none prose-indigo" dangerouslySetInnerHTML={{ __html: html }} />;
};

const CourseView: React.FC<{ courses: Course[] }> = ({ courses }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const course = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  
  const allLessons = useMemo(() => course?.modules.flatMap(m => m.lessons) || [], [course]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(allLessons[0]?.id || null);
  const [showGate, setShowGate] = useState(true);

  if (!course) return <div className="p-20 text-center font-bold">Cours non trouvé.</div>;

  const activeLesson = allLessons.find(l => l.id === activeLessonId);

  return (
    <div className="flex h-screen w-full bg-[#fcfdff] overflow-hidden font-sans">
      {/* 🔐 BARRIÈRE D'INSCRIPTION (GATED CONTENT) */}
      {showGate && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/40 backdrop-blur-2xl p-6">
          <div className="bg-white rounded-[4rem] p-16 max-w-xl w-full shadow-2xl text-center border border-black/5 animate-scale-up">
            <div className="w-24 h-24 bg-primary-soft rounded-[2.5rem] flex items-center justify-center text-primary mx-auto mb-10 shadow-indigo-glow">
              <ICONS.Sparkles />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">Accès VIP : {course.title}</h2>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              Inscrivez-vous pour débloquer votre accès illimité et commencer votre transformation.
            </p>
            <div className="space-y-4">
              <input type="email" placeholder="votre@email.com" className="w-full px-8 py-6 rounded-full bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 text-lg font-bold transition-all" />
              <button 
                onClick={() => setShowGate(false)}
                className="w-full py-6 rounded-full bg-slate-950 text-white font-black text-xl hover:bg-primary transition-all shadow-xl"
              >
                Rejoindre le Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📚 NAVIGATION ÉTUDIANT */}
      <aside className="w-80 lg:w-[400px] border-r border-black/[0.04] flex flex-col bg-white h-full shadow-2xl z-20">
        <div className="p-10 pb-8 space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black">S</div>
              <span className="font-black text-xl tracking-tight">SousChef Academy</span>
           </div>
           <div className="p-6 bg-primary-soft rounded-[2.25rem] border border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Formation</p>
              <h1 className="font-bold text-slate-900 leading-tight">{course.title}</h1>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-8 custom-scrollbar pb-12">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id} className="space-y-3">
              <h3 className="ml-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Module {mIdx + 1}</h3>
              <div className="space-y-2">
                {mod.lessons.map(les => (
                  <button
                    key={les.id}
                    onClick={() => setActiveLessonId(les.id)}
                    className={`w-full text-left p-5 rounded-[2rem] transition-all flex items-center gap-4 ${
                      activeLessonId === les.id 
                        ? 'bg-slate-950 text-white shadow-xl' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${activeLessonId === les.id ? 'bg-primary animate-pulse' : 'bg-slate-200'}`} />
                    <span className="font-bold text-sm truncate">{les.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 📽️ ZONE D'APPRENTISSAGE */}
      <main className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {activeLesson ? (
          <div className="max-w-4xl mx-auto py-24 px-12 pb-40 animate-fade-in">
            <header className="mb-20 space-y-6">
              <div className="flex items-center gap-4 text-primary">
                 <ICONS.Sparkles />
                 <span className="font-black text-xs uppercase tracking-[0.4em]">Leçon en cours</span>
              </div>
              <h2 className="text-7xl font-black text-slate-950 tracking-tightest leading-tight">{activeLesson.title}</h2>
              <p className="text-2xl text-slate-400 font-medium leading-relaxed">{activeLesson.description}</p>
            </header>

            <div className="space-y-16">
              {activeLesson.blocks.map((block) => (
                <div key={block.id} className="bg-white rounded-[4.5rem] border border-black/[0.03] shadow-premium overflow-hidden">
                  {block.type === 'video' ? (
                    <div className="aspect-video bg-slate-950 flex items-center justify-center">
                       {block.value ? (
                          <iframe className="w-full h-full" src={block.value.replace('watch?v=', 'embed/')} allowFullScreen />
                       ) : (
                          <div className="text-white/20"><ICONS.Video /></div>
                       )}
                    </div>
                  ) : block.type === 'quiz' ? (
                    <div className="p-16 bg-slate-50">
                       <h4 className="text-3xl font-black mb-10">Vérifiez vos acquis</h4>
                       <div className="space-y-8">
                          {block.metadata?.questions?.map((q: any, i: number) => (
                             <div key={i} className="space-y-6">
                                <p className="text-xl font-bold">{q.question}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {q.options.map((opt: string, oi: number) => (
                                      <button key={oi} className="p-6 text-left rounded-3xl bg-white border border-slate-200 font-bold hover:border-primary transition-all">
                                         {opt}
                                      </button>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="p-16">
                      <MarkdownView content={block.value} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300">
             <p className="text-2xl font-bold">Sélectionnez une leçon pour commencer.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseView;
