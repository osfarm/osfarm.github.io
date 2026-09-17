# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OSFarm is a static Jekyll site showcasing open source projects and communities in farming/agriculture. It is multilingual (EN/FR) and hosted on GitHub Pages.

## Commands

### Setup
```bash
script/bootstrap      # Install node packages + Ruby gems
# Or manually: npm install && sudo gem install bundler jekyll && bundle install
```

### Development
```bash
script/server         # Start dev server with watch mode at http://localhost:4000
# Equivalent: bundle exec jekyll serve -w
```

### Build
```bash
script/build          # Production build (runs npm install + jekyll build)
```

### Tests & Validation (CI)
```bash
script/cibuild              # Build + validations
bundle exec rake test       # Jekyll build + HTML/link validation via html-proofer
bundle exec rubocop -D -S   # Ruby style checks (Rakefile)
```
Set `GITHUB_TOKEN` before `rake test` to avoid GitHub rate limits on external link checks.

## Architecture

### Data-Driven Content

All structured content lives in `_data/` as YAML files — this is the primary source of truth for the site. Pages use Liquid templates to render from these files. When adding/editing projects, organizations, people, etc., edit the relevant YAML file.

Key data files:
- `_data/osfarm_projects.yml` — open source farming projects featured on the site
- `_data/projects.yml` — community/organization listings
- `_data/teams.yml` — team member information
- `_data/publications.yml` — research and publication references
- `_data/showcases.yml` — featured case studies

`projects.yml` is a map of category → list of entries; the other files are flat lists of entries. Keep entries sorted alphabetically by name within their group.

### Multilingual Setup

The site uses **jekyll-polyglot** for EN/FR support. Layouts are duplicated per language:
- `_layouts/home.html` / `_layouts/fr-home.html`
- `_layouts/support-page.html` / `_layouts/fr-support-page.html`

The `fr/` directory contains French-language pages; `index.html` and other root pages are English.

### Layout & Includes

- `_layouts/` — page templates; `home.html` for landing pages, `support-page.html` for content pages (each with an `fr-` twin)
- `_includes/` — reusable components: `header.html`, `footer.html`, `project-table.html` (each with an `fr-` twin where language-specific)

### Styling

- Main stylesheet: `assets/css/style.scss` — imports Primer CSS (GitHub's design system)
- Custom styles: `assets/css/custom.scss`
- Bootstrap 5.3.3, jQuery 3.7.1 and HighCharts are loaded via CDN (not bundled)
- CoffeeScript in `assets/js/*.coffee` is compiled by `jekyll-coffeescript` and needs jQuery
- Node packages (`primer-core`, `primer-marketing`, `octicons`) are committed to `node_modules/` because the GitHub Pages builder does not run `npm install`

### Radar des communs

`_radar/` holds a daily watch (Python, French) that finds open-licence farming projects. `.github/workflows/radar.yml` runs `collecte.py` + `resume.py` and opens a PR adding a lot file `_data/radar/YYYY-MM-DD.yml`; merging that PR is the publication step — `docs/fr/communs.html`, `docs/fr/actualites.html` and `data/communs.{json,csv}` render every entry with `publier: true` via `_includes/radar-fiches.html`. No script writes pages. Only one lot PR is open at a time (the workflow skips collection while one is pending and closes it after 3 days). Details in `_radar/README.md`; try locally with `python _radar/collecte.py --blanc` (writes to the git-ignored `_radar/brouillon/`).

### Deployment

Generated output goes to `_site/` (git-ignored); GitHub Pages builds and deploys automatically on push to `main`.
