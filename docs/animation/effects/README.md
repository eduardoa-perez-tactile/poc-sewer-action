# Combat effect clips

| Clip | Supplied art | Duration | Presentation |
| --- | --- | --- | --- |
| Muzzle | `bullet/muzzle-flash.png` | 0.05 s | One small flash at successful bullet release |
| Hit | Both 16×16 cels from `art/aseprite/misc/hit.ase` | 0.2 s, 10 fps | Bullet collision feedback |
| Explosion | Intentionally reuses both hit cels | 0.2 s, 10 fps | Larger amber burst at bomb impact or expiry |
| Splash | All five existing water-splash frames | 0.5 s, 10 fps | Existing water entry feedback, preserved |

There is no supplied dedicated explosion master. The explosion is an explicit reuse of the hit
clip with a 1.28-unit quad and amber tint; it adds no damage, radius or knockback. `hit-sheet.png`
is the two hit cels concatenated horizontally without scaling; `trim=false` preserves its sheet
UVs. Individual hit PNGs and clips remain the source-frame review surface. All effect sprites
share the existing `effects` atlas.

Three stopped particle hosts reuse existing Camera, MiddleSewer and WaterSplash entities.
`burstAt` places them at world positions without moving those entities. Each burst draws one
stationary sprite particle with the authored clip's frame rate and lifetime. The adapter caps
simultaneous bursts at 2 muzzle / 4 hit / 2 explosion, deduplicates next-step event visibility,
and drops excess feedback without changing combat. Restart clears the host effects, and work
stops once every bounded lifetime expires. Splash retains its original slot, cooldown and audio.

Sim writes `CombatEffect` facts only after an accepted pooled release or resolved projectile
collision/expiry. That event and every new visual component/resource are `sim: false`. Only
LateUpdate reads the facts. Attack telegraphs, projectiles, damage, pools and death ownership
remain in their existing systems.

The contacts were reviewed for transparent backgrounds, both hit frames and all splash frames.
The combat render test verifies actual particles, cleanup, and sprite/effect corners at fold-cover,
notched phone, tablet, fold-inner and ultrawide sizes. Existing goldens remain byte-for-byte intact.
The input replay plus the existing water replay warm all effect flows on desktop/mobile/compat.
