# Consequential audio — issue #23

Accepted player shots use `shot`; accepted soldier bullet releases use the supplied laser timbre.
Bombs play `explosion` at impact/expiry, rather than on throw. Player/enemy deaths play their
respective vocals once when death is resolved; water uses the existing accepted entry fact.
Weapon, explosion and splash cues route to SFX; death vocals route to Voice. Both are existing
Master children. Music/UI remain available at their defaults. No new gameplay weapon is added.

Six effects are mono ADPCM, normalized to -16 LUFS with the importer’s -1 dBFS peak ceiling.
The boot sound bank pins/decodes all six before gameplay; the boot asset group accounts for
those same assets in the memory report. No first consequence is used to load its sound.

| Cue | Bus | Trigger cooldown (60 Hz steps) | Mixer max voices | Priority |
| --- | --- | --- | --- | --- |
| Shot | SFX | 3 | 2 | 0 |
| Laser | SFX | 3 | 2 | 0 |
| Player death | Voice | 6 | 1 | 10 |
| Enemy death | Voice | 5 | 1 | 5 |
| Explosion | SFX | 4 | 2 | 3 |
| Splash | SFX | 6 | 1 | 1 |

The adapter’s six fixed lanes use the consequence’s absolute simulation timestamp, not real
time. Each lane remembers observed timestamps even for dropped cues, suppressing duplicates,
retained events and cooldown requests without playing a delayed cue. The exact deadline is
accepted. Gameplay never reads audio state or mixer results. Existing weapon/attack/water
cadences remain authoritative; importer cooldowns are an additional mixer safeguard.

Restart cancels same-frame cues and resets deadlines, retaining the restart-step watermark
against stale events. Existing voices are finite one-shots and finish naturally, within 1.104 s;
no loops or retained voice handles need disposal. Caps also apply across restart. The engine
has no public stop-SFX API; this deliberately avoids changing simulation events to unload a bank.
A fresh world resets presentation resource state and the mixer normally.

## Supplied laser source

`rainbowlaser.ogg` is a 75.428-second stereo source. It is retained unchanged but excluded from
shipping bundles and the boot group. `laser.wav` contains its first 0.35 seconds, downmixed to
mono, with a 5 ms fade-in and 25 ms fade-out. This keeps the supplied timbre while bounding
rapid-fire tails and decoded memory. Other source audio files are unchanged.

To reproduce the derived WAV on macOS, decode with
`afconvert assets/audio/sfx/rainbowlaser.ogg /tmp/laser-source.wav -f WAVE -d LEI16 -c 1`.
Read 15,435 frames at 44,100 Hz; multiply sample i by
`max(0, min(1, i/220.5, (15434-i)/1102.5))`, round to int16, and write mono PCM WAV.
The game uses only portable cooked asset keys and mixer calls; no browser or desktop API.

## Verification

- Focused offline-mixer tests exercise accepted shots, exact soldier release, bomb expiry,
  both deaths, splash/explosion routing, timestamp duplicate/cooldown suppression, restart,
  actual voice caps/finite cleanup, sim-hash isolation and pre-input decoding of six sounds.
- All 87 existing T0 per-system baseline traces have zero divergence. Existing replay inputs,
  checkpoints, pinned hashes, goldens, pools, atlases and `pipelines.json` are unchanged.
- V8 prepush: 106 tests across T0/T1, structural replays and `gameengine check` pass. Fresh cooked phone-low
  V8 tests pass. Android asset cooking succeeds; Hermes parity is blocked by missing host
  (open issue #6), and browser packaging remains separately unavailable.
- Fresh `gameengine memory report --device phone-low --cook`: decoded audio **297,504 B
  (0.284 MiB)** against **32 MiB**. Boot+gameplay resident peak **2,905,344 B (2.771 MiB)**
  against **192 MiB**; textures **2,607,840 B** against **128 MiB**. Six short effects occupy
  about 3.10 seconds of mono mixer PCM, at 48,000 Hz × 2 bytes/channel. The full source would
  add about 7 MB decoded; it is neither resident nor shipped.
- Android cooked bundle **189,368 B / 20 MiB** size budget. Android artifact dry-run fails
  because the installed engine lacks `platform/android/template`; package size is unverified.
- Desktop release V8/mobile tier, unchanged idle scenario, 600 sim steps: step p95
  **0.187 → 0.205 ms**, zero hitch steps. Active combat-lifecycle replay: step p95 **2.620 ms**,
  presentation p95 **0.899 ms**, RSS **83.69 MiB**, JS heap **7.48 MiB**. Paused frame totals
  are not comparable; per-system batched totals are not individual-run timings.
- Structural combat peak **7/8 draws**, zero pipelines created during play, zero GC pauses
  over 4 ms. Authored idle frame is 4 draws at 960×540. Audio adds no graphics content.

Architecture and mobile-performance reviewers found no blocking findings. The pre-existing
soldier scans should be narrowed when soldier count grows; that is outside this ticket.
Real phone audio-thread CPU, audible mix/onset latency, GPU/thermal behavior and idle frame
skipping remain unmeasured; headless idle skipping was disabled. Desktop timings and offline
mixer tests do not establish device compliance or browser playback.
