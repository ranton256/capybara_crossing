# Project Overview

Vanilla JavaScript application with no external frameworks.

# Tech Stack

- Frontend: HTML5, CSS3, Vanilla ECMAScript 2026+

- Tooling: Browser-native APIs only

# Architecture & File Mapping

- index.html (Main entry point)

- src/app.js (Application state and initialization)

- src/components/ (Pure functional UI generation functions)

- src/utils/ (Helper functions and state mutators)

# Core Development Rules

- Use modern ES6+ features (async/await, modules, destructuring).

- Never install or import framework libraries (React, Vue, jQuery).

- Utilize native DOM manipulation (document.querySelector, addEventListener).

- Maintain strict separation of concerns between state, logic, and UI.

- Develop test-first. `npm test` (Node 22) must pass with 80% line, function, and branch coverage on `game.js` and `src/**` before commit. The browser game has no runtime npm dependencies.

