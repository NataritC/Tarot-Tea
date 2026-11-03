const get = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const set = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

export const loadJournal = () => get('tt.journal', []);
export const saveJournal = (entries) => set('tt.journal', entries);
export const loadDaily = () => get('tt.daily', null);
export const saveDaily = (d) => set('tt.daily', d);
export const loadSettings = () => get('tt.settings', { reversals: true });
export const saveSettings = (s) => set('tt.settings', s);
