# Recovery #66: authored sewer environment

The renderer emitted no native tilemap geometry. Previous full-route terrain was 52 flat
Shape rectangles; the first room did not even have that fallback. Both now use source-art
terrain strips baked from the exact collision occupancy. Each horizontal run is one sprite,
with source left/right corners, surface tiles and buried wall tiles; complete terrain has 29
sprites. No collision cells, movement rules or combat rules changed. `tools/recovery-build-terrain.py`
rebuilds the strips from both tilemaps and the first-party 16px tileset. Stable `.gmeta` GUIDs
are kept when rebaking. The runtime sprite's extent is exactly the collision run's extent.

Terrain, background walls and water now use **32 source pixels per world unit**. Actor
frames retain their original finer 50px/wu presentation scale: inspection of the corrected
1280x720 landscape capture showed the hero already ~92px tall, so enlarging it would worsen
framing. The earlier ~34px baseline was a portrait ViewInfo capture at landscape screenshot
resolution. Bounds remain the same authoritative 0.7x1.5. Native Tilemap remains on Background,
behind the explicit fallback; it can be removed if native geometry is later proven correct.

Backdrop, wall and ceiling repeat using original aspect ratios at separated parallax depths.
The supplied `front` image is actually an opaque wall across its central opening, so rendering
that whole image on Foreground would hide actors. It remains a near background wall. A derived
52px ceiling canopy is genuinely Foreground and stays above the traversal band. Water no longer
stretches source pixels horizontally by four: 64x32 front water is 2x1 world units; 64x12 rear
water is 2x0.375. Both are positioned at the authoritative -3 surface and hold still. All new
art uses the existing named environment atlas and no per-frame terrain logic.

All four gameplay scenes receive the same composition and player VisualOffset. The camera
keeps the complete authored 12x6.75 traversal frame; HUD reserve is owned by #68. Background
repeat spans provide bleed for tablet and ultrawide desktop views. The declared web platform
still has no browser build in this engine; this recovery targets the actual desktop renderer.

## Verification

Focused tests in `tests/recovery-environment.test.ts` prove every collision cell is covered
exactly once by textured terrain, no terrain Shapes remain, the complete run count is 29,
first-room fallback exists, and the initial camera draw load stays bounded. Integration goldens,
full route validation and pipeline recordings are the coordinator's responsibility because
presentation pixels and authored scene entity order intentionally changed.

Focused V8 T0 tests pass (both environment coverage tests plus the complete 706-step route).
Focused terrain T1 draw assertion passes at <=16 draws; the wrapper aggregate remains false
until stale replay scene hashes are updated. Bundle and canonical scene validation pass.
Terrain construction ran once in the focused release desktop test (~2.13ms); no recurring
terrain work is added. Real phone GPU/thermal measurements remain outstanding.

Use `.gameengine/baseline-landscape.png` for comparison: the earlier baseline-gameplay.png
had portrait ViewInfo at landscape screenshot resolution. Corrected landscape review showed
actors already readable, so actor enlargement was reverted. Debug route arrows are hidden,
large prose signs cleared, and outlet guidance reduced to a small muted label. Feedback #67
requested three transparent trail hosts and one stopped dust host per gameplay scene; these
are authored here and activated by its presentation adapter. The reviewed recovery-intake.png
shows detailed textured surfaces, unwarped water, full backdrop coverage and readable actors.

Android cook exposed a 2048px strip exceeding page capacity once atlas gutters were included.
All strips now cap at 64 cells / 1024px, adding three terrain sprites (29 complete).
Chunk boundaries retain neighbor-selected source tiles, so artificial caps never appear at seams.

After the gutter fix, both Android and desktop cooks pass without warnings. Each reports
four total atlas pages / 3,649,728 bytes, including one 1088x724 environment page / 3,151,056
bytes. The compressed base bundle is 362,452 bytes Android / 362,450 bytes desktop. These
are artifact/cooked residency figures; they do not claim phone frame timing or thermal results.
