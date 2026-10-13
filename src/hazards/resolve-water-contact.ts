import { Bounds2D, changed, Disabled, defineSystem, LocalTransform, overlapPairs2D, query, read, withTag, write } from '@gameengine/runtime';
import { Alive, DamageRequested, GameState, Hazard, Health, Player, RestartRequested, WaterContact, WaterEntered } from '../schema.gen.ts';

export const ResolveWaterContact = defineSystem({
  name: 'ResolveWaterContact',
  after: ['ResolvePlatformCollision'],
  queries: {
    players: query(read(Player), withTag(Alive), read(Health), read(LocalTransform), write(WaterContact)),
    water: query(read(Hazard), read(Bounds2D), read(LocalTransform)),
  },
  resources: [read(GameState)],
  events: [RestartRequested],
  runIf: [
    { resource: GameState, field: 'phase', value: 'Playing' },
    { any: [{ query: query(read(Player), changed(LocalTransform)) }, { query: query(read(Hazard), changed(LocalTransform)) }, { changed: [Bounds2D, Hazard, WaterContact, Health, Alive, Disabled, GameState] }, { event: RestartRequested }] },
  ],
  run(ctx, { players, water }) {
    // A restart step belongs wholly to reset; never leave stale entry/damage facts behind.
    if (ctx.events.count(RestartRequested) !== 0 || players.count === 0) return;
    const pairs = overlapPairs2D({ mask: 17 });
    for (const chunk of players.chunks()) {
      const contact = chunk.col(WaterContact);
      const position = chunk.col(LocalTransform).position;
      for (let row = 0; row < chunk.length; row++) {
        if (chunk.col(Health).current[row] === 0) continue;
        const player = chunk.entity(row);
        let inside = false;
        // Volumes form a union: adjacent/overlapping volumes never multiply entry triggers.
        for (const hazardChunk of water.chunks()) {
          for (let hazardRow = 0; hazardRow < hazardChunk.length; hazardRow++) {
            if (!hazardChunk.is(Hazard, hazardRow, 'kind', 'Water')) continue;
            const hazard = hazardChunk.entity(hazardRow);
            let touching = false;
            for (let pair = 0; pair < pairs.length; pair++) {
              const [a, b] = pairs[pair]!;
              if ((a === player && b === hazard) || (b === player && a === hazard)) { touching = true; break; }
            }
            if (!touching) continue;
            inside = true;
            if (contact.inside[row] === 0) {
              ctx.events.emit(DamageRequested, { source: hazard, target: player, amount: hazardChunk.col(Hazard).damage[hazardRow]!, knockback: [0, 0], bypassInvulnerability: true });
              if (ctx.step >= contact.nextSplashStep[row]!) {
                contact.nextSplashStep[row] = ctx.step + contact.splashCooldownSteps[row]!;
                const bounds = hazardChunk.col(Bounds2D);
                const surface = hazardChunk.col(LocalTransform).position[hazardRow * 3 + 1]! + bounds.offset[hazardRow * 2 + 1]! + bounds.size[hazardRow * 2 + 1]! * 0.5;
                ctx.events.emit(WaterEntered, { player, entryStep: ctx.step, position: [position[row * 3]!, surface] });
              }
            }
            break;
          }
          if (inside) break;
        }
        const next = inside ? 1 : 0;
        if (contact.inside[row] !== next) contact.inside[row] = next;
      }
    }
  },
});
