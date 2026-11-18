# Couch Control 📼

A retro CRT / VHS-neon control room for TV, powered by the free [TVMaze API](https://www.tvmaze.com/api).
No API key, no backend, no build step: just open it and click.

**Live:** https://tacox2404-sudo.github.io/couch-control/

> Status: **complete**. All three modes (Explorer, Roulette, Binge-O-Meter) are built and live on GitHub Pages.

## Three modes

| Mode | What it does |
|---|---|
| 🎰 **Roulette** | Pull the lever, get a random show. Filter by genre, runtime, status. |
| 📊 **Binge-O-Meter** | Pick a show: total runtime, the weekend you'd need, season-by-season rating curve. |
| 🔎 **Explorer** | Search shows and people, open show pages, browse cast, episodes and the daily schedule. |

Roulette and Binge-O-Meter link into Explorer, so the fun layer always leads to the full API.

## Roadmap

1. [x] Repo scaffold, vision and style guide
2. [x] API helper (fetch, cache, rate-limit friendly) + Explorer
3. [x] Roulette
4. [x] Binge-O-Meter
5. [x] Polish and deploy to GitHub Pages

## Structure

```
src/api/            TVMaze client (single place for all network calls)
src/modes/          roulette/  binge/  explorer/
src/ui/             shared retro components (screen, buttons, cards)
assets/             fonts, images, sounds
docs/               VISION.md, STYLE.md, API.md
```

## Stack

Vanilla HTML, CSS and JavaScript (ES modules). Static files only, so it deploys anywhere.

## Credits

Data from [TVMaze](https://www.tvmaze.com), licensed CC BY-SA. Please keep attribution visible in the app.

## License

MIT

## Run locally

No build needed. From the repo root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## How to check that it works

1. Open the live link above. Explorer shows tonight's TV schedule for the chosen country.
2. Open Roulette and click SPIN. A random show appears with its year, status, genre and episode length.
3. Open Binge-O-Meter and pick a show. For example Breaking Bad gives 62 episodes in 5 seasons, about 62 hours in total, and a rating curve per season.
4. Every click is a real call to the TVMaze API (see [docs/API.md](docs/API.md)). No login, API key or backend is involved, and API text is shown as plain text or a small allow-list of safe tags.

## Security

No API key, token or secret is used anywhere in this project. See [SECURITY.md](SECURITY.md) to report a problem.
