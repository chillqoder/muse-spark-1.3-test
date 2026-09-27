Create a complete playable **2D side-scrolling high-speed platformer game** inspired by classic 16-bit console platformers from the early 1990s.

The game must focus heavily on **momentum, acceleration, slopes, rolling physics, fast traversal, platforming, loops, springs, multiple routes, collectibles, enemies, and speed-based movement**.

Do not make this a generic platformer where the character instantly moves at a fixed speed. The movement physics are the most important part of the project.

---

# MAIN CHARACTER

Create an original anthropomorphic animal hero with the following appearance:

- Small, athletic body.
- Bright deep-blue fur.
- Large expressive eyes.
- Peach/tan-colored muzzle and belly area.
- Large triangular ears.
- Several long backward-pointing spikes/quills on the back of the head.
- White gloves.
- Bright red athletic shoes with a white stripe.
- Energetic and confident appearance.
- The silhouette must communicate speed even while standing still.

The character should have several visual states:

### Idle
The character stands upright and occasionally performs a small idle animation.

### Walking
At very low speed, use a normal walking animation with clearly visible leg movement.

### Running
As speed increases, gradually transition into faster running animations.

Do NOT instantly switch from standing to maximum-speed running.

The animation must visually communicate acceleration.

### Maximum Speed
At very high speed:

- legs should animate extremely quickly;
- the character should lean slightly forward;
- movement should feel significantly faster;
- camera behavior should allow the player to see more space ahead.

### Rolling
When moving quickly and the player presses DOWN, the character curls into a compact spinning ball.

While rolling:

- preserve existing momentum;
- downhill slopes increase speed;
- uphill slopes reduce speed;
- player steering becomes weaker;
- rolling can damage enemies;
- the character should rotate rapidly based on movement speed.

The faster the character moves, the faster the ball rotates.

### Jumping

When jumping, immediately curl the character into a spinning ball.

The spinning jump should damage enemies when touching them.

Jump height should depend partly on how long the jump button is held:

- short press = lower jump;
- longer press = higher jump.

Horizontal momentum must be preserved while airborne.

Do not completely reset horizontal velocity when jumping.

---

# MOVEMENT PHYSICS

The game must use momentum-based movement.

This is critical.

The character should NOT move using simple constant-speed left/right movement.

Implement:

- acceleration;
- deceleration;
- friction;
- inertia;
- gravity;
- slope physics;
- momentum conservation;
- air control;
- rolling momentum.

Example behavior:

If the player holds RIGHT:

1. character starts walking;
2. gradually accelerates;
3. transitions into running;
4. reaches very high speed after enough time.

Releasing RIGHT should not stop the character immediately.

Instead:

- momentum should continue briefly;
- friction gradually slows the character.

Pressing the opposite direction should create braking.

Show a short braking/skidding animation when changing direction at high speed.

---

# SLOPE PHYSICS

Slopes must affect movement naturally.

Running downhill:

- increases acceleration;
- increases maximum practical speed;
- makes rolling especially effective.

Running uphill:

- decreases speed;
- may cause the character to stop if momentum is insufficient.

Rolling downhill should be one of the fastest ways to gain speed.

The terrain should constantly interact with character momentum.

---

# LOOPS

Include large 360-degree terrain loops.

The character should only successfully run through a loop if enough momentum has been accumulated.

If entering slowly:

- gravity should affect the character;
- the character may lose momentum;
- they should fall from the loop instead of magically sticking to it.

When moving quickly enough:

- smoothly follow the loop surface;
- rotate the character orientation relative to the terrain;
- transition upside down;
- continue around the loop;
- exit while maintaining momentum.

The camera must remain smooth during loops.

---

# CURVED TERRAIN

The level should contain smooth curved terrain rather than only rectangular platforms.

Include:

- gentle hills;
- steep hills;
- valleys;
- ramps;
- curved walls;
- circular loops;
- half-pipes;
- S-shaped tunnels;
- rolling hills.

Movement should feel similar to riding a roller coaster.

The player should constantly move vertically as well as horizontally.

---

# FIRST LEVEL

Create a large tropical grassland stage designed as an introduction to the movement mechanics.

Visual atmosphere:

- bright blue sky;
- large white clouds;
- distant ocean;
- tropical vegetation;
- palm trees;
- flowers;
- waterfalls;
- rocky cliffs;
- vivid green grass;
- exposed brown/orange soil under grass platforms;
- geometric patterned terrain;
- small lakes and rivers;
- wooden bridges;
- colorful flowers.

Use a colorful early-1990s 16-bit pixel-art aesthetic.

The environment should feel extremely bright, optimistic, energetic, and readable.

---

# LEVEL STRUCTURE

The stage should be significantly wider than the screen and scroll horizontally.

The player starts on the far-left side and generally progresses toward the right.

However, do NOT make the level a single straight corridor.

Create three general route types:

### Main Route

The easiest route.

Contains:

- moderate hills;
- collectibles;
- enemies;
- simple springs;
- one large loop;
- easy platforming.

### High Route

Harder to reach but safer and faster.

Reachable by:

- maintaining high speed;
- using ramps;
- jumping from springs;
- jumping from elevated terrain.

Contains:

- additional collectibles;
- fewer enemies;
- faster traversal;
- hidden bonuses;
- opportunities to maintain high speed.

The player can fall from the upper route back onto the normal route.

### Lower Route

Easier to fall into when making mistakes.

Contains:

- more enemies;
- spikes;
- pits;
- moving platforms;
- slower terrain;
- additional collectibles and secrets.

The routes should frequently reconnect.

This creates natural exploration without confusing the player.

---

# LEVEL FLOW

Design the opening sequence approximately like this:

1. Start with a relatively flat grassy area.
2. Allow the player to learn walking and acceleration.
3. Place several floating collectible objects.
4. Terrain gradually slopes downward.
5. Downhill movement increases speed.
6. Follow with a large uphill curve.
7. Add a steep downhill section.
8. Place a large circular loop that can be completed using momentum.
9. Create a ramp immediately after the loop.
10. Skilled players can use speed from the loop to launch toward an upper route.
11. Slower players remain on the standard path.
12. Introduce a short tunnel.
13. Add a spring that launches the player vertically.
14. Introduce enemies.
15. Add collapsing terrain.
16. Create another fast downhill section.
17. Add a second loop or curved tunnel.
18. Introduce moving platforms over water.
19. Place several vertical route choices.
20. Finish with a long section where the player can build maximum speed.

The overall level should repeatedly alternate:

speed → platforming → speed → obstacle → speed.

Never force the player to move slowly for too long.

---

# COLLECTIBLES

Place many small floating golden circular collectible objects throughout the level.

They should:

- appear individually;
- appear in lines;
- follow curves;
- guide the player toward ramps;
- indicate possible jump trajectories;
- reveal alternate routes;
- reward exploration.

When collected:

- play a short bright sound;
- make the object disappear;
- increase the player's collectible counter.

Display the total number in the HUD.

---

# DAMAGE SYSTEM

The collectibles also function as protection.

If the player has at least one collectible and gets hit:

- the player survives;
- many carried collectibles burst outward;
- they bounce around using physics;
- some can be collected again for a short period.

If the player has zero collectibles and gets hit:

- lose a life;
- restart from the latest checkpoint.

This mechanic should create tension without using a traditional health bar.

---

# ENEMIES

Create several small robotic enemies with simple recognizable behaviors.

Examples:

### Walking Robot

Patrols left and right on a platform.

### Flying Robot

Moves horizontally through the air.

### Crab-Like Robot

Walks slowly and periodically fires projectiles.

### Insect Robot

Moves vertically or diagonally.

Enemies should be defeated when:

- hit while the player is rolling;
- hit by the player during a spinning jump.

Touching an enemy while simply walking/running should damage the player.

Enemies should have readable silhouettes and simple animations.

---

# SPRINGS

Add mechanical spring objects.

Different spring orientations:

- upward;
- diagonal;
- horizontal.

When touched:

- instantly launch the player;
- preserve compatible momentum;
- play a strong bounce sound;
- animate compression and release.

Some springs should lead to secret upper paths.

---

# SPIKES

Include stationary spike traps.

Touching spikes causes damage.

Place them carefully so the player can see and react to them.

Do not randomly place unavoidable spikes immediately after blind high-speed sections.

---

# BREAKABLE OBJECTS

Add destructible containers / item boxes.

They can contain:

- extra collectibles;
- temporary protection;
- increased speed;
- an extra life.

Break them by jumping or rolling into them.

---

# TEMPORARY SPEED BOOST

One item should temporarily increase:

- acceleration;
- maximum speed;
- animation speed.

During the effect:

- slightly change the music tempo or playback feel;
- show a subtle speed effect;
- increase camera look-ahead.

---

# SHIELD

Add a temporary protective shield around the character.

It absorbs one hit without losing collectibles.

Use a transparent circular energy effect around the character.

---

# CHECKPOINTS

Place checkpoint markers throughout the level.

After activating one:

- animate it;
- change its visual state;
- use it as the respawn position after death.

---

# CAMERA

Implement a smooth side-scrolling camera.

Important camera behavior:

At normal speed:

- character remains near the center.

At high speed:

- move the character slightly toward the left side of the screen;
- show more level space in front of them.

The camera should smoothly adapt instead of snapping.

Vertical camera movement should follow hills and jumps with damping.

Do not make the camera shake unnecessarily.

---

# PIXEL ART STYLE

Use a polished 16-bit console-inspired pixel-art aesthetic.

Requirements:

- crisp pixel graphics;
- no anti-aliased blurry sprites;
- colorful environment;
- strong silhouettes;
- limited but vibrant palette;
- multi-layer parallax backgrounds.

The visual style should evoke premium early-1990s console games.

Do NOT use modern realistic graphics.

---

# PARALLAX BACKGROUND

Use several background layers moving at different speeds.

Example:

Layer 1:
very distant sky and clouds.

Layer 2:
distant mountains.

Layer 3:
ocean and distant islands.

Layer 4:
nearby trees and vegetation.

Foreground elements should move faster than distant scenery.

---

# ANIMATION QUALITY

Character animations should include:

- idle;
- looking upward;
- crouching;
- walking;
- jogging;
- running;
- maximum-speed running;
- braking/skidding;
- jumping;
- spinning;
- rolling;
- taking damage;
- death;
- victory.

Movement animations must transition based on actual velocity.

---

# SOUND DESIGN

Create retro 16-bit inspired sounds for:

- collecting objects;
- jumping;
- rolling;
- destroying enemies;
- spring bouncing;
- taking damage;
- losing collectibles;
- checkpoint activation;
- item pickup;
- level completion.

Add upbeat energetic chiptune-inspired background music.

Do not use any copyrighted existing music or sound effects.

Create original audio with a similar technological era and energy.

---

# HUD

Display a minimal HUD showing:

COLLECTIBLES
SCORE
TIME
LIVES

Place it in the upper-left corner.

The HUD should use a readable retro pixel font.

---

# LEVEL COMPLETION

At the far-right end of the stage, place a clear level-finish object.

When the player reaches it:

- stop the timer;
- transition into victory state;
- calculate score bonus based on remaining time;
- show a results screen.

Display:

LEVEL COMPLETE

TIME BONUS
COLLECTIBLE BONUS
TOTAL SCORE

Then allow restarting the level.

---

# GAME FEEL

The most important goal is that controlling the character feels satisfying.

Prioritize:

1. Momentum physics.
2. Acceleration.
3. Smooth slopes.
4. Rolling.
5. Speed.
6. Responsive jumping.
7. Multiple level routes.
8. Fluid camera.
9. Clear collision detection.
10. Stable performance.

The player must be able to experience two completely different play styles:

### Beginner
Move slowly, carefully jump over obstacles, use the normal route.

### Skilled Player
Use terrain, rolling, slopes, springs, jumps, and momentum to move extremely quickly through the level.

Do not artificially force speed.

Speed should be a reward for understanding the physics.

---

# IMPORTANT PHYSICS RULE

Do not fake loops, hills, ramps, or rolling using scripted animations.

The character's movement should come from actual velocity and terrain physics.

For example:

Running downhill → gain velocity.

Rolling downhill → gain even more velocity.

Running uphill → lose velocity.

Entering a loop quickly → successfully complete it.

Entering a loop slowly → lose momentum and fall.

Jumping while moving quickly → retain horizontal momentum.

These interactions are the core of the entire game.

---

# COLLISION SYSTEM

Implement reliable collision detection for:

- floors;
- ceilings;
- walls;
- curved terrain;
- slopes;
- loops;
- moving platforms;
- enemies;
- springs;
- collectibles;
- spikes.

The character must remain correctly attached to curved surfaces when enough momentum exists.

Avoid:

- clipping through terrain;
- getting stuck inside slopes;
- teleporting;
- camera jitter;
- incorrect rotation around loops.

---

# CONTROLS

Desktop controls:

LEFT / A
Move left.

RIGHT / D
Move right.

DOWN / S
Crouch or roll when moving.

UP / W
Look upward when standing.

SPACE
Jump.

R
Restart level.

ESC
Pause.

Keep the controls extremely simple.

---

# DEVELOPMENT PRIORITY

Implement the project in this order:

1. Character movement.
2. Acceleration and friction.
3. Jump physics.
4. Slopes.
5. Rolling.
6. Curved terrain.
7. Loops.
8. Camera.
9. Level geometry.
10. Collectibles.
11. Enemies.
12. Damage system.
13. Springs and traps.
14. Checkpoints.
15. Visual polish.
16. Audio.
17. UI and results screen.

Do not sacrifice movement quality to add unnecessary features.

A small polished level with excellent movement physics is better than a large game with poor controls.

---

# FINAL REQUIREMENT

The result must be a **fully playable polished 2D high-speed platformer**, not a static mockup.

The first level should take approximately **2–4 minutes for a new player**, while an experienced player using momentum and shortcuts should be able to complete it much faster.

Design the level like a roller coaster with constant rises, drops, curves, acceleration opportunities, alternate paths, loops, springs and momentum-based shortcuts.

Make the entire game playable from beginning to end.

Use original assets, original music, original enemy designs and original level geometry while preserving the core gameplay philosophy of a fast momentum-driven 16-bit platformer.