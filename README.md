# Couch Control 📼

A retro CRT / VHS-neon control room for TV, powered by the free [TVMaze API](https://www.tvmaze.com/api).
No API key, no backend, no build step: just open it and click.

> Status: **step 1 – project scaffold.** The app itself is built in the steps below.

## Three modes

| Mode | What it does |
|---|---|
| 🎰 **Roulette** | Pull the lever, get a random show. Filter by genre, runtime, status. |
| 📊 **Binge-O-Meter** | Pick a show: total runtime, the weekend you'd need, season-by-season rating curve. |
| 🔎 **Explorer** | Search shows and people, open show pages, browse cast, episodes and the daily schedule. |

Roulette and Binge-O-Meter link into Explorer, so the fun layer always leads to the full API.

## Roadmap

1. [x] Repo scaffold, vision and style guide
2. [ ] API helper (fetch, cache, rate-limit friendly) + Explorer
3. [ ] Roulette
4. [ ] Binge-O-Meter
5. [ ] Polish and deploy to GitHub Pages

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
