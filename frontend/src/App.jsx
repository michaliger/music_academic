// App shell: header navigation and a simple state-based router (no URL router needed).
import { useState } from 'react';
import { ROLE_LABEL } from './utils/format.js';
import Auth from './pages/Auth.jsx';
import Landing from './pages/Landing.jsx';
import LearningMap from './pages/Map.jsx';
import Lesson from './pages/Lesson.jsx';
import Library from './pages/Library.jsx';
import Practice from './pages/Practice.jsx';
import Studio from './pages/Studio.jsx';
import Composer from './pages/Composer.jsx';
import Friends from './pages/Friends.jsx';
import Classes from './pages/Classes.jsx';
import Ask from './pages/Ask.jsx';
import Admin from './pages/Admin.jsx';
import Logo from './components/Logo.jsx';
import MusicToggle from './components/MusicToggle.jsx';

// [key, label, icon]
const TABS = [['home', 'בית', '🏠'], ['map', 'מפת הלימוד', '🗺️'], ['library', 'ספרייה', '🎹'], ['practice', 'תרגול', '🎯'], ['studio', 'סטודיו שירים', '🎤'], ['compose', 'אקורדים לשיר', '🎼'], ['friends', 'חברות', '👭'], ['classes', 'כיתות', '🏫'], ['ask', 'שאלי את המורה', '💬']];

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  // A shared link (?lesson=<id>) opens that lesson right after login.
  const sharedLesson = new URLSearchParams(location.search).get('lesson');
  const [view, setView] = useState(sharedLesson ? { tab: 'lesson', arg: sharedLesson } : { tab: 'home' });
  const go = (tab, arg) => { setView({ tab, arg }); window.scrollTo(0, 0); };

  if (!user) return <Auth onAuth={setUser} />;

  const logout = () => { localStorage.clear(); setUser(null); };
  const tabs = user.role === 'admin' ? [...TABS, ['admin', 'ניהול', '⚙️']] : TABS;
  const active = view.tab === 'lesson' ? 'map' : view.tab;
  const wide = ['home', 'map', 'library', 'lesson'].includes(view.tab); // these screens use the full page width

  return (
    <>
      <header>
        <button className="brand" onClick={() => go('home')} aria-label="לדף הבית"><Logo size={38} /><span className="brand-text"><b>מלודיה</b><small>אקדמיית המוזיקה</small></span></button>
        <nav>{tabs.map(([key, label, icon]) => <button key={key} className={`tab ${active === key ? 'on' : ''}`} onClick={() => go(key)}><span className="ticon" aria-hidden="true">{icon}</span>{label}</button>)}</nav>
        <div className="who"><MusicToggle compact /> {user.name} · {ROLE_LABEL[user.role]} <button className="link" onClick={logout}>יציאה</button></div>
      </header>
      <main className={wide ? 'wide' : ''}>
        {view.tab === 'home' && <Landing user={user} go={go} />}
        {view.tab === 'map' && <LearningMap user={user} go={go} />}
        {view.tab === 'lesson' && <Lesson id={view.arg} go={go} />}
        {view.tab === 'library' && <Library />}
        {view.tab === 'practice' && <Practice />}
        {view.tab === 'studio' && <Studio go={go} />}
        {view.tab === 'compose' && <Composer preset={view.arg?.song} />}
        {view.tab === 'friends' && <Friends />}
        {view.tab === 'classes' && <Classes user={user} />}
        {view.tab === 'ask' && <Ask preset={view.arg} />}
        {view.tab === 'admin' && <Admin user={user} />}
      </main>
    </>
  );
}
