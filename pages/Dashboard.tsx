
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { ICONS } from '../constants';
import { generateCourseOutline } from '../services/geminiService';

interface DashboardProps {
  courses: Course[];
  onAddCourse: (title: string, outline?: any) => string;
  onDeleteCourse: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ courses, onAddCourse, onDeleteCourse }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isAiMode, setIsAiMode] = useState(true);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateManual = () => {
    if (topic.trim()) {
      const id = onAddCourse(topic);
      navigate(`/builder/${id}`);
    }
  };

  const handleCreateWithAi = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    
    const result = await generateCourseOutline(topic);
    
    if (result.error) {
      setError(result.error);
      setIsGenerating(false);
    } else if (result.data) {
      const id = onAddCourse(result.data.title, result.data);
      setIsGenerating(false);
      setShowModal(false);
      navigate(`/builder/${id}`);
    }
  };

  return (
    <div className="p-8 lg:p-20 animate-fade-in max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-soft text-primary text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-primary/20">
            <ICONS.Sparkles /> SousChef Studio v3.2
          </div>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-slate-950 leading-[0.85]">
            Créez votre <br/> <span className="text-primary italic">Héritage</span>
          </h1>
          <p className="text-2xl text-slate-400 font-medium max-w-xl leading-relaxed">
            L'architecture de cours haut de gamme, propulsée par l'intelligence artificielle la plus avancée.
          </p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setIsAiMode(true); setError(null); }}
          className="group relative overflow-hidden px-14 py-7 rounded-full bg-primary text-white font-black text-xl flex items-center gap-4 shadow-indigo-glow hover:scale-105 hover:bg-primary-dark transition-all active:scale-95"
        >
          <ICONS.Plus />
          Nouveau Projet
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {courses.map(course => (
          <div key={course.id} className="group relative bg-white rounded-[4rem] border border-black/[0.03] shadow-premium hover:shadow-premium-lg transition-all duration-700 overflow-hidden flex flex-col hover:-translate-y-3">
            <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-10">
                 <p className="text-white text-base font-bold tracking-wide uppercase">
                    {course.modules.length} Modules &bull; {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} Leçons
                 </p>
              </div>
              <div className="absolute top-8 left-8">
                <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-xl shadow-lg border border-white/20 ${course.status === 'published' ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-white'}`}>
                  {course.status === 'published' ? 'Publié' : 'Brouillon'}
                </span>
              </div>
            </div>
            <div className="p-12 flex-1 flex flex-col">
              <h3 className="text-3xl font-black text-slate-950 mb-4 line-clamp-1 group-hover:text-primary transition-colors tracking-tighter">{course.title}</h3>
              <p className="text-slate-400 text-lg mb-10 line-clamp-2 leading-relaxed font-medium">{course.subtitle}</p>
              
              <div className="mt-auto flex items-center justify-between gap-5">
                <button 
                  onClick={() => navigate(`/builder/${course.id}`)}
                  className="flex-1 px-10 py-6 rounded-full bg-slate-950 text-white font-black text-sm uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  Ouvrir le Studio
                  <ICONS.ChevronRight />
                </button>
                <button 
                  onClick={() => onDeleteCourse(course.id)}
                  className="w-16 h-16 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center bg-slate-50 border border-black/[0.02]"
                >
                  <ICONS.Trash />
                </button>
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={() => { setShowModal(true); setIsAiMode(true); setError(null); }}
          className="group border-4 border-dashed border-slate-200 rounded-[5rem] p-16 flex flex-col items-center justify-center text-center gap-10 hover:border-primary/40 hover:bg-primary-soft/50 transition-all duration-700 min-h-[500px]"
        >
          <div className="w-28 h-28 bg-white rounded-full shadow-premium flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 border border-black/[0.03]">
            <ICONS.Sparkles />
          </div>
          <div className="space-y-4">
            <h3 className="text-4xl font-black text-slate-950 tracking-tighter">Architecte IA</h3>
            <p className="text-xl text-slate-400 max-w-[280px] font-medium leading-relaxed">Laissez la magie opérer : créez votre cursus en un instant.</p>
          </div>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 glass bg-slate-950/70 animate-fade-in">
          <div className="bg-white rounded-[5rem] w-full max-w-2xl p-20 shadow-premium-lg border border-black/5 animate-scale-up overflow-hidden relative">
            {isGenerating && (
               <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                  <div className="relative mb-14">
                    <div className="w-28 h-28 border-[10px] border-primary/10 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-primary animate-pulse-soft scale-150">
                      <ICONS.Sparkles />
                    </div>
                  </div>
                  <h2 className="text-5xl font-black text-slate-950 mb-6 tracking-tighter">Création en cours...</h2>
                  <p className="text-2xl text-slate-400 font-medium max-w-md leading-relaxed">L'IA structure vos modules, définit vos objectifs et prépare votre futur succès.</p>
               </div>
            )}
            
            <div className="flex items-center justify-between mb-14">
               <h2 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">
                  {isAiMode ? 'Assistant IA' : 'Nouveau Cours'}
               </h2>
               <button onClick={() => setShowModal(false)} className="w-14 h-14 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center border border-black/[0.05]">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>
            </div>
            
            <div className="space-y-12">
              <div className="flex gap-2 p-2 bg-slate-50 rounded-full border border-black/[0.02]">
                 <button 
                  onClick={() => { setIsAiMode(true); setError(null); }}
                  className={`flex-1 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all ${isAiMode ? 'bg-white shadow-premium text-primary' : 'text-slate-400'}`}
                 >
                    Générer (IA)
                 </button>
                 <button 
                  onClick={() => { setIsAiMode(false); setError(null); }}
                  className={`flex-1 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all ${!isAiMode ? 'bg-white shadow-premium text-slate-950' : 'text-slate-400'}`}
                 >
                    Manuel
                 </button>
              </div>

              <div className="space-y-6">
                <label className="block text-[11px] font-black text-primary uppercase tracking-[0.4em] ml-6">
                   {isAiMode ? 'Sujet du cours' : 'Nom du projet'}
                </label>
                <textarea 
                  autoFocus
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={isAiMode ? "Ex: Maîtriser l'architecture minimaliste..." : "Ex: Branding pour startups"}
                  rows={3}
                  className="w-full px-12 py-10 rounded-[3rem] border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary focus:ring-[16px] focus:ring-primary/5 outline-none transition-all text-2xl font-bold placeholder:text-slate-200 resize-none shadow-inner"
                />
              </div>

              {error && (
                <div className="p-10 bg-rose-50 border border-rose-100 rounded-[3.5rem] text-rose-600 font-bold text-sm animate-fade-in flex flex-col gap-3">
                  <span className="text-rose-800 font-black uppercase text-xs tracking-widest">Alerte Système :</span>
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <button 
                onClick={isAiMode ? handleCreateWithAi : handleCreateManual}
                disabled={!topic.trim() || isGenerating}
                className="w-full py-8 rounded-full bg-primary text-white font-black text-2xl shadow-indigo-glow hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4"
              >
                {isAiMode ? <><ICONS.Sparkles /> Générer le programme</> : 'Créer le projet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
