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
- `_data/radar/communaute.yml` — hand-maintained community projects, in the radar entry format plus `img`, `demo`, `github_org`, `categorie` (FR) and `category` (EN); shown in `/fr/communs/` with the radar lots, on `/community/` grouped by `category`, and as avatars on the home pages. Its `meta`, `familles` and `categories` keys feed the "propose a project" form, not the directory itself
- `_data/catalogue.yml` — training modules, consulting assignments, rates and the endpoints/addresses the catalogue forms post to (`meta`)
- `_data/operateurs.yml` — the member organisations that deliver catalogue modules, plus the partners cited on module cards (`role: partenaire`)
- `_data/teams.yml` — team member information
- `_data/publications.yml` — the Documentation section (`/fr/documentation/`, `/documentation/`): reports, studies, books, papers and portals on AI and digital agriculture, under `publications`, with their `groupes` and `natures`. Entries flagged `pourquoi: true` also show on `/why/`
- `_data/showcases.yml` — featured case studies

These files are flat lists of entries (`communaute.yml` keeps them under `candidats`, `catalogue.yml` under `modules` and `missions`, `publications.yml` under `publications`). Keep entries sorted alphabetically by name within their group, or by reference for the catalogue.

### Multilingual Setup

The site uses **jekyll-polyglot** for EN/FR support. Layouts are duplicated per language:
- `_layouts/home.html` / `_layouts/fr-home.html`
- `_layouts/support-page.html` / `_layouts/fr-support-page.html`

The `fr/` directory contains French-language pages; `index.html` and other root pages are English.

### Layout & Includes

- `_layouts/` — page templates; `home.html` for landing pages, `support-page.html` for content pages (each with an `fr-` twin)
- `_includes/` — reusable components: `header.html`, `footer.html`, `project-table.html` (each with an `fr-` twin where language-specific). The catalogue includes take a `lang="fr"`/`"en"` parameter instead of having a twin, so the 17 modules are described once

### Styling

- Main stylesheet: `assets/css/style.scss` — imports Primer CSS (GitHub's design system)
- Custom styles: `assets/css/custom.scss`
- Bootstrap 5.3.3, jQuery 3.7.1 and HighCharts are loaded via CDN (not bundled)
- CoffeeScript in `assets/js/*.coffee` is compiled by `jekyll-coffeescript` and needs jQuery
- Node packages (`primer-core`, `primer-marketing`, `octicons`) are committed to `node_modules/` because the GitHub Pages builder does not run `npm install`

### Radar des communs

`_radar/` holds a daily watch (Python, French) that finds open-licence farming projects. The community pushes too: the "proposer un projet" form at the foot of `/fr/communs/` and `/community/` (`_includes/communs-proposition.html` + `assets/js/communs-proposition.js`, both languages from one include) posts to the n8n workflow **Annuaire — proposition de projet**, which rejects anything already listed (comparing the link against `/data/communs.json` and `communaute.yml` on `main`), fills licence, techno, keywords and last activity from the GitHub API, then opens the pull request adding the entry to `communaute.yml`. Merging it is still the publication step — see `_radar/README.md`. `.github/workflows/radar.yml` runs `collecte.py` + `resume.py` and opens a PR adding a lot file `_data/radar/YYYY-MM-DD.yml`; merging that PR is the publication step — `docs/fr/communs.html`, `docs/fr/actualites.html` and `data/communs.{json,csv}` render every entry with `publier: true` from `_data/radar/` via `_includes/radar-fiches.html`, which includes the hand-maintained `communaute.yml`; the news page and the radar scripts (`fichiers_lots()`) skip that file, and the radar never proposes a URL it already contains. No script writes pages. Only one lot PR is open at a time (the workflow skips collection while one is pending and closes it after 3 days). Sources of `type: liste` in `_radar/sources.yml` read other people's "awesome" lists (OpenSourceAgriculture, awesome-agriculture): each entry is traced back to a forge repo for its licence (`resoudre()`), a list is imported once through the workflow's `liste` input (`collecte.py --import-liste <id>`, PR labelled `radar-import`, 14-day expiry, lot `_data/radar/YYYY-MM-DD-import-<id>.yml` whose presence on `main` marks it imported), then only its new entries surface in daily lots — see `_radar/LISTES.md`. Details in `_radar/README.md`; try locally with `python _radar/collecte.py --blanc` (writes to the git-ignored `_radar/brouillon/`).

### Assistant de l'annuaire

A bubble on every page answers visitors from the site's own published content. `data/socle.txt` is a Jekyll-generated corpus (~16 400 tokens: the consigne, the association, the 17 catalogue modules, the directory entries, the Documentation references) that n8n reads on each question — **no vector database and no indexing workflow: the whole site fits in one prompt**. The n8n workflow *Chatbot de l'annuaire* applies the abuse and quota guards before any model call, refuses to query the model without a complete socle, and strips from the answer every URL absent from the socle. `_data/chatbot.yml` holds the webhook and the FR/EN wording; emptying `meta.webhook` removes the bubble without touching code. Model choice, cost, traps and the phase-2 threshold are in `_chatbot/README.md`.

### Catalogue formation & conseil

`/fr/catalogue/` and `/catalogue/` list the training modules and consulting assignments OSFarm members deliver around the tools of the directory. The association lists, members operate: it takes no commission and is not a party to the contract, so a module offers a quote only when `statut: ouvert` **and** `operateur` are both set in `_data/catalogue.yml` — otherwise the card calls for an operator and points at `/fr/proposer-un-module/` (`/propose-a-module/` in English), which carries the operator charter and the application form. `_includes/catalogue.html` and `_includes/catalogue-candidature.html` render everything from `_data/catalogue.yml` + `_data/operateurs.yml`; `assets/js/catalogue.js` handles the family filters, the `#module-a1` deep links and posting both forms to the n8n webhooks declared in `meta` (nothing is hard-coded in the JS). `/catalogue.json` is the same data as a feed, which n8n reads to route a request to its operator. Editing `_data/` is the only gesture needed; the workflow specs and the pre-launch checklist are in `_catalogue/README.md`.

### Documentation

`/fr/documentation/` and `/documentation/` list readings, not commons: publications never enter the directory, its counter, `data/communs.{json,csv}` or the `famille` values (a public contract, see `_annuaire/DESIGN.md`). `_includes/documentation.html` (with `lang=`) renders `_data/publications.yml`; `assets/js/documentation.js` is only the kind filter. Titles and authors stay in the document's language; summaries are `{ fr, en }`; `annee` is the document's year, not its web page's; preprints and portals carry a visible warning. The entries also feed a DOCUMENTATION section of `data/socle.txt`, so the assistant can cite them. Requirements and the 22/09/2026 link check are in `_documentation/EXIGENCES.md`; sites that answer 403 to every robot are listed in the `Rakefile` `ignore_urls`.

### Deployment

Generated output goes to `_site/` (git-ignored); GitHub Pages builds and deploys automatically on push to `main`.
