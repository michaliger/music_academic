// App shell: header navigation and a simple state-based router (no URL router needed).
import { useEffect, useState } from 'react';
import { ROLE_LABEL } from './utils/format.js';
import Auth from './pages/Auth.jsx';
import Landing from './pages/Landing.jsx';
import LearningMap from './pages/Map.jsx';
import Lesson from './pages/Lesson.jsx';
import Library from './pages/Library.jsx';
import Practice from './pages/Practice.jsx';
import Composer from './pages/Composer.jsx';
import Friends from './pages/Friends.jsx';
import Classes from './pages/Classes.jsx';
import Ask from './pages/Ask.jsx';
import Admin from './pages/Admin.jsx';
import Logo from './components/Logo.jsx';
import NotesBg from './components/NotesBg.jsx';
import { ambient } from './music/audio.js';

const TABS = [['home', 'בית'], ['map', 'מפת הלימוד'], ['library', 'ספרייה'], ['practice', 'תרגול'], ['compose', 'אקורדים לשיר'], ['friends', 'חברות'], ['classes', 'כיתות'], ['ask', 'שאלי את המורה']];

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  // A shared link (?lesson=<id>) opens that lesson right after login.
  const sharedLesson = new URLSearchParams(location.search).get('lesson');
  const [view, setView] = useState(sharedLesson ? { tab: 'lesson', arg: sharedLesson } : { tab: 'home' });
  const go = (tab, arg) => { setView({ tab, arg }); window.scrollTo(0, 0); };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  // the background melody belongs to the home page only
  useEffect(() => { if (view.tab !== 'home') ambient.stop(); }, [view.tab]);

  if (!user) return <Auth onAuth={setUser} />;

  const logout = () => { localStorage.clear(); setUser(null); };
  const tabs = user.role === 'admin' ? [...TABS, ['admin', 'ניהול']] : TABS;
  const active = view.tab === 'lesson' ? 'map' : view.tab;
  const home = view.tab === 'home';

  return (
    <>
      <NotesBg />
      <header className={home ? (scrolled ? 'onhome scrolled' : 'onhome') : ''}>
        <button className="brand" onClick={() => go('home')} aria-label="לדף הבית"><Logo size={38} /><span className="brand-text"><b>מלודיה</b><small>אקדמיית המוזיקה</small></span></button>
        <nav>{tabs.map(([key, label]) => <button key={key} className={`tab ${active === key ? 'on' : ''}`} onClick={() => go(key)}>{label}</button>)}</nav>
        <div className="who">
          <span className="avatar" aria-hidden="true">{[...user.name][0]}</span>
          <span className="whotext"><b>{user.name}</b><small className={`rolepill ${user.role}`}>{ROLE_LABEL[user.role]}</small></span>
          <button className="logout" onClick={logout} title="יציאה מהחשבון">יציאה</button>
        </div>
      </header>
      {home && <Landing user={user} go={go} />}
      {!home && <main className="wide">
        {view.tab === 'map' && <LearningMap user={user} go={go} />}
        {view.tab === 'lesson' && <Lesson id={view.arg} go={go} />}
        {view.tab === 'library' && <Library />}
        {view.tab === 'practice' && <Practice />}
        {view.tab === 'compose' && <Composer />}
        {view.tab === 'friends' && <Friends />}
        {view.tab === 'classes' && <Classes user={user} />}
        {view.tab === 'ask' && <Ask preset={view.arg} />}
        {view.tab === 'admin' && <Admin user={user} />}
      </main>}
    </>
  );
}
