import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import CreateLessonPage from './pages/CreateLessonPage';
import PracticePage from './pages/PracticePage';
import { LibraryPage } from './pages/LibraryPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import DashboardPage from './pages/DashboardPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ReviewPage } from './pages/ReviewPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/collection/:id" element={<CollectionDetailPage />} />
          <Route path="/create" element={<CreateLessonPage />} />
          <Route path="/practice/:lessonId" element={<PracticePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
