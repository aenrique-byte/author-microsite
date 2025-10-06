import { Routes, Route } from 'react-router-dom';
import { StorytimeHome } from './components/StorytimeHome';
import { Story as StoryComponent } from './components/Story';
import { Chapter as ChapterComponent } from './components/Chapter';

export default function StorytimeRoute() {
  return (
    <div className="font-sans h-full transition-colors duration-200 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Routes>
        <Route path="/" element={<StorytimeHome />} />
        <Route path="/story/:storyId" element={<StoryComponent />} />
        <Route path="/story/:storyId/chapter/:chapterId" element={<ChapterComponent />} />
      </Routes>
    </div>
  );
}
