Create a polished interactive **3D lava lamp experience using Three.js**.

The entire project should focus on one central object: a large transparent lava lamp containing a living animated lava creature.

The result should feel like a small interactive digital toy rather than a static 3D model.

The scene must be visually impressive, atmospheric, smooth, and highly polished.

---

# CORE CONCEPT

Create a futuristic lava lamp standing on a dark pedestal.

Inside the glass chamber lives a small lava monster made from glowing molten material.

The monster is not separate from the lava.

Its body should look as if it formed naturally from the moving lava inside the lamp.

The creature should:

- float inside the lamp;
- slowly rise and sink;
- deform slightly like viscous molten material;
- react to the player;
- change emotions;
- become increasingly angry when disturbed.

The player should be able to click or tap the lava lamp to interact with the creature.

---

# LAVA LAMP DESIGN

Create a detailed classic lava lamp silhouette with:

- wide metallic base;
- narrow lower connection;
- tall transparent glass chamber;
- tapered metallic cap;
- smooth rounded proportions.

The lamp should look like a premium decorative object.

Materials:

Base:
- dark brushed metal;
- slightly reflective;
- subtle roughness;
- soft highlights.

Glass:
- thick transparent glass;
- visible refraction;
- slight distortion;
- realistic reflections;
- subtle imperfections.

Inside the lamp:
- dark transparent liquid;
- glowing orange-red lava;
- volumetric-looking blobs;
- slow convection movement.

The lava should naturally form blobs that:

- rise;
- merge;
- split;
- stretch;
- compress;
- sink.

Do not make the lava look like simple floating spheres.

Use metaball-like geometry, shader deformation, marching-cubes-style surfaces, or a similar technique to create organic connected blobs.

---

# THE MONSTER

Inside the lava lamp lives a small creature formed entirely from molten lava.

The monster should have a distinctive personality.

Appearance:

- approximately 35–45% of the lamp chamber height;
- compact rounded body;
- broad upper torso;
- slightly oversized head;
- two short arms;
- two small floating or partially formed legs;
- small horn-like lava protrusions on top of its head;
- thick expressive eyebrows formed from darker crusted lava;
- large glowing eyes;
- wide expressive mouth.

Its body surface should combine:

- dark cooling volcanic crust;
- bright glowing cracks;
- molten orange-red material underneath;
- yellow-hot areas near joints and facial features.

The outer crust should slowly move and crack as the monster deforms.

Its internal glow should pulse subtly.

Color palette:

- deep black-red crust;
- dark burgundy;
- hot red;
- orange;
- bright yellow-orange in the hottest areas.

The creature should look dangerous but still slightly cute when calm.

---

# FACE

The face must be highly expressive.

Create facial controls or procedural deformation for:

- eyelids;
- eyebrows;
- pupils;
- mouth corners;
- jaw;
- cheeks.

The eyes should glow yellow-orange.

The pupils can be very dark, almost black.

The monster should look directly toward the camera or cursor occasionally.

---

# DEFAULT PERSONALITY — CALM / FRIENDLY

When the scene starts, the creature should be calm and curious.

Behavior:

- slowly floating up and down;
- gently breathing;
- blinking;
- looking around;
- watching the cursor;
- occasionally smiling;
- occasionally touching the inside of the glass;
- stretching its arms;
- making small playful motions.

Its body movement should be soft and fluid.

Idle facial expression:

- relaxed eyebrows;
- slightly open eyes;
- small friendly smile.

Occasionally it can perform small random behaviors such as:

- chasing a nearby lava bubble;
- pushing a blob of lava away;
- poking the glass from inside;
- yawning;
- looking bored;
- spinning slowly in zero-gravity-like motion.

---

# PLAYER INTERACTION

The lava lamp must react to mouse clicks or taps.

Detect clicks on the glass chamber.

Each interaction should slightly increase an internal variable:

ANGER_LEVEL

ANGER_LEVEL can range from:

0.0 = completely calm

to

1.0 = extremely angry

Clicks should not instantly make the monster furious.

The emotional transition should happen gradually.

---

# FIRST FEW CLICKS — CURIOUS

After the first click:

- monster notices the player;
- turns toward the camera;
- eyes widen;
- small lava bubbles appear.

After the second or third click:

- eyebrows lower slightly;
- monster looks confused;
- it approaches the glass;
- it taps the glass from inside.

Expression:

"Why are you doing that?"

Do not use actual text.

Communicate entirely through animation.

---

# MEDIUM ANGER

After repeated clicking:

The monster becomes clearly irritated.

Changes:

- eyebrows become sharply angled;
- eyes narrow;
- smile disappears;
- mouth becomes a frown;
- body glow becomes brighter;
- lava movement becomes faster;
- monster breathing becomes stronger.

Animations:

- crosses arms;
- shakes its head;
- points angrily toward the player;
- punches the glass lightly;
- pushes lava blobs aggressively;
- creates small bursts of bubbles.

Each glass punch should create:

- subtle glass vibration;
- circular distortion wave;
- small camera shake;
- particles inside the liquid.

---

# HIGH ANGER

At high ANGER_LEVEL:

The creature transforms into an aggressive state.

Visual changes:

- body grows slightly larger;
- shoulders broaden;
- horns grow;
- glowing cracks become brighter;
- eyes turn brighter yellow-white;
- mouth opens wider;
- teeth become visible as dark volcanic shapes;
- lava surrounding the creature begins orbiting around it.

Movement becomes much faster.

The monster should:

- swim rapidly around the lamp;
- slam into the glass;
- roar silently;
- shake its fists;
- rapidly turn toward the player;
- chase the cursor from inside the glass.

The entire lamp should begin reacting.

Effects:

- lava circulation speed increases;
- bubbles appear more frequently;
- orange light intensity increases;
- glass emits subtle heat distortion;
- lamp shakes slightly.

---

# MAXIMUM ANGER EVENT

If the player continues clicking after the monster reaches maximum anger, trigger a special animation.

Sequence:

1. Monster freezes.
2. Everything becomes unusually still for approximately one second.
3. Monster slowly looks directly toward the camera.
4. Eyes become extremely bright.
5. Its smile changes into an exaggerated angry grin.
6. Lava begins rapidly gathering around its body.
7. Monster grows temporarily larger.
8. It pulls its arm backward.
9. Monster punches the inside of the glass extremely hard.

On impact:

- strong glass distortion;
- bright flash;
- powerful camera shake;
- lava shockwave;
- bubbles shoot throughout the chamber;
- cracks briefly appear across the glass.

Important:

The glass should NOT permanently break.

After approximately one second, the cracks should disappear.

The monster should then look surprised by its own strength.

This creates a comedic moment.

---

# SECRET COMEDIC REACTION

After the maximum anger attack:

The monster should suddenly realize that it almost broke the lamp.

Its anger disappears briefly.

Animation:

- eyes widen;
- looks at the cracks;
- looks toward the player;
- awkwardly smiles;
- slowly pushes the lava against the cracks as if trying to repair them.

Then it crosses its arms and turns away from the camera.

This should make the character feel alive.

---

# ANGER DECAY

If the player stops interacting with the lamp, ANGER_LEVEL should slowly decrease.

Over approximately 15–25 seconds:

- monster breathing slows;
- lava movement slows;
- eyes return to normal;
- horns shrink;
- facial expression becomes neutral;
- body glow returns to normal.

Eventually the monster becomes friendly again.

---

# OPTIONAL FRIENDSHIP INTERACTION

Add another interaction type.

If the player holds the mouse button instead of repeatedly clicking:

Treat it like gently touching the glass.

After holding for approximately 1 second:

- monster approaches the glass;
- places its hand against the inside;
- looks at the cursor;
- smiles.

This should decrease ANGER_LEVEL.

If the player gently interacts after making the monster angry, it can slowly calm down.

---

# CURSOR TRACKING

The monster should sometimes track the mouse cursor.

Convert mouse coordinates into approximate positions on the glass.

The monster's:

- eyes;
- head;
- upper body

should subtly rotate toward the cursor.

At high anger:

the monster aggressively follows the cursor.

At low anger:

it follows curiously.

---

# BODY DEFORMATION

The monster should never feel rigid.

Its entire body should have subtle procedural deformation.

Use:

- noise;
- sine waves;
- vertex displacement;
- shader animation.

The surface should slowly move like hot viscous material.

Arms and body should stretch slightly during movement.

When punching:

the arm should briefly stretch like elastic lava.

When returning:

it should compress and regain shape.

---

# LAVA INTERACTION

The monster should physically influence nearby lava blobs.

Examples:

When swimming:
- lava moves around the body.

When punching:
- nearby blobs move away.

When angry:
- blobs orbit or gather around the creature.

When calm:
- small blobs float around it slowly.

Some lava blobs may temporarily attach to the monster and merge with its body.

---

# LIGHTING

Use dramatic cinematic lighting.

Main lighting sources:

1. Internal orange-red light from the lava.
2. Soft cool blue rim light from the environment.
3. Warm light emitted by the monster.

The lava should illuminate:

- the monster;
- glass;
- metal base;
- nearby floor.

When ANGER_LEVEL increases:

the internal light should become brighter and more red.

---

# ENVIRONMENT

Place the lamp in a minimal dark studio environment.

Background:

- very dark blue-black;
- subtle gradient;
- faint volumetric atmosphere.

Floor:

- dark reflective surface;
- soft reflection of the lamp.

Add subtle fog.

Do not add unnecessary objects.

The lamp must remain the center of attention.

---

# CAMERA

Use a perspective camera.

Initial composition:

- lamp centered;
- slightly low camera angle;
- full lamp visible;
- enough empty space around it.

Allow subtle mouse-controlled parallax.

Camera movement should be smooth and limited.

The user should not be able to accidentally rotate completely behind the lamp.

Optional:

allow small orbit movement within approximately:

- ±20° horizontally;
- ±10° vertically.

---

# CAMERA REACTIONS

When the creature performs strong actions:

small glass hit:
- tiny camera impulse.

large punch:
- stronger camera shake.

Never make the camera movement uncomfortable.

Use smooth damping.

---

# PARTICLES

Add small glowing particles inside the lamp.

Types:

- tiny lava sparks;
- bubbles;
- glowing dust;
- occasional hot fragments.

Particle density should increase with ANGER_LEVEL.

---

# POST-PROCESSING

Use subtle post-processing.

Recommended:

- bloom;
- tone mapping;
- slight vignette;
- mild chromatic aberration during powerful impacts only;
- subtle depth of field if performance allows.

Bloom should mainly affect:

- monster eyes;
- glowing cracks;
- lava;
- hot bubbles.

Do not overuse bloom.

Keep the image readable.

---

# SOUND DESIGN

If audio is supported, create procedural or original sounds.

Ambient:

- low liquid bubbling;
- subtle electrical hum.

Monster:

- soft lava gurgles;
- tiny growls;
- frustrated noises;
- angry rumble.

Interactions:

- glass taps;
- liquid splashes;
- bass impact on punch.

At maximum anger:

use a deep rumble followed by a strong impact.

Do not use copyrighted audio.

---

# TECHNICAL REQUIREMENTS

Use:

- Three.js;
- WebGL;
- requestAnimationFrame;
- responsive canvas;
- smooth delta-time-based animation.

Recommended techniques:

- custom GLSL shaders for lava;
- MeshPhysicalMaterial for glass;
- emissive materials;
- procedural vertex displacement;
- raycasting for interaction;
- post-processing with EffectComposer.

Target:

60 FPS on a modern desktop browser.

Avoid excessive polygon counts.

---

# PROJECT STRUCTURE

Organize the code cleanly.

Separate systems for:

- scene initialization;
- camera;
- lighting;
- lava simulation;
- monster model;
- monster animation;
- facial expressions;
- interaction;
- emotion state;
- particles;
- sound;
- post-processing.

Use reusable functions/classes instead of putting everything inside one giant script.

---

# EMOTION SYSTEM

Implement an explicit monster state system.

Possible states:

CALM

CURIOUS

ANNOYED

ANGRY

FURIOUS

SURPRISED

EMBARRASSED

RETURNING_TO_CALM

Transitions should depend on:

- ANGER_LEVEL;
- number of clicks;
- time since last interaction;
- special animation state.

Do not instantly snap between expressions.

Blend animations and facial expressions smoothly.

---

# IMPORTANT DETAIL

The monster's emotional state must be visible even if the player cannot see the UI.

Do not display an anger meter.

Communicate everything through:

- body language;
- facial expressions;
- animation speed;
- lava movement;
- lighting;
- particles;
- sound.

---

# FINAL EXPERIENCE

The final project should feel like a premium interactive Three.js character demo.

The user should naturally discover that the creature has a personality.

The ideal interaction flow:

The player sees a cute lava creature.

They click the lamp.

The creature notices them.

They click again.

The creature becomes suspicious.

They keep clicking.

The monster becomes annoyed.

More clicks make it furious.

The entire lava lamp starts reacting.

The monster eventually performs an exaggerated attack against the glass.

Then it realizes it went too far and becomes embarrassed.

If the player leaves it alone, it slowly calms down and becomes friendly again.

Make the transitions smooth, funny, visually satisfying, and full of personality.

The lava lamp itself should remain beautiful even when the player does nothing.

The final result must be fully interactive and playable directly in the browser.