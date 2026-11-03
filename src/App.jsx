import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import ReadingPage from './pages/ReadingPage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import JournalPage from './pages/JournalPage.jsx';
import LearnPage from './pages/LearnPage.jsx';

const NAV = [['home', 'Home'], ['read', 'Read'], ['learn', 'Learn'], ['library', 'Cards'], ['journal', 'Journal']];

// Small line icons for the phone tab bar.
const ICONS = {
  home: <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" />,
  read: <><rect x="4" y="5" width="7" height="12" rx="1.2" transform="rotate(-10 7.5 11)" /><rect x="12" y="5" width="7" height="12" rx="1.2" transform="rotate(10 15.5 11)" /></>,
  learn: <><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z" /><path d="M12 6v13.5" /></>,
  library: <><rect x="3" y="4" width="7" height="11" rx="1" /><rect x="14" y="4" width="7" height="11" rx="1" /><path d="M3 19h18" /></>,
  journal: <><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
};
const Icon = ({ name }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>
);

const parseHash = () => {
  const [page = 'home', arg = null] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { page: NAV.some(([k]) => k === page) ? page : 'home', arg };
};

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [readKey, setReadKey] = useState(0);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    fetch('/api/interpret')
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((d) => setAiAvailable(Boolean(d.available)))
      .catch(() => setAiAvailable(false));
  }, []);

  const navigate = (page, arg) => {
    if (page === 'read') setReadKey((k) => k + 1); // always start a fresh reading
    window.location.hash = `/${page}${arg ? `/${arg}` : ''}`;
    window.scrollTo({ top: 0 });
  };

  let content;
  switch (route.page) {
    case 'read': content = <ReadingPage key={`${readKey}-${route.arg}`} initialSpread={route.arg} aiAvailable={aiAvailable} navigate={navigate} />; break;
    case 'learn': content = <LearnPage navigate={navigate} />; break;
    case 'library': content = <LibraryPage />; break;
    case 'journal': content = <JournalPage aiAvailable={aiAvailable} navigate={navigate} />; break;
    default: content = <HomePage navigate={navigate} />;
  }

  return (
    <div className="app">
      <div className="stars" aria-hidden="true" />
      <nav className="nav">
        <button className="brand" onClick={() => navigate('home')}>Tarot <span className="amp">&amp;</span> Tea</button>
        <div className="nav-links">
          {NAV.map(([k, label]) => (
            <button key={k} className={`nav-link ${route.page === k ? 'is-on' : ''}`} onClick={() => navigate(k)} aria-current={route.page === k ? 'page' : undefined}>
              <Icon name={k} /><span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
      <main>{content}</main>
      <footer className="footer">
        <span>✦ Tarot &amp; Tea · Noctis Tarot ✦</span>
        <span className="muted small">For reflection and entertainment. Your choices shape your future.</span>
      </footer>
    </div>
  );
}
