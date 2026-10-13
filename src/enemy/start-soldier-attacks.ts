import { defineSystem, LocalTransform, playClip2D, query, read, write } from '@gameengine/runtime';
import { EnemyAttackPoolState, EnemyBrain, GameState, Player } from '../schema.gen.ts';

const CLIPS = {
  Shoot: 'art/soldier/shoot.clip2d.json',
  CrouchShoot: 'art/soldier/crouch-shoot.clip2d.json',
  Bomb: 'art/soldier/throw.clip2d.json',
} as const;

export const StartSoldierAttacks = defineSystem({
  name: 'StartSoldierAttacks',
  after: ['AdvanceSoldierAI', 'WarmEnemyAttackPools'],
  queries: {
    soldiers: query(write(EnemyBrain), read(LocalTransform)),
    players: query(read(Player), read(LocalTransform)),
  },
  resources: [read(GameState), read(EnemyAttackPoolState)],
  runIf: { resource: GameState, field: 'phase', value: 'Playing' },
  run(ctx, { soldiers, players }) {
    let hasPlayer = false;
    let playerX = 0;
    for (const chunk of players.chunks()) {
      if (chunk.length === 0) continue;
      playerX = chunk.col(LocalTransform).position[0]!;
      hasPlayer = true;
      break;
    }

    const warmed = ctx.resource(EnemyAttackPoolState).warmed[0] !== 0;
    for (const chunk of soldiers.chunks()) {
      const brain = chunk.col(EnemyBrain);
      const position = chunk.col(LocalTransform).position;
      for (let row = 0; row < chunk.length; row++) {
        const cooldown = brain.attackCooldownStepsRemaining[row]!;
        if (cooldown > 0) brain.attackCooldownStepsRemaining[row] = cooldown - 1;
        if (!warmed || !hasPlayer || !chunk.is(EnemyBrain, row, 'state', 'Chase') || brain.targetDetected[row] === 0 || cooldown > 0) continue;

        const delta = playerX - position[row * 3]!;
        const distance = delta < 0 ? -delta : delta;
        if (distance > brain.attackRange[row]!) continue;
        const sequence = brain.attackSequence[row]! % 3;
        const kind = sequence === 0 ? 'Shoot' : sequence === 1 ? 'CrouchShoot' : 'Bomb';
        chunk.setField(EnemyBrain, row, 'state', 'Attack');
        chunk.setField(EnemyBrain, row, 'attackKind', kind);
        chunk.setField(EnemyBrain, row, 'facing', delta < 0 ? 'Left' : 'Right');
        brain.attackSequence[row] = brain.attackSequence[row]! + 1;
        brain.attackTelegraphed[row] = 1;
        playClip2D(ctx, chunk.entity(row), CLIPS[kind], { loop: 'once', restart: true });
      }
    }
  },
});
