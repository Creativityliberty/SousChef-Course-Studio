
export type ContentType = 'video' | 'text' | 'download' | 'quiz';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface ContentBlock {
  id: string;
  type: ContentType;
  value: string; // URL for video, markdown for text, stringified JSON for quiz
  metadata?: {
    provider?: 'youtube' | 'vimeo' | 'upload' | 'wistia';
    fileName?: string;
    duration?: string;
    questions?: QuizQuestion[];
  };
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  blocks: ContentBlock[];
  isDraft: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  status: 'draft' | 'published';
  modules: Module[];
}

export type AppState = {
  courses: Course[];
  activeCourseId: string | null;
};
