import * as api from '../../api/tvmaze.js';
import { h, poster } from '../../ui/dom.js';

const today = () => new Date().toISOString().slice(0, 10);
const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, text) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text != null) el.textContent = text;
  return el;
};
const status = (text, cls = '') => h('p', { class: 'status ' + cls }, text);

function verdict(hours) {
  if (hours < 5) return 'Verdict: one evening. Easy.';
  if (hours < 15) return 'Verdict: clear your weekend.';
  if (hours < 40) return 'Verdict: a serious commitment.';
  if (hours < 100) return 'Verdict: take a week off.';
  return 'Verdict: this is a lifestyle now.';
}

// Only aired, numbered episodes (specials are left out).
function analyse(show, episodes) {
  const now = today();
  const fallback = show.averageRuntime || show.runtime || 0;
  const eps = episodes.filter((e) => e.number != null && e.airdate && e.airdate <= now);
  const minutes = eps.reduce((sum, e) => sum + (e.runtime || fallback), 0);
  const seasons = new Map();
  for (const e of eps) {
    if (!seasons.has(e.season)) seasons.set(e.season, { n: e.season, count: 0, ratings: [] });
    const s = seasons.get(e.season);
    s.count++;
    if (e.rating?.average) s.ratings.push(e.rating.average);
  }
  const curve = [...seasons.values()].map((s) => ({
    n: s.n, count: s.count,
    avg: s.ratings.length ? s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length : null,
  }));
  const rated = eps.filter((e) => e.rating?.average);
  const best = rated.length ? rated.reduce((a, b) => (b.rating.average > a.rating.average ? b : a)) : null;
  const worst = rated.length ? rated.reduce((a, b) => (b.rating.average < a.rating.average ? b : a)) : null;
  return { count: eps.length, minutes, curve, best, worst };
}

function chart(curve) {
  const data = curve.filter((c) => c.avg != null);
  if (!data.length) return status('No episode ratings for this show.');
  const W = Math.max(320, data.length * 44 + 40), H = 200, top = 16, base = H - 28;
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'curve', role: 'img', 'aria-label': 'Average episode rating per season' });
  [0, 5, 10].forEach((v) => {
    const y = base - (v / 10) * (base - top);
    root.append(svg('line', { x1: 24, x2: W, y1: y, y2: y, class: 'grid-line' }), svg('text', { x: 0, y: y + 4, class: 'axis' }, String(v)));
  });
  data.forEach((c, i) => {
    const bh = (c.avg / 10) * (base - top);
    const x = 34 + i * 44;
    root.append(
      svg('rect', { x, y: base - bh, width: 30, height: bh, class: 'bar' }),
      svg('text', { x: x + 15, y: base - bh - 4, class: 'val', 'text-anchor': 'middle' }, c.avg.toFixed(1)),
      svg('text', { x: x + 15, y: H - 10, class: 'axis', 'text-anchor': 'middle' }, `S${c.n}`));
  });
  return root;
}

const stat = (label, value, sub) => h('div', { class: 'stat' }, h('span', { class: 'label' }, label), h('strong', { class: 'digits' }, value), sub ? h('span', { class: 'sub' }, sub) : null);
const epLabel = (e) => `S${e.season}E${e.number} ${e.name} (★ ${e.rating.average})`;

// ---------- Picker (no show chosen yet) ----------
export function picker(root) {
  const out = h('div', { class: 'grid' });
  const input = h('input', { type: 'search', placeholder: 'Which show are we measuring?', 'aria-label': 'Show name', autocomplete: 'off' });
  const go = async (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    out.replaceChildren(status('TUNING...'));
    try {
      const list = await api.searchShows(v);
      out.replaceChildren(...(list.length ? list.map((s) =>
        h('a', { class: 'card', href: `#/binge/${s.id}` }, h('div', { class: 'card-img' }, poster(s.image, s.name)), h('div', { class: 'card-label' }, h('strong', {}, s.name), h('span', {}, s.premiered?.slice(0, 4) || ''))))
        : [status('No shows found.')]));
    } catch (err) { out.replaceChildren(status(err.message, 'err')); }
  };
  root.replaceChildren(
    h('h2', { class: 'h' }, 'BINGE-O-METER'),
    h('p', { class: 'meta' }, 'Pick a show. We’ll tell you what it will cost your life.'),
    h('form', { class: 'search', onsubmit: go }, input, h('button', { class: 'btn', type: 'submit' }, 'MEASURE')),
    out);
}

// ---------- Scoreboard ----------
export async function scoreboard(root, id) {
  root.replaceChildren(status('LOADING TAPE...'));
  try {
    const [show, episodes] = await Promise.all([api.getShow(id), api.getEpisodes(id)]);
    if (!show) return root.replaceChildren(status('Show not found.', 'err'));
    const a = analyse(show, episodes || []);
    if (!a.count || !a.minutes) {
      return root.replaceChildren(h('a', { class: 'back', href: '#/binge' }, '← pick another'), h('h1', { class: 'pick' }, show.name),
        status('Not enough aired episodes or runtime data to measure this one.', 'err'));
    }
    const hours = a.minutes / 60;
    const hm = `${Math.floor(hours)}H ${String(Math.round(a.minutes % 60)).padStart(2, '0')}M`;

    const pace = h('input', { type: 'range', min: 1, max: 8, step: 0.5, value: 2, 'aria-label': 'Hours per day' });
    const paceOut = h('output', {});
    const days = h('strong', { class: 'digits' });
    const weekends = h('strong', { class: 'digits' });
    const update = () => {
      const p = Number(pace.value);
      paceOut.textContent = `${p} h/day`;
      days.textContent = String(Math.ceil(hours / p));
      weekends.textContent = String(Math.ceil(hours / (p * 2)));
    };
    pace.addEventListener('input', update);
    update();

    root.replaceChildren(
      h('a', { class: 'back', href: '#/binge' }, '← pick another'),
      h('section', { class: 'detail' },
        h('div', { class: 'detail-img' }, poster(show.image, show.name)),
        h('div', { class: 'detail-info' },
          h('h1', { class: 'pick' }, show.name),
          h('p', { class: 'meta' }, [show.premiered?.slice(0, 4), show.status, show.rating?.average ? `★ ${show.rating.average}` : ''].filter(Boolean).join(' · ')),
          h('div', { class: 'scoreboard' },
            stat('Total runtime', hm, `${a.minutes.toLocaleString()} minutes`),
            stat('Episodes', String(a.count), `${a.curve.length} season${a.curve.length === 1 ? '' : 's'}`),
            h('div', { class: 'stat' }, h('span', { class: 'label' }, 'Days to finish'), days, paceOut),
            h('div', { class: 'stat' }, h('span', { class: 'label' }, 'Weekends'), weekends, h('span', { class: 'sub' }, 'both days, same pace'))),
          h('label', { class: 'pace' }, 'Your daily pace ', pace),
          h('p', { class: 'verdict' }, verdict(hours)),
          h('a', { class: 'btn', href: `#/show/${show.id}` }, 'OPEN SHOW'),
          h('a', { class: 'btn ghost', href: '#/roulette' }, 'SPIN ROULETTE'))),
      h('h2', { class: 'h' }, 'RATING CURVE'),
      h('div', { class: 'curve-wrap' }, chart(a.curve)),
      a.best ? h('p', { class: 'extremes' }, h('span', { class: 'good' }, 'PEAK '), epLabel(a.best)) : null,
      a.worst ? h('p', { class: 'extremes' }, h('span', { class: 'bad' }, 'LOW '), epLabel(a.worst)) : null);
  } catch (e) { root.replaceChildren(status(e.message || 'Signal lost.', 'err')); }
}
