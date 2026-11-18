# TVMaze endpoints used

Base: `https://api.tvmaze.com` (no key, CORS enabled, rate limit ~20 calls / 10 s per IP).

| Feature | Endpoint |
|---|---|
| Search shows | `/search/shows?q=` |
| Search people | `/search/people?q=` |
| Show details | `/shows/:id` |
| Random pool | `/shows?page=N` |
| Episodes | `/shows/:id/episodes` |
| Seasons | `/shows/:id/seasons` |
| Cast | `/shows/:id/cast` |
| Schedule | `/schedule?country=XX&date=YYYY-MM-DD` |
| Person credits | `/people/:id/castcredits?embed=show` |

All calls go through `src/api/` (caching, retry on 429).
