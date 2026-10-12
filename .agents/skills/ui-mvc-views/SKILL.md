---
name: ui-mvc-views
version: 1.18.0
tier: required
description: Game UI as MVC views — defineView with a model and samples, UI documents (*.ui.json: looks in data, motion in code), a controller that fills it from the world, intents back, the view stack, stylesheets, UI animation (fx-* effects, @keyframes, view enter/exit, ui.animate) and sprite drawing (9-slice borders, fills, tiling, mirroring, object-fit, blend modes, overflow clipping), view layers (screen/popup/overlay, loading covers on top), dialogs that dim with the stack's one scrim (dims, ui.scrim), lists and pooled lists (For, Pooled, ScrollView drag/fling/wheel scrolling, scroll-snap and overscroll bounce, what UI costs per frame, node budgets), pointer positions and drags in handlers (onPress/onDrag events), per-field useResource, particles, 3D models (skinned characters playing clips, framed portraits), 2D skeletons and flipbook clips inside views, text (rich markup, auto size, outlines), and the Unity Image/TextMeshPro/CanvasScaler mapping. Use for any HUD, menu or popup, and when porting Unity UI.
---

# UI: views, controllers, intents

**View** (`src/views/<name>.view.tsx`): shows only its model, raises intents, has samples.

```tsx
export const HudView = defineView<{ score: number; movesLeft: number }>({
  name: 'Hud',
  description: 'Score and moves. Intents: pause.',
  samples: { start: { score: 0, movesLeft: 20 }, lastMove: { score: 2980, movesLeft: 1 } },
  render: (model, { intent }) => (
    <Screen safeArea class="hud">
      <Text class="score">{() => model().score}</Text>
      <Button id="pause" icon="ui/pause" haptic="light" onPress={() => intent('pause')} />
    </Screen>
  ),
});
```

**Controller** (`src/ui/*.tsx`, in `defineUI`): reads the world, pushes views, turns intents into sim events.

```ts
const score = useResource(Score);
const hud = views.push(HudView, untrack(() => ({ score: score().value, movesLeft: 20 })), {
  onIntent: (name) => name === 'pause' && emit(PauseRequested, { paused: true }),
});
createEffect(() => hud.update({ score: score().value, movesLeft: 20 }));
```

- Views never touch the world or services; controllers never build UI. That split is what makes views previewable.
- `useResource(T)` subscribes **per field**: it returns a live, read-only record, and an effect re-runs only when a field it read changed. A HUD reading `board().phase` does not re-run when `board().timer` moves every step, so a resource that changes every step needs no separate presentation-only copy. Keep a snapshot with `{ ...board() }` (the record itself always reads current values); it is `null` while the resource does not exist. `untrack(board)` returns the live record, whose field reads still subscribe: read untracked fields inside the callback, `untrack(() => board().phase)` or `untrack(() => ({ ...score() }))`.
- `useDoc(doc)` does the same for a world document or a `metaInWorld` handle (`useDoc(shopState)`): it re-runs when the document's version changes and returns the same frozen value until then.
- What the UI still costs per frame, for all `defineUI` systems together (the first to run in a frame refreshes for all): one host call for every tracked resource's change tick, one for input (`ui.poll`), one to send queued node ops when there are any, and one per `useDoc` document (its version). A resource whose tick moved is read once (one host call) and compared field by field; only effects of changed fields run, and only changed props queue ops.
- Styles go in `ui/*.style.css` (classes, `@media (aspect > 0.7)`); prefix a view's classes with its name.
- Every state a view can be in gets a sample. Check: `gameengine view render Hud --sample lastMove --out hud.png` (`--model '<json>'` for any other state, `--size 393x852 --safe 0,59,0,34` for a device; MCP `view_render`).
- Check a layout on a slim and a wide screen in one call: `gameengine view render Hud --sample lastMove --devices` renders it on `pixel-8` (20:9) and `ipad-10` (4:3), each with its own size, scale and safe area, side by side (stacked with `--landscape`); `--devices iphone-se,galaxy-tab-s9` picks others. `--json` (and MCP `view_render` with `devices`) gives each device's rect in the sheet.
- Every view must hold from 9:22 phones to 3:4 tablets: flex bars instead of fixed `top`, `text-fit` on labels, `max-width` on tablets. Skill `screen-fit` has the rules and the device table.
- In the editor, the **Views** mode finds a view by any word in it, sets model values as fields, and writes a drag or resize of an element on the stage into the strongest stylesheet rule that styles it (`left`/`top`, `width`/`height` in CSS px). Inline `style` props win over rules, so keep positions in `ui/*.style.css`.
- Popups stack: `views.push` returns a handle with `update` and `close`.
- **Dialogs dim with the stack's scrim:** never draw a backdrop in a view. `defineView({ dims: true, blockInput: true, … })` (or `views.push(V, m, { dims: true })`) asks the stack to draw its one scrim just under the view: the project's `ui.scrim` (`{ "color": "#05070d", "opacity": 0.6, "ms": 220 }` in `project.gameengine.json`). A second dimming dialog takes the scrim, and it moves back once that one is gone; it fades in with the first and out with the last one's exit. UI documents of kind `view` (`<Widget doc="no-lives" />` as a view's whole render) bring their own behaviour: Enter / Exit poses, screens that cover and uncover, and `tapOutside: dismiss` sending a `dismiss` intent.
- **Code areas put your TSX inside a UI document:** a document's `codeArea` node (`{ "type": "codeArea", "key": "content" }`) is an empty, laid-out box. Fill it from the code that places the document: `<Widget doc="art-quit" codeAreas={{ 'quit.content': <Text>…</Text> }} />` (a placed widget's area as `<use key>.<area key>`, the document's own as `content`). What you pass stays yours: a document reload takes it out of the area and puts it back, never destroys it, and the document's states may hide, fade, move or scale the area but never restyle what is in it. The editor's View panel shows the generated controller type with each area as `UINode`.
- **Layers:** views draw by layer — `screen` (default), then `popup`, then `overlay` — and in push order within a layer. Set it on the view (`defineView({ layer: 'popup' })`) or per push (`views.push(V, m, { layer: 'overlay' })`). A loading cover (`loading.run`/`loading.boot`) draws above every layer: a HUD or menu pushed while it is up (or in the same frame, after it) lands under it. `views.pop()` and `views.clear()` leave the cover (and the cheat console, also on top) to their owners; `views.top()` still names them while they are up (`LoadingView`, `CheatConsole`). `views.pushBelow(cover, V, m)` puts `V` on top of its own layer, under the cover. A `defineUI` root element mounted while a cover is up also goes under it. To start a level in place, clear the old views and push the new ones in `loading.run({ onCovered })` (skill `asset-memory`).
- Button feedback for the whole project goes in `project.gameengine.json`, not on every button:
  `"ui": { "button": { "haptic": "light", "hapticOn": "click", "sound": "audio/tap", "volume": 0.8 } }`.
  A button's own `haptic` / `sound` wins (`null` opts out); `sound={{ src: 'audio/buy', volume: 0.5 }}` sets a volume;
  the sound plays on the UI bus as presentation (`audio.play`): it never reaches the sim, a replay or the hash, and a
  test sees it in `audio.sounds()`;
  `hapticOn: 'click'` plays on the completed tap as Unity's `onClick` does (default `press`: touch-down).
  `haptic` takes a preset or a `haptics.json` entry name tuned per platform (skill `haptics`).
- An `emit` while the UI first mounts (the root or its first effect run) reaches the sim on the next step.

## Lists, pooled lists and what UI costs

What a frame costs is the **shown** UI that **changed** (ADR 0094): a change restyles the changed node and its subtree, and relays out only what Taffy sees change; a frame with no UI change does no styling or layout. `display: none` subtrees and detached nodes cost nothing per frame (only memory). So:

- `<For each={() => items()}>{(item, i) => …}</For>` builds an item's UI when it arrives and destroys it when it leaves; items that stay are not touched.
- `<Pooled each={() => flights()} warm={{ count: 30, item: idle }} max={64} name="flights">{(f, i) => <Flight f={f()} />}</Pooled>` parks the UI of items that leave (detached) and hands it to the next item that comes: `item` and `index` are accessors, so read `f()` inside reactive props. A reused or first-shown UI replays its CSS animations as a new element does, and does not transition from its old style. Use it for UI that comes and goes many times a second (flying icons, floating texts, hit numbers); `warm` builds item UIs up front (during a loading screen), `max` caps the idle ones kept. `uiPoolStats()` gives `active`, `idle`, `peak`, `created` and `dropped` per list: set `warm` to the `peak` of your busiest level.
- **Never pool UI by hiding it** (`display: none` / `opacity: 0` slots that are shown by a class): it works, but every per-item effect keeps running, and on engines before ADR 0094 every hidden node was restyled and laid out every frame. Unmount it, or use `<Pooled>`.
- A node shown again after `display: none`, or inserted again after a detach, replays its CSS animations (as in a browser).
- **Scrolling lists:** `<ScrollView id="levels" class="levels" contentClass="level-rows" onScroll={(e) => …}>{rows}</ScrollView>` (CSS `overflow: scroll`, or `overflow-y` / `overflow-x`). Give it a size (`height`, or `flex-grow: 1` in a column); its children sit in a content container (`contentClass` for `padding` / `gap`) that grows with them, and `horizontal` lays them out in a row. A drag scrolls it once it moves past about 2 mm (30 reference px): the Button it started on gets `pressOut` and no `press`, so dragging a list never taps a row; a release flings it, a touch stops a fling (and taps nothing), and the mouse wheel scrolls the list under the mouse on desktop. The offset is presentation (never in the sim or replays); rows scrolled out of view draw nothing, and `ui.rect`, `ui.press`, `ui.interactables` follow the scroll. `scroll-snap: <length> | pages` settles a released list on the next row (or page) in the direction it moved; `overscroll: bounce` stretches it past an edge and eases back. Long lists: rows still exist as nodes, so past a few hundred use `<Pooled>` inside it and keep the node budget below (a UI document's Repeat in a scroll element is virtual: only the rows in view exist).
- **Handlers get the pointer:** `onPress`, `onPressIn`, `onPressOut` receive `{ x, y, dx, dy }` (view px, as `ui.rect`: where the pointer is and how far it moved since the press began); `() => …` handlers keep working. `onDrag={(e) => …}` fires on every move while the element is held (a slider, a drag handle); a ScrollView around it leaves its drags to it. `onScroll` gets the new offset (`x`, `y`) and the change (`dx`, `dy`).
- **What a node draws:** `gameengine ui layout [<id>]` prints the tree with each node's screen box after transforms, scroll and clipping (`hidden` when it is off screen or transparent), opacity, text size and line count, `OVERFLOWS` when text is larger than its box (cut off, or spilling out: no ellipsis is drawn), and scroll offsets; `--json` (MCP `ui_layout`, protocol `ui.layout`) adds a style summary per node.
- **Node budget:** `gameengine check` lays the UI out during its smoke run and reports the most nodes shown at once (`ui nodes`); above 1000 it warns, and `check.smoke.uiNodes` in `project.gameengine.json` makes a budget it fails on. Rough guide per device class: phone-low 600, phone 1200, tablet 2000 shown nodes. Profile with `gameengine run --headless --ui-layout` and `perf.stats` / `profile.markers` (`ui.cascade`, `ui.layout`, `ui.paint` markers with node counts).

## UI documents: looks in data, motion in code

A **UI document** (`ui/**/*.ui.json`, ADR 0122) holds what a person edits in the editor's UI documents mode:
structure, layout, images (9-slice from the texture's `.gmeta`), text, and the looks of states (Pressed,
Disabled), yes/no and enum poses with their transitions. The view stays TSX: its controller fills the
document's properties from the model, maps its events to intents and does all motion.

```tsx
render: (model, { intent }) => (
  <Screen class="pause"><Screen safeArea><View class="safe"><View class="a-bot">
    <Widget
      doc="pause-menu"
      class="pause-menu"                                    // placing it: position in ui/*.style.css
      props={{ music: () => model().music, canQuit: () => model().canQuit }}
      sounds={{ 'pause-quit': { src: 'audio/ui/back', volume: 0.5 } }}  // a placed button's own press sound
      refs={(key, node) => {                                // each point and placed widget, again on hot reload
        const i = UNFOLD.indexOf(key);
        if (i >= 0) ui.animate(node, `pause-open-${i + 1}`, { duration: 250, delay: i * 30, fill: 'both' });
      }}
      onIntent={(_, e) => intent(INTENTS[e.path.at(-1) ?? '']!)}  // the pressed use's key is the path's last
    />
  </View></View></Screen></Screen>
),
```

- **Put in the document:** elements, labels, icons, images, placed widgets (`use`, keyed: the key is the element
  id `ui.press` and tests find), Repeats over a list property, and every look that follows state: Pressed scale,
  a toggle's grey-and-struck pose, a slide out (`shown: no` → `ty`), how many goal slots show.
- **Keep in code (the view):** entrances, loops, staggers and one-off moments: `ui.animate` / `ui.stagger` on
  the nodes `refs` hands you (a document's `point`s by name, placed widgets by key, nested as `<key>.<key>`),
  with `@keyframes` in `ui/*.style.css` or `fx-*`. A pop when a number changes is an effect in the view that
  animates the label's point. `refs` runs while the widget builds, after effects the view created first:
  start an entrance that depends on the state at open from `refs`, later changes from an effect.
- **Fill code areas with TSX** for what a document has no node for: rich text (`<Text rich>`), `<Particles>`,
  pooled sprites (`codeAreas={{ 'cons.text': <Text rich …/> }}`).
- **Screen fit stays TSX/CSS:** place a document inside the view's anchors (`.a-top`, `.a-bot`, …) with a class
  that positions it; one document per anchor group. Documents do not read `@media` or CSS variables.
- Texts that depend on game state (`Level 9`, `Try Again`) are text properties the view sets (`t('main.level',
  { n })`); a number in a label is a `{count}` placeholder. A label never changes its text per state: use two
  labels with hide poses. Enum values are kebab-case words (`one`, not `1`). `clip: true` clips an element's
  children; `fitMin` shrinks a label's text to fit.
- A texture's `.gmeta` `body` (a button's hard shadow below the box) applies to document elements and CSS
  backgrounds, not to a TSX `<Sprite>` leaf: TSX keeps its `bottom: -16px`-style overhang.
- Check each ported view against the old one: `gameengine view render <View> --sample s --out a.png` before and
  after, on a slim and a wide device; keep element ids so flow tests pass unchanged.

## Animation

UI motion is CSS played natively over UI time (presentation: no JS per frame, never in sim systems).
Reach for the built-in effects first; every project has them, below its own stylesheets.

| Enter | Exit | Attention (once) | Loops |
|---|---|---|---|
| `fx-pop-in` `fx-fade-in` `fx-scale-in` `fx-slide-in-up/down/left/right` | `fx-pop-out` `fx-fade-out` `fx-slide-out-up/down/left/right` | `fx-bounce` `fx-shake` `fx-wiggle` `fx-attention` `fx-pop` `fx-pulse` | `fx-pulse-loop` `fx-glow-loop` `fx-heartbeat` |

Tune per element: `--fx-duration` (`0.5s`), `--fx-delay`, `--fx-strength` (1 = normal, 2 = bigger), `--fx-distance` (slides, px).

```tsx
// A view that pops in, fades out and is modal: defaults for every push.
export const Reward = defineView<RewardModel>({ name: 'Reward', samples, enter: 'fx-pop-in', exit: 'fx-fade-out', blockInput: true, render });
views.push(Reward, model, { enter: 'fx-slide-in-up' }); // override per push; `null` = none
views.pop();                                             // leaves the stack now, nodes go after the exit
// A looping CTA and stars that land one after another, all in TSX/CSS:
<Button class="collect fx-pulse-loop" label="Collect" onPress={() => intent('collect')} />
{[0, 1, 2].map((i) => <Sprite src="ui/star" class="star fx-pop-in" style={{ '--fx-delay': `${0.25 + i * 0.12}s` }} />)}
<Text animateOnChange={{ effect: 'fx-pop', strength: 1.5 }}>{() => model().coins}</Text>
```

From controllers (Web Animations shape, ms): `ui.animate(ref, 'fx-bounce', { duration, delay, iterations, easing, strength })`
→ `{ finished: Promise<boolean>, cancel, pause, play, finish }`; `ui.stagger(parentRef | refs, 'fx-slide-in-left', { each: 40, from: 'start' | 'end' | 'center' })`.
Get refs with `ref={(n) => (node = n)}`. `finished` never rejects (false when cancelled or removed).

Own motion is plain CSS: `@keyframes` (`from`/`to`/`%`, per-keyframe `animation-timing-function`) and `animation` /
`animation-*` (iteration-count incl. `infinite`, direction, fill-mode, play-state, `animation-composition: add` to layer on the
element's own transform). Animatable: `transform`, `opacity`, `background-color`, `color`, `border-color`, `tint`,
`text-stroke`, `text-shadow`, `border-radius`. Easings: CSS names, the engine set (`out-back`, `in-out-sine`, …),
`cubic-bezier()`, `steps()`, or a formula of the progress `t` with `expr()` (evaluated natively; it may leave 0..1):
a Unity shake `sin(t·(1+8t)·4π)·max·(1−t)` is two keyframes (`rotate(0)` → `rotate(<max>)`) with
`animation-timing-function: expr(sin(t * (1 + 8 * t) * 4 * pi) * (1 - t))` (or `easing: 'expr(…)'` in `ui.animate`) —
no baked samples. Names: `t`, `pi`, `e`; functions `sin cos tan abs sqrt exp floor fract sign min max pow step clamp mix smoothstep`.
`var(--x, fallback)` and `calc()` work in any value; `calc()` mixes units, takes parentheses and scales `env()`:
`padding-top: calc(env(safe-area-inset-top) * 0.5 + 20px)` (`%` only combines with `%`).

- Reduced motion is honoured for you (`ui.setReducedMotion(true)` from a settings toggle, `ui.reducedMotion` in
  `project.gameengine.json`): motion is dropped, enters/exits become short fades. Style extra cases with
  `@media (prefers-reduced-motion: reduce)`.
- Check it without a device: `gameengine view render Reward --times 0,0.1,0.2,0.4 --out reward.png` writes a contact sheet
  (enter from t=0); `--phase exit` samples the exit instead, from the pop of the view at rest (its enter and CSS animations
  ended). `--json` reports `span`, the transition's length without loops, to pick times from. The editor's Views mode has
  Preview in / Preview out (both devices, a timeline to play and step the frames); UI Preview has Replay, Pause and a scrubber.
- In tests, UI time advances by the fixed step: `const f = ui.animate(n, 'fx-bounce').finished`, set a flag in `.then`,
  `await step(n)` (world tests may only await `step`), and a `renderTest` screenshot at a fixed step is a stable golden.

## Particles, 3D models and 2D skeletons in views

All three are elements: they draw in **tree order** (siblings before them behind, after them in front), scale with the canvas
and are clipped by an `overflow: hidden` parent, like a Sprite. Size and place their box with CSS.

```tsx
<View class="medal">                                     {/* overflow: hidden clips the glow */}
  <Particles class="glow" effect="vfx/shine.vfx.json" />  {/* behind the coin */}
  <Model class="coin" mesh="builtin:torus" material="ui/coin.mat.json" rotation={[90, 0, 0]} spin={120} bob={[0.06, 1.6]} />
</View>
<Particles class="confetti" effect="vfx/confetti.vfx.json" restart={() => model().opened} />  {/* last: in front */}
<Model mesh={item.mesh} color={item.color} rotation={[20, 35, 0]} />  {/* a still list item: renders once */}
<Model class="portrait" mesh="models/hero/Hero.fbx" animation={() => `models/hero/Hero@${model().line}.fbx#${model().line}`}
  loop={false} mix={0.2} queue={{ animation: 'models/hero/Hero@Idle.fbx#Idle', mix: 0.3 }} restart={() => model().lines}
  camera={{ fov: 30, distance: 0.6, pitch: 0, target: [0, 1.6, 0] }} onFinish={() => intent('lineDone')} />  {/* a talking head */}
<Skeleton class="cat" skeleton="rig/cat.skeleton2d.json" animation={() => model().mood} mix={0.25}
  queue={() => (model().mood === 'cheer' ? 'idle' : null)} restart={() => model().cheers} skin={() => model().skin} />
```

- `Particles`: `effect` (a `*.vfx.json`, see the `vfx` skill), `emitting` (false stops, live particles finish; true again
  restarts), `restart` (a new value replays the effect from the start: put a counter in the model and bump it from the
  controller or an intent), `unit` (reference px per effect unit, default 100), `seed`. Emits from the box's centre.
- `Model`: `mesh`, `material`, `color`, `rotation` (Euler degrees), `spin` (deg/s about Y, or `[x, y, z]`), `bob`
  (`amplitude` or `[amplitude, seconds]`), `scale`, `camera: { fov, distance, pitch, yaw }`, `light: { direction, color,
  intensity, ambient }`. Rendered into a shared render-target page and drawn as a sprite; it renders again only when a
  prop or its pose changes. `spin`/`bob` re-render it every frame: keep them to the item in focus in long lists, and pin it
  in a test with `render.stats().uiModelsRendered`. `camera.target` (`[x, y, z]`, model units after `scale`) is the point
  the camera orbits and looks at: frame a head on a full-body model with it and a short `distance` (a Unity porthole's
  orthographic size `s` at model scale `k` is about `distance = s / k / tan(fov / 2)` with `target` at the head).
- **Clips on a skinned `Model`** (the `models-3d` skill imports them): `animation` (`file#clip`, e.g. Unity's
  `Hero@Talk.fbx#Talk`, or a clip of the mesh's own file; a changed name plays it, cross-fading over `mix` seconds;
  `null` is the bind pose), `loop` (default true), `queue` (`'Idle'`, or `{ animation, loop, mix }`: what follows a
  one-shot, starting `mix` seconds before its end), `restart` (a counter: replays `animation`), `timeScale` and `speed`
  (multiplied; 0 holds the pose) and `onFinish()` (a one-shot `animation` reached its end, once per play; a clip that
  is not in the file plays nothing and never finishes; the UI warns once in the console). The clip plays
  on **UI time** in the host and poses through the world's skinning code (joints matched by name, as `*.animctrl.json`
  clips): no `Animator`, no hash, and a contact sheet shows the pose at each time. A playing clip renders every frame; a
  finished one-shot without a queue, or `timeScale: 0`, renders once. One clip at a time with one cross-fade: blend
  trees, layers, masks and IK stay on a world `Animator`. `overflow: hidden` clips to a rectangle (sprite-shaped masks are
  not supported yet), so a round portrait needs a ring frame drawn over the model.
- `Skeleton` (a `*.skeleton2d.json`, see the `skeleton-2d` skill): the same play/queue/mix API as `Skeleton2D`, as props.
  `animation` (a changed name plays it on the base track, cross-fading over `mix` seconds), `loop` (default true),
  `queue` (`'idle'`, or `{ animation, loop, additive, mix, delay }`: what follows when it ends), `restart` (a new value plays
  `animation` again: a counter for a one-shot that is already the current name), `timeScale`, `layers` (tracks 1–7 over the
  base: `[{ animation: 'blink', alpha, loop, additive, mix, queue, timeScale, restart }]`; `additive` adds the layer's bone
  offsets to the base instead of replacing them), `skin`, `speed` (every track; 0 holds
  the pose), `color`, `flip` (`'x' | 'y' | 'both'`), `scale` (zoom) and `bounds` (`[minX, minY, maxX, maxY]` skeleton px
  to fit into the box; default the setup pose's, so pass it when an animation reaches past the setup pose). It plays on
  **UI time** in the host, never in the sim: no `Skeleton2DEvent`s, no hash, no entity; a seek or contact sheet shows the
  pose at that time. Rendered into the same page as `Model`s: a playing skeleton renders every frame, a paused or
  finished one once (`render.stats().uiModelsRendered`). Game logic that reacts to a character's animation events stays a
  world `Skeleton2D`.
- `Flipbook` (a `*.clip2d.json`, see the `flipbook-2d` skill): `clip`, `playing` (false holds the frame), `loop`
  (`'asset' | 'once' | 'loop' | 'pingpong'`), `speed`, `restart` (a counter: replays from the start), `color`, `flip`,
  `onEvent(e)` (the clip's frame events: `e.name`, `e.frame`, `e.int`, …) and `onFinish()` (a `once` clip ended; it
  holds its last frame). The frame's sprite is stretched over the box: size it to the frames' aspect in CSS. Keyed
  `offset` moves it in box sizes. It draws as a plain batched sprite (no render target), so lists of animated icons are
  cheap. UI time, presentation only: game rules keyed to frames stay on a world `Clip2D`. Events fire on rendered
  frames (test them in a `renderTest` that calls `render.stats`, as `samples/rig-yard/tests/flipbook-view.test.ts`);
  a looping clip shown after being hidden reports at most its last cycle.
- **CSS sprites vs UI particles:** a few hand-placed sprites that pop, pulse or slide → `fx-*` / `@keyframes` on a
  `Sprite` (exact, art-directed). Many randomised bits (confetti, sparkles, coin bursts, glints) or an effect that already
  exists as `.vfx.json` → `<Particles>`. Anything in the game scene → a world `ParticleSystem`, not the UI.
- Both preview, scrub and render as contact sheets like the rest of the view (UI time), and `renderTest` goldens are stable.
- Unity ports: a `ParticleSystem` under a Canvas (UIParticle, Coffee.UIExtensions) → `<Particles>` with the converted
  effect; a `RawImage` showing a `RenderTexture` from a 3D preview camera → `<Model>` (an `Animator` playing the
  character's `model@clip.fbx` takes → `animation`/`queue` props, the camera's framing → `camera.target`/`distance`); a Spine `SkeletonGraphic` (a HUD
  character, a menu icon) → `<Skeleton>` with the imported rig (`spine-import`), never a baked flipbook; an `Animator`/`SpriteRenderer` frame
  animation on a UI `Image` → `<Flipbook>` with the clip; `AnimationState`
  calls from the view's script (`SetAnimation`, `AddAnimation`, `timeScale`, `Skin`) → props driven by the model.

## Layout for Unity ports

Layout is flexbox and grid (Taffy); Unity's layout groups map onto them:

| Unity | Here |
|---|---|
| HorizontalLayoutGroup / VerticalLayoutGroup | `<Row>` / `<Column>` (`flex-direction`), `gap` for spacing, `padding` |
| Child Force Expand (each child centred in an equal share) | children `flex: 1 1 0`, content centred with `justify-content: center` / `align-items: center` inside each child |
| Child Alignment | `justify-content` (main axis) and `align-items` (cross axis) on the container |
| LayoutElement preferred / flexible width | `flex-basis` = preferred, `flex-grow` / `flex-shrink` = flexible, `min-width` = min |
| GridLayoutGroup (cell size, spacing, constraint count) | `display: grid; grid-template-columns: repeat(<count>, <cell>px); gap: <spacing>px` |
| ContentSizeFitter | the default: a box without a size fits its content |

## 9-slice & Unity mapping

Sprites (`<Sprite>`/`<Image>`, or `background-image` on any element) draw stretched, 9-sliced,
filled, tiled or mirrored. **Border values are source texels** (the PNG as the artist made it,
before gmeta `max_size`), never screen px.

- **Order.** Put borders on the texture once, in its `.gmeta`, and use `auto` everywhere:
  `[settings] border = { top = 12, right = 18, bottom = 8, left = 6 }` → `<Sprite src="ui/frame" slice="auto" />` or
  `background-slice: auto;`. Inline: the prop takes **named sides** `slice={{ top: 12, right: 18, bottom: 8, left: 6 }}`
  or one number; CSS takes **`top right bottom left`** like `margin` (`background-slice: 12 18 8 6`). Arrays are refused
  (Unity's `spriteBorder` is x=left, y=bottom, z=right, w=top: never copy the four numbers in that order).
- **Body and content padding live there too.** `body = { bottom = 16 }` is the box inside the texture: the art outside
  it (a button's hard shadow) draws past the element without growing its layout or hit area. `content = { top = 48,
  right = 104, bottom = 56, left = 104 }` (inside the body) is the padding of every element showing the texture on the
  sides it does not pad itself. Both apply where the texture draws 9-sliced (`slice="auto"` with a border), never to an
  image leaf (`<Sprite src>` alone is measured as its whole texture). A declared `background-outset` or `padding-*`
  wins. Set them once and drop the per-view paddings that repeated them.
- **Check it.** `gameengine view render <View>` prints `warning: … leave no stretchable middle …` when left+right
  (or top+bottom) cover the whole image while the element is stretched on that axis: the signature of swapped borders.

| Unity (Image / Canvas) | Game Engine |
|---|---|
| Sprite Editor border (L, B, R, T) | gmeta `border = { left, bottom, right, top }` + `slice="auto"` |
| Image Type Sliced | `slice="auto"` / `background-slice: auto` |
| Android nine-patch padding and optical bounds | gmeta `content = { … }` and `body = { … }` |
| Pixels Per Unit Multiplier `m` (sprite PPU `p`, canvas ref PPU 100) | `sliceScale = 100 / p / m` (`background-slice-scale`) |
| Borders wider than the rect (GetAdjustedBorders) | same: both shrink in proportion |
| Fill Center off | `fillCenter={false}` / `fill-center: false` |
| Image Type Tiled | `tile` / `background-repeat: repeat` (whole image; tiled 9-slice centres are not supported) |
| Image Type Filled, Horizontal/Vertical/Radial360, origin, clockwise, fillAmount | `fill={{ method: 'radial360', origin: 'top', amount, clockwise }}` / `background-fill: radial top 75%` (no 9-slice while filled; Radial90/180 unsupported) |
| negative `localScale.x` on an Image | `flip="x"` / `background-flip: x` (or `transform: scale(-1, 1)`, same pixels, also flips children) |
| a half-frame plus its mirrored copy | one element: `mirror="x"` / `background-mirror: x` with the half art |
| RectMask2D / Mask on a scroll list | `overflow: hidden` (a screen-aligned scissor; clicks outside are ignored). Sprite-shaped masks: not yet |
| ScrollRect (drag, inertia, wheel, elasticity, snapping) | `<ScrollView>` (`horizontal` for a horizontal one), `overscroll: bounce`, `scroll-snap`; no scrollbars |
| CanvasScaler ScaleWithScreenSize, match 0 / 1 / 0.5 | `"ui": { "referenceResolution": [w, h], "match": "width" \| "height" \| 0.5 }` (default `"fit"`) |
| Image Preserve Aspect | `fit="contain"` / `object-fit: contain` (`cover` fills the box and cuts the rest) |
| a material with additive / multiply blending on an Image | `blend="additive"` / `mix-blend-mode: plus-lighter`; `multiply`, `screen` |
| TMP outline | `text-stroke: 4px #000` (up to 0.2 em; past ~1/18 em it draws as rings of copies, so keep very wide outlines to short labels) |
| TMP underlay (offset, dilate, softness) | `text-shadow: 0 6px <blur> <spread> #000`: blur and spread top out around 1/16 em |
| TMP rich text (`<b>`, `<i>`, `<color=#hex>`, `<size=…>`) | `<Text rich>` with the same tags (`<size=1.5>` is an em multiplier, not points) |
| TMP Auto Size (min / max) | `text-fit: 24px 72px` on a sized box: the largest size that fits |
| TMP keeps trailing spaces | `white-space: pre` (no wrap) or `pre-wrap`; the default trims them as CSS does |

- **Draw calls.** The UI pass batches draws that do not overlap even when they alternate in tree order (buttons and
  their labels): what still costs a draw is overlapping content with different textures, text over sprites over text.
- Match the reference too: a Unity canvas of 1284×2778 matched to height is `referenceResolution: [1284, 2778], match: "height"`.
- **Row gotcha.** `Row` is `align-items: center`. A child whose own children are all `position: absolute` has height 0,
  so it is centred on the row's middle and its content hangs half a row low. Give such children `align-self: stretch`
  (or a height).
