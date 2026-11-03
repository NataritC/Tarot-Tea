import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import ReadingPage from './pages/ReadingPage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import JournalPage from './pages/JournalPage.jsx';
import LearnPage from './pages/LearnPage.jsx';

const NAV = [['home', 'Home'], ['read', 'Read'], ['learn', 'Learn'], ['library', 'Cards'], ['journal', 'Journal']];

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
            <button key={k} className={`nav-link ${route.page === k ? 'is-on' : ''}`} onClick={() => navigate(k)}>{label}</button>
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
