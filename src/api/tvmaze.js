// Single place for every TVMaze network call.
// Free API, no key. Rate limit ~20 calls / 10 s per IP, so we cache and retry on 429.
const BASE = 'https://api.tvmaze.com';
const memory = new Map();
const MAX_RETRIES = 3;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function readSession(key) {
  try { const v = sessionStorage.getItem('tvm:' + key); return v ? JSON.parse(v) : undefined; }
  catch { return undefined; }
}
function writeSession(key, value) {
  try { sessionStorage.setItem('tvm:' + key, JSON.stringify(value)); } catch { /* quota or disabled */ }
}

async function get(path, { persist = true } = {}) {
  if (memory.has(path)) return memory.get(path);
  const stored = persist ? readSession(path) : undefined;
  if (stored !== undefined) { memory.set(path, stored); return stored; }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(BASE + path);
    if (res.status === 429 && attempt < MAX_RETRIES) {
      const after = Number(res.headers.get('Retry-After')) || 1;
      await wait(after * 1000 * (attempt + 1));
      continue;
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`TVMaze error ${res.status}`);
    const data = await res.json();
    memory.set(path, data);
    if (persist) writeSession(path, data);
    return data;
  }
  throw new Error('TVMaze is busy, try again in a moment.');
}

const q = encodeURIComponent;

export const searchShows = (text) => get(`/search/shows?q=${q(text)}`).then((r) => (r || []).map((x) => x.show));
export const searchPeople = (text) => get(`/search/people?q=${q(text)}`).then((r) => (r || []).map((x) => x.person));
export const getShow = (id) => get(`/shows/${id}`);
export const getCast = (id) => get(`/shows/${id}/cast`);
export const getEpisodes = (id) => get(`/shows/${id}/episodes`);
export const getSeasons = (id) => get(`/shows/${id}/seasons`);
export const getSchedule = (country, date) => get(`/schedule?country=${q(country)}&date=${q(date)}`);
export const getPerson = (id) => get(`/people/${id}`);
export const getCastCredits = (id) => get(`/people/${id}/castcredits?embed=show`);
export const getShowPage = (page) => get(`/shows?page=${page}`);
