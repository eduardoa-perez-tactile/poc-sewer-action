import { defineSystem, LocalTransform, query, read, write } from '@gameengine/runtime';
import { LevelCollisionIndex, EnemyBrain, GameState, PlatformCollisionGrid, Player } from '../schema.gen.ts';

const EDGE_EPSILON = 0.0001;

export const AdvanceSoldierAI = defineSystem({
  name: 'AdvanceSoldierAI',
  after: ['ResolvePlatformCollision'],
  queries: {
    levelIndex: query(read(LevelCollisionIndex)),
    soldiers: query(write(EnemyBrain), write(LocalTransform)),
    players: query(read(Player), read(LocalTransform)),
  },
  resources: [read(GameState), read(PlatformCollisionGrid)],
  runIf: [
    { resource: GameState, field: 'phase', value: 'Playing' },
    { query: query(read(EnemyBrain)) },
  ],
  run(ctx, { soldiers, players, levelIndex }) {
    let hasPlayer = false;
    let playerX = 0;
    let playerY = 0;
    for (const playerChunk of players.chunks()) {
      if (playerChunk.length === 0) continue;
      const playerPosition = playerChunk.col(LocalTransform).position;
      playerX = playerPosition[0]!;
      playerY = playerPosition[1]!;
      hasPlayer = true;
      break;
    }

    const grid = ctx.resource(PlatformCollisionGrid);
    const originX = grid.originX[0]!;
    const originY = grid.originY[0]!;
    const cellSize = grid.cellSize[0]!;

    let words: Uint32Array | undefined;
    for (const chunk of levelIndex.chunks()) if (chunk.length > 0) words = chunk.col(LevelCollisionIndex).words;

    for (const chunk of soldiers.chunks()) {
      const brain = chunk.col(EnemyBrain);
      const position = chunk.col(LocalTransform).position;

      for (let row = 0; row < chunk.length; row++) {
        if (chunk.is(EnemyBrain, row, 'state', 'Idle') || chunk.is(EnemyBrain, row, 'state', 'Attack') || chunk.is(EnemyBrain, row, 'state', 'Stunned') || chunk.is(EnemyBrain, row, 'state', 'Dead')) continue;

        const offset = row * 3;
        const x = position[offset]!;
        const y = position[offset + 1]!;
        const deltaX = playerX - x;
        const deltaY = playerY - y;
        const absDeltaX = deltaX < 0 ? -deltaX : deltaX;
        const absDeltaY = deltaY < 0 ? -deltaY : deltaY;
        const detected = hasPlayer && absDeltaX <= brain.detectionRangeX[row]! && absDeltaY <= brain.detectionRangeY[row]!;

        let memory = brain.targetMemoryStepsRemaining[row]!;
        if (detected) {
          memory = brain.targetMemorySteps[row]!;
          brain.targetDetected[row] = 1;
          brain.lastKnownTargetX[row] = playerX;
          brain.targetMemoryStepsRemaining[row] = memory;
          if (!chunk.is(EnemyBrain, row, 'state', 'Chase')) {
            chunk.setField(EnemyBrain, row, 'state', 'Chase');
            brain.turnPauseStepsRemaining[row] = 0;
          }
        } else {
          brain.targetDetected[row] = 0;
          if (chunk.is(EnemyBrain, row, 'state', 'Chase')) {
            if (memory > 0) {
              memory -= 1;
              brain.targetMemoryStepsRemaining[row] = memory;
            }
            if (memory === 0) {
              chunk.setField(EnemyBrain, row, 'state', 'Patrol');
              brain.turnPauseStepsRemaining[row] = brain.turnPauseSteps[row]!;
              continue;
            }
          }
        }

        const pause = brain.turnPauseStepsRemaining[row]!;
        if (pause > 0) {
          brain.turnPauseStepsRemaining[row] = pause - 1;
          continue;
        }

        const chasing = chunk.is(EnemyBrain, row, 'state', 'Chase');
        let direction = chunk.is(EnemyBrain, row, 'facing', 'Left') ? -1 : 1;
        let speed = brain.patrolSpeed[row]!;

        if (chasing) {
          const targetX = brain.lastKnownTargetX[row]!;
          const targetDelta = targetX - x;
          const targetDistance = targetDelta < 0 ? -targetDelta : targetDelta;
          if (targetDistance <= brain.stopDistance[row]!) continue;
          direction = targetDelta < 0 ? -1 : 1;
          speed = brain.chaseSpeed[row]!;
          chunk.setField(EnemyBrain, row, 'facing', direction < 0 ? 'Left' : 'Right');
        } else {
          const patrolMinX = brain.patrolMinX[row]!;
          const patrolMaxX = brain.patrolMaxX[row]!;
          if ((direction < 0 && x <= patrolMinX + EDGE_EPSILON) || (direction > 0 && x >= patrolMaxX - EDGE_EPSILON)) {
            direction = -direction;
            chunk.setField(EnemyBrain, row, 'facing', direction < 0 ? 'Left' : 'Right');
            brain.turnPauseStepsRemaining[row] = brain.turnPauseSteps[row]!;
            continue;
          }
        }

        let nextX = x + direction * speed * ctx.dt;
        if (!chasing) {
          if (nextX < brain.patrolMinX[row]!) nextX = brain.patrolMinX[row]!;
          if (nextX > brain.patrolMaxX[row]!) nextX = brain.patrolMaxX[row]!;
        }

        const probeX = nextX + direction * (brain.collisionHalfWidth[row]! + brain.edgeProbeDistance[row]!);
        const probeCellX = Math.floor((probeX - originX) / cellSize);
        const supportCellY = Math.floor((y - originY - EDGE_EPSILON) / cellSize);
        const supported = probeCellX >= 0 && probeCellX < grid.columns[0]! && supportCellY >= 0 && supportCellY < grid.rows[0]!
          && (((words ? words[supportCellY * 4 + (probeCellX >>> 5)]! : grid.solidRows[supportCellY]!) >>> (probeCellX & 31)) & 1) !== 0;

        if (!supported) {
          if (!chasing) {
            direction = -direction;
            chunk.setField(EnemyBrain, row, 'facing', direction < 0 ? 'Left' : 'Right');
          }
          brain.turnPauseStepsRemaining[row] = brain.turnPauseSteps[row]!;
          continue;
        }

        position[offset] = nextX;
      }
    }
  },
});
