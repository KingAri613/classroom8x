# AGENTS.md

## Project snapshot

- This repository is a static unblocked-games site.
- The public-facing content lives under [drive.google.com](drive.google.com/) and is served by [server.js](server.js).
- The root [index.html](index.html) and [README.md](README.md) are the main entry points for the site in this repo.
- There is no framework, bundler, or test runner configured here. Most work is static HTML, CSS, JavaScript, and server-path handling.

## Working conventions

- Keep edits small and targeted. This repo contains many copied or adapted game folders, so broad refactors are usually risky.
- Preserve the existing game directory structure and relative asset paths. Many pages rely on nested folders and browser-side file references.
- Treat the preview server in [server.js](server.js) as important project logic. URL normalization and path sanitization are part of how the site works.
- If a fix touches routing or static file serving, validate it with the local preview server rather than assuming browser behavior.
- Avoid introducing build tooling, package managers, or framework conventions unless the task explicitly requires them.

## Local workflow

- Start the preview server from the repo root with: `node server.js`
- Then check the affected page or route in a browser at `http://localhost:3000/`
- For this project, manual browser validation is the main verification step because there are no configured automated tests.

## Safety guidelines

- Do not rename or remove large game folders without a clear requirement.
- Keep paths relative when editing HTML/JS/CSS so game pages continue to load correctly from the static site structure.
- Be careful with file sanitization and `drive.google.com` rewriting logic; breakage here affects site-wide access.
- Prefer surgical fixes over sweeping changes to generated or third-party game assets.
