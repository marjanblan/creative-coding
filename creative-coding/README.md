# Creative Coding by Ruslan Mashkov

Generative posters, animations, and code experiments — exploring shapes, color, and motion.  
Built with [canvas-sketch](https://github.com/mattdesl/canvas-sketch), p5.js, WebGL, and other tools.

🔗 **Live gallery:** https://marjanblan.github.io/creative-coding

---

## About this repository
This is my personal archive of creative coding works.  
Each sketch lives in its own folder inside `/sketches`, with:
- `sketch.js` — the source code
- `meta.json` — metadata (title, date, tools, tags, description)
- `preview.png` or `preview.gif` — a visual preview
- `export/` — optional rendered frames or videos

The repository also includes:
- `/site` — GitHub Pages static gallery
- `/scripts` — automation tools (e.g., gallery generator)

---

## Gallery
<!-- GALLERY:START -->
*(The gallery will be generated automatically here by `npm run gallery`)*
<!-- GALLERY:END -->

---

## Local preview
```bash
# Install deps (none required, but keeps lockfiles consistent)
npm install

# Generate gallery JSON + README table
npm run gallery

# Preview static site locally at http://localhost:8080
npm run dev
```
