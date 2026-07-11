# robotomy.ai

Engineering log for building on the Unitree G1 EDU — built with [Docusaurus](https://docusaurus.io/).

## Local development

```bash
npm install
npm run start
```

Starts a local dev server at `localhost:3000` with live reload.

## Build

```bash
npm run build
```

Generates static content into `build/`.

## Deployment

Deployment is automated: pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. The custom domain (`robotomy.ai`) is set via `static/CNAME`.

## Content

- `docs/log/` — pitfall entries. Format: Symptom, Environment, Root Cause, Fix (see `docs/log/writing-a-log-entry.md`).
- `docs/architecture/` — living reference docs, edited in place.
- `blog/` — longer-form retrospectives.
