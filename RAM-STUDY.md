# Three.js photo ram study

Open ram-study.html through an HTTP server. Default: 1200 photo instances using the supplied 12 demo portraits. Buttons select 800/1200/1600; photographs are redistributed over the same curved horn surface at each count. Main lottery scene uses the unified procedural geometry as well.

No reference-image plane is rendered. The scene uses real instanced photo planes, volumetric particle surfaces, neon line geometry, orbit particles, and a separable glow pass in the study page. Android MSAA is disabled after blank-frame reproduction on connected Chrome 119.

Validation: seven existing smoke suites passed. 960x540 canvas captures on connected Android Chrome show 800, 1200, and 1600 variants. WebGL getError returned 0. Captures are in previews/unified-{count}.png. 1200 remains the default balance; 800 has wider gaps and 1600 has more overlap.

Visual acceptance is NOT complete: the reference has thicker horns, larger expressive eyes/nose, richer fleece shoulders and atmospheric depth. No defensible 95% similarity claim is made. This is a working study, not a visually accepted final replica.
