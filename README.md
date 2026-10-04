# Splain Studio

**Good ideas. Made digital.**

My personal portfolio and a space for web experiments, ongoing projects, and learning by building.

**[Visit splain.dev](https://splain.dev)**

## About

I’m John Ogunsola, an aspiring AI engineer based in England with an interest in AI development and safety.

Splain Studio dis my portfolio that contains my progress as I develop my engineering skills, explore web design, and turn ideas into working projects.

## Features

- Responsive layouts for desktop and mobile
- GPU-rendered 3D particle artwork with a green aurora and cursor interaction
- Click the artwork to morph between Splain, GitHub, and LinkedIn
- Matching profile links, keyboard controls, and static graphics if WebGL2 is unavailable
- Animation pauses offscreen; reduced-motion users receive a still particle graphic
- Scroll reveal animations and a brief studio introduction
- Mobile navigation with keyboard controls
- Support for reduced-motion preferences
- Project links, a downloadable CV, and links to GitHub and LinkedIn

## Built with

- **HTML5** — page structure and content
- **CSS3** — layouts, styling, animations, and 3D transforms
- **JavaScript** — navigation and interactive effects
- **WebGL2 / GLSL** — particle morphs, depth shading, and the aurora backdrop

No package installation or build step is required.

## Running locally

1. Clone the repository:

   ```bash
   git clone https://github.com/johnogunsola/Splain.dev.git
   ```

2. Open the project folder.
3. Open `index.html` in your browser, or serve the folder using an editor extension such as Live Server.

The page also loads an external analytics script. Remove that script from `index.html` if you want to run a copy without analytics.

## Project structure

```text
Splain.dev/
├── index.html             # Main page
├── index.css              # Styles and responsive layouts
├── index.js               # Navigation and scroll reveals
├── particle-logo.js       # GPU shaders and logo interaction
├── particle-logo.css      # Particle card and controls
├── THIRD-PARTY-NOTICES.txt # Bootstrap Icons attribution
├── splain-intro.css       # Introduction animation styles
├── splain-intro.js        # Introduction animation behaviour
├── favicon.svg
├── favicon.png
└── John-Ogunsola-CV.pdf
```

## Explore

- [Splain Studio](https://splain.dev)
- [Splain Version 02](https://v2.splain.dev)
- [My GitHub](https://github.com/johnogunsola)

## Feedback

Found a bug or have an idea? Open an issue in this repository.

Built by **John Ogunsola**.

