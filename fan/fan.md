**Create a 3D model of a modern fan using Three.js — everything in a single `index.html` file (Three.js loaded via CDN).**

The fan should look realistic and consist of: a rounded dark base, a slim metallic pole, a capsule-shaped motor housing, 3–5 curved blades inside a chrome protective grill, and a small control panel on the housing with **three buttons**.

Buttons and logic:
1. **Power button** — turns the fan ON/OFF (blades spin up when on, smoothly slow down to a stop when off, LED indicator changes color).
2. **Speed button** — cycles through 4 rotation speeds (1 → 2 → 3 → 4 → 1), each speed changes the blade rotation velocity, with small LEDs showing the active level.
3. **Oscillation button** — when pressed, the fan head starts rotating left and right (about ±45°) while blowing in different directions; when pressed again, it smoothly returns to the center.

Add soft lighting, shadows, `OrbitControls` for camera rotation/zoom, and make the buttons clickable via `Raycaster`.

**Output: one self-contained `index.html` with an ES module script.**