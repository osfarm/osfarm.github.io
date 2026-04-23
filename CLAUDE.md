# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OSFarm is a static Jekyll site showcasing open source projects and communities in farming/agriculture. It is multilingual (EN/FR) and hosted on GitHub Pages.

## Commands

### Setup
```bash
script/bootstrap      # Install Ruby gems via bundler
# Or manually: sudo gem install bundler jekyll && bundle install
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
script/cibuild              # Full CI: build + all validations (what GitHub Actions runs)
bundle exec rake test       # HTML link validation via html-proofer
bundle exec rubocop -D -S   # Ruby style checks
bundle exec script/ensure-orgs    # Verify all orgs exist on GitHub (uses GITHUB_TOKEN)
bundle exec script/ensure-unique  # Check for duplicate entries in data files
script/alphabetize          # Sort YAML data files alphabetically
```

## Architecture

### Data-Driven Content

All structured content lives in `_data/` as YAML files — this is the primary source of truth for the site. Pages use Liquid templates to render from these files. When adding/editing projects, organizations, people, etc., edit the relevant YAML file.

Key data files:
- `_data/osfarm_projects.yml` — open source farming projects featured on the site
- `_data/projects.yml` — community/organization listings
- `_data/teams.yml` — team member information
- `_data/publications.yml` — research and publication references
- `_data/showcases.yml` — featured case studies

After editing YAML, run `script/alphabetize` to keep files sorted consistently.

### Multilingual Setup

The site uses **jekyll-polyglot** for EN/FR support. Layouts are duplicated per language:
- `_layouts/home.html` / `_layouts/fr-home.html`
- `_layouts/support-page.html` / `_layouts/fr-support-page.html`

The `fr/` directory contains French-language pages; `index.html` and other root pages are English.

### Layout & Includes

- `_layouts/` — page templates; `home.html` for landing pages, `support-page.html` for content pages, `form-page.html` for contact/submission
- `_includes/` — reusable components: `header.html`, `footer.html`, `org-table.html`, `project-table.html`, `form.html`

### Styling

- Main stylesheet: `assets/css/style.scss` — imports Primer CSS (GitHub's design system)
- Custom styles: `assets/css/custom.scss`
- Bootstrap 5.3.3 and HighCharts are loaded via CDN (not bundled)
- Node packages (`primer-core`, `primer-marketing`, `octicons`) are installed via `npm install` at build time

### Data Validation

The `script/` directory contains Ruby validation scripts run in CI:
- `ensure-orgs` — verifies organizations are real GitHub orgs (set `GITHUB_TOKEN` to avoid rate limits)
- `ensure-unique` — prevents the same org appearing in multiple data files
- `alphabetize` — normalizes YAML sort order

Generated output goes to `_site/` (git-ignored); GitHub Pages builds automatically on push to `main`.
