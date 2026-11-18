import * as api from '../../api/tvmaze.js';
import { h, safeHtml, poster } from '../../ui/dom.js';

const COUNTRIES = { US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia', DE: 'Germany', FR: 'France', IT: 'Italy', ES: 'Spain', JP: 'Japan' };
const today = () => new Date().toISOString().slice(0, 10);
const year = (d) => (d ? d.slice(0, 4) : '');

const status = (text, cls = '') => h('p', { class: 'status ' + cls }, text);

async function guard(container, fn) {
  container.replaceChildren(status('TUNING...'));
  try { await fn(); }
  catch (e) { container.replaceChildren(status(e.message || 'Signal lost.', 'err')); }
}

export function showCard(show) {
  const meta = [year(show.premiered), show.genres?.slice(0, 2).join(' / '), show.rating?.average ? `★ ${show.rating.average}` : '']
    .filter(Boolean).join(' · ');
  return h('a', { class: 'card', href: `#/show/${show.id}` },
    h('div', { class: 'card-img' }, poster(show.image, show.name)),
    h('div', { class: 'card-label' }, h('strong', {}, show.name), h('span', {}, meta)));
}

function searchBar(type, text) {
  const input = h('input', { type: 'search', name: 'q', placeholder: 'Search shows or people...', value: text, 'aria-label': 'Search', autocomplete: 'off' });
  const select = h('select', { 'aria-label': 'Search type' },
    h('option', { value: 'shows', selected: type === 'shows' }, 'Shows'),
    h('option', { value: 'people', selected: type === 'people' }, 'People'));
  return h('form', { class: 'search', onsubmit: (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (v) location.hash = `#/search/${select.value}/${encodeURIComponent(v)}`;
  } }, input, select, h('button', { class: 'btn', type: 'submit' }, 'GO'));
}

// ---------- Home: search + tonight's schedule ----------
export function home(root) {
  const grid = h('div', { class: 'schedule' });
  const country = h('select', { 'aria-label': 'Country' },
    Object.entries(COUNTRIES).map(([c, n]) => h('option', { value: c }, n)));
  const load = () => guard(grid, async () => {
    const eps = (await api.getSchedule(country.value, today())) || [];
    const sorted = eps.filter((e) => e.show?.image).sort((a, b) => (a.airtime || '').localeCompare(b.airtime || ''));
    // Browser local time is a good-enough "now"; fall back to the full day if nothing is left.
    const now = new Date().toTimeString().slice(0, 5);
    const upcoming = sorted.filter((e) => (e.airtime || '') >= now);
    const rows = (upcoming.length ? upcoming : sorted).slice(0, 30);
    if (!rows.length) return grid.replaceChildren(status('Nothing airing here today.'));
    grid.replaceChildren(...rows.map((e) =>
      h('a', { class: 'row', href: `#/show/${e.show.id}` },
        h('span', { class: 'time' }, e.airtime || '--:--'),
        h('span', { class: 'what' }, h('strong', {}, e.show.name), h('em', {}, `S${e.season}E${e.number} ${e.name}`)),
        h('span', { class: 'net' }, e.show.network?.name || e.show.webChannel?.name || ''))));
  });
  country.addEventListener('change', load);
  root.replaceChildren(
    searchBar('shows', ''),
    h('h2', { class: 'h' }, 'TONIGHT ON TV'),
    h('div', { class: 'toolbar' }, h('label', {}, 'Region ', country)),
    grid);
  load();
}

// ---------- Search results ----------
export function search(root, type, text) {
  const out = h('div', { class: type === 'shows' ? 'grid' : 'people' });
  root.replaceChildren(searchBar(type, text), h('h2', { class: 'h' }, `RESULTS: ${text}`), out);
  guard(out, async () => {
    if (type === 'shows') {
      const list = await api.searchShows(text);
      out.replaceChildren(...(list.length ? list.map(showCard) : [status('No shows found.')]));
    } else {
      const list = await api.searchPeople(text);
      out.replaceChildren(...(list.length ? list.map((p) =>
        h('a', { class: 'person', href: `#/person/${p.id}` }, poster(p.image, p.name), h('strong', {}, p.name))) : [status('No people found.')]));
    }
  });
}

// ---------- Show page ----------
export function showPage(root, id) {
  guard(root, async () => {
    const s = await api.getShow(id);
    if (!s) return root.replaceChildren(status('Show not found.', 'err'));
    const panel = h('div', { class: 'panel' });
    const tabs = {
      Cast: async () => {
        const cast = (await api.getCast(id)) || [];
        return cast.length ? h('div', { class: 'people' }, cast.map((c) =>
          h('a', { class: 'person', href: `#/person/${c.person.id}` }, poster(c.person.image, c.person.name),
            h('strong', {}, c.person.name), h('em', {}, `as ${c.character.name}`)))) : status('No cast listed.');
      },
      Episodes: async () => {
        const eps = (await api.getEpisodes(id)) || [];
        const bySeason = new Map();
        eps.forEach((e) => { if (!bySeason.has(e.season)) bySeason.set(e.season, []); bySeason.get(e.season).push(e); });
        return h('div', {}, [...bySeason].map(([n, list]) =>
          h('details', n === 1 ? { open: true } : {}, h('summary', {}, `Season ${n} · ${list.length} eps`),
            h('ol', { class: 'eps' }, list.map((e) => h('li', {}, `${e.number ?? 'S'}. ${e.name}`, e.rating?.average ? h('span', { class: 'star' }, ` ★ ${e.rating.average}`) : null))))));
      },
    };
    const tabBar = h('div', { class: 'subtabs', role: 'tablist' });
    const open = async (name, btn) => {
      tabBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      await guard(panel, async () => panel.replaceChildren(await tabs[name]()));
    };
    Object.keys(tabs).forEach((name) => {
      const btn = h('button', { role: 'tab', 'aria-selected': 'false', onclick: (e) => open(name, e.currentTarget) }, name);
      tabBar.append(btn);
    });
    root.replaceChildren(
      h('a', { class: 'back', href: '#/' }, '← back'),
      h('section', { class: 'detail' },
        h('div', { class: 'detail-img' }, poster(s.image, s.name)),
        h('div', { class: 'detail-info' },
          h('h1', {}, s.name),
          h('p', { class: 'meta' }, [year(s.premiered), s.status, s.network?.name || s.webChannel?.name, s.genres?.join(' / '), s.rating?.average ? `★ ${s.rating.average}` : ''].filter(Boolean).join(' · ')),
          h('div', { class: 'summary' }, safeHtml(s.summary)),
          h('a', { class: 'btn', href: `#/binge/${s.id}` }, 'BINGE-O-METER'),
          s.officialSite ? h('a', { class: 'btn ghost', href: s.officialSite, target: '_blank', rel: 'noopener noreferrer' }, 'OFFICIAL SITE') : null)),
      tabBar, panel);
    open('Cast', tabBar.firstChild);
  });
}

// ---------- Person page ----------
export function personPage(root, id) {
  guard(root, async () => {
    const p = await api.getPerson(id);
    if (!p) return root.replaceChildren(status('Person not found.', 'err'));
    const credits = (await api.getCastCredits(id)) || [];
    const shows = [...new Map(credits.map((c) => [c._embedded.show.id, c._embedded.show])).values()];
    root.replaceChildren(
      h('a', { class: 'back', href: '#/' }, '← back'),
      h('section', { class: 'detail' },
        h('div', { class: 'detail-img' }, poster(p.image, p.name)),
        h('div', { class: 'detail-info' }, h('h1', {}, p.name),
          h('p', { class: 'meta' }, [p.birthday && `Born ${p.birthday}`, p.country?.name].filter(Boolean).join(' · ')))),
      h('h2', { class: 'h' }, 'KNOWN FOR'),
      h('div', { class: 'grid' }, shows.length ? shows.map(showCard) : [status('No credits listed.')]));
  });
}
