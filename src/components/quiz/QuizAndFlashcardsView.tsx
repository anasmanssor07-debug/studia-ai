import React from 'react';
import { StudyToolsView } from '../studytools/StudyToolsView.tsx';

interface QuizAndFlashcardsViewProps {
  initialCourseId?: string;
  initialSubtab?: 'flashcards' | 'quiz' | 'summary';
}

export const QuizAndFlashcardsView: React.FC<QuizAndFlashcardsViewProps> = ({ 
  initialCourseId, 
  initialSubtab = 'flashcards' 
}) => {
  return (
    <StudyToolsView
      initialTab={initialSubtab === 'quiz' ? 'quiz' : initialSubtab === 'summary' ? 'summary' : 'flashcards'}
      initialCourseId={initialCourseId}
    />
  );
};
