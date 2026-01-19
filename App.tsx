
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { ICONS } from './constants';
import Dashboard from './pages/Dashboard';
import BuilderPage from './pages/BuilderPage';
import { Course, Module, Lesson } from './types';

const INITIAL_COURSES: Course[] = [
  {
    id: '1',
    title: 'Minimalist UX Foundations',
    subtitle: 'Learn the art of subtraction in digital interface design.',
    thumbnail: 'https://picsum.photos/seed/design/1000/700',
    status: 'published',
    modules: [
      {
        id: 'm1',
        title: 'The Philosophy',
        lessons: [
          { id: 'l1', title: 'Why Less is More', description: 'Exploring the history of minimalism', blocks: [], isDraft: false },
          { id: 'l2', title: 'Visual Hierarchy', description: 'Guiding the eye with white space', blocks: [], isDraft: false }
        ]
      }
    ]
  }
];

const Sidebar = () => {
  return (
    <aside className="w-24 lg:w-72 h-screen sticky top-0 bg-white border-r border-black/5 flex flex-col p-6 z-50 transition-all duration-300">
      <div className="flex items-center gap-4 px-2 mb-12">
        <div className="w-12 h-12 bg-primary rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-indigo-glow">
          S
        </div>
        <div className="hidden lg:block">
          <h2 className="font-black text-xl tracking-tighter text-slate-950 leading-none">SousChef</h2>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Studio Elite</p>
        </div>
      </div>

      <nav className="flex flex-col gap-3 flex-1">
        <Link to="/" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-primary transition-all font-bold">
          <ICONS.Home />
          <span className="hidden lg:block text-slate-600">Studios</span>
        </Link>
        <Link to="/settings" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-primary transition-all font-bold">
          <ICONS.Settings />
          <span className="hidden lg:block text-slate-600">Workspace</span>
        </Link>
      </nav>

      <div className="pt-8 border-t border-black/5">
        <div className="hidden lg:block p-6 rounded-[2rem] bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Cloud Storage</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full mb-3">
             <div className="bg-primary w-[70%] h-full rounded-full" />
          </div>
          <p className="text-xs font-bold text-slate-300">7.2 GB of 10 GB used</p>
        </div>
      </div>
    </aside>
  );
};

const AppContent = () => {
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('souschef_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  useEffect(() => {
    localStorage.setItem('souschef_courses', JSON.stringify(courses));
  }, [courses]);

  const addCourse = (title: string, aiOutline?: any) => {
    let modules: Module[] = [];
    if (aiOutline) {
      modules = aiOutline.modules.map((m: any, mIdx: number) => ({
        id: `m-ai-${mIdx}-${Date.now()}`,
        title: m.title,
        lessons: m.lessons.map((l: any, lIdx: number) => ({
          id: `l-ai-${mIdx}-${lIdx}-${Date.now()}`,
          title: l.title,
          description: l.description,
          blocks: [],
          isDraft: true
        }))
      }));
    }

    const newCourse: Course = {
      id: Date.now().toString(),
      title: aiOutline?.title || title,
      subtitle: aiOutline?.subtitle || 'No description provided.',
      thumbnail: `https://picsum.photos/seed/${Date.now()}/1000/700`,
      status: 'draft',
      modules
    };
    setCourses([newCourse, ...courses]);
    return newCourse.id;
  };

  const updateCourse = (updatedCourse: Course) => {
    setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const deleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <div className="flex bg-[#fbfbfe]">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard courses={courses} onAddCourse={addCourse} onDeleteCourse={deleteCourse} />} />
          <Route path="/builder/:courseId" element={<BuilderPage courses={courses} onUpdateCourse={updateCourse} />} />
          <Route path="/settings" element={<div className="p-20"><h1 className="text-5xl font-black tracking-tight">Workspace Settings</h1></div>} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
