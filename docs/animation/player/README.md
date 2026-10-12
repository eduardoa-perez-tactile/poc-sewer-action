# Player flipbook review

The clips preserve the `player.ase` tag ranges and source-frame timing. Every exported frame is
64×77 px, renders at 1.28×1.54 world units, shares the named `player` atlas, and uses the scene
sprite's `[0.5, 0]` feet anchor. The contact sheets in this directory are generated with
`gameengine clip2d sheet` and show event frames with red timing bars.

| Clip | Frames | Timing | Playback | Informational events |
| --- | ---: | --- | --- | --- |
| Idle | 6 | 222 ms each | loop | — |
| Run | 6 | 100 ms each | loop | `footstep` on frames 1 and 4 |
| Jump | 2 | 100 ms each | once, hold last | `takeoff-feedback` on frame 0 |
| Fall | 3 | 100 ms each | once, hold last | — |
| Crouch | 1 | 100 ms | loop/hold | — |
| Shoot | 1 | 222 ms | once, hold last | `muzzle-feedback` on frame 0 |
| Hurt | 1 | 222 ms | once, hold last | `hurt-feedback` on frame 0 |

`DrivePlayerAnimation` reads only deterministic movement/control facts, selects one of these
authored clips, and writes only presentation components. Shoot and hurt are intentionally
unselected by the current controller: later combat tickets must trigger them from authoritative
weapon/damage facts. Clip and sprite frame events are feedback cues only; gameplay must never wait
for or react to them.
