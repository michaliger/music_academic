// App shell: header navigation and a simple state-based router (no URL router needed).
import { useState } from 'react';
import { ROLE_LABEL } from './utils/format.js';
import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import Lesson from './pages/Lesson.jsx';
import Library from './pages/Library.jsx';
import Practice from './pages/Practice.jsx';
import Studio from './pages/Studio.jsx';
import Composer from './pages/Composer.jsx';
import Friends from './pages/Friends.jsx';
import Classes from './pages/Classes.jsx';
import Ask from './pages/Ask.jsx';
import Admin from './pages/Admin.jsx';

const TABS = [['home', 'מפת הלימוד'], ['library', 'ספרייה'], ['practice', 'תרגול'], ['studio', 'סטודיו AI'], ['compose', 'חדר הלחנה'], ['friends', 'חברות'], ['classes', 'כיתות'], ['ask', 'שאלי את המורה']];

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  // A shared link (?lesson=<id>) opens that lesson right after login.
  const sharedLesson = new URLSearchParams(location.search).get('lesson');
  const [view, setView] = useState(sharedLesson ? { tab: 'lesson', arg: sharedLesson } : { tab: 'home' });
  const go = (tab, arg) => { setView({ tab, arg }); window.scrollTo(0, 0); };

  if (!user) return <Auth onAuth={setUser} />;

  const logout = () => { localStorage.clear(); setUser(null); };
  const tabs = user.role === 'admin' ? [...TABS, ['admin', 'ניהול']] : TABS;
  const active = view.tab === 'lesson' ? 'home' : view.tab;

  return (
    <>
      <header>
        <div className="brand"><span className="logo sm">♪</span> אקדמיית המוזיקה</div>
        <nav>{tabs.map(([key, label]) => <button key={key} className={`tab ${active === key ? 'on' : ''}`} onClick={() => go(key)}>{label}</button>)}</nav>
        <div className="who">{user.name} · {ROLE_LABEL[user.role]} <button className="link" onClick={logout}>יציאה</button></div>
      </header>
      <main>
        {view.tab === 'home' && <Home user={user} go={go} />}
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
