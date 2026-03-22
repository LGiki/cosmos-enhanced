# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cosmos Enhanced is a browser extension (Chrome/Edge/Firefox) that enhances the XiaoYuZhou (小宇宙) podcast web platform at `www.xiaoyuzhoufm.com`. It adds download buttons (audio, cover images, avatars), a playback speed controller (0.1x–16.0x), and ListenNotes search links to episode and podcast pages.

## Build & Development Commands

- **Build all**: `make` or `make all` — builds Chrome and Firefox ZIPs into `dist/`
- **Build Chrome only**: `make build_chrome`
- **Build Firefox only**: `make build_firefox`
- **Format code**: `npm run format` (Prettier)

There are no tests, linting, or TypeScript compilation steps. The extension is plain JavaScript with no bundler.

## Architecture

This is a Manifest V3 browser extension with three main files:

- **`cosmos-enhanced.js`** — Content script injected on `/episode/*` and `/podcast/*` pages. Extracts metadata from the DOM (audio URLs from `<audio>` elements, cover images from `.avatar` elements), generates download/search buttons, and creates a playback rate controller. Uses a MutationObserver on the `<title>` element to detect SPA navigation and regenerate UI.
- **`background.js`** — Service worker handling two message types: `download` (chrome.downloads API) and `openNewTab`.
- **`cosmos-enhanced.css`** — Styles for injected buttons and playback controller. Uses the site's CSS custom properties (`--theme-color`, `--theme-color-hsl`).

There are two manifest files: `manifest.json` (Chrome/Edge) and `manifest_firefox.json` (Firefox, with `browser_specific_settings`).

## Key Conventions

- Prettier config: 4-space indent, 100 char width, single quotes, trailing commas, LF endings
- Image URLs are stripped of size suffixes (`@small`, `@middle`, `@large`) to get original quality
- Supported audio extensions: mp3, m4a, wav, ogg, flac, ape, aac, aiff, wma, webm
- Version is maintained in both manifest files and extracted by the Makefile using `jq`
