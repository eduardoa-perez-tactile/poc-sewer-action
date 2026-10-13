import type { ReadonlySewerLevelDefData } from '../schema.gen.ts';

export function validateLevel(def: ReadonlySewerLevelDefData): void {
  if (def.beats.length !== 4 || def.transition !== 'final-encounter') throw new Error('Level requires four beats and the final-encounter hook');
  if (def.soldiers.length > 8 || def.water.length > 8) throw new Error('Level exceeds bounded actor/hazard manifest');
  const final = def.finalEncounter;
  if (!Number.isFinite(final.triggerX) || final.triggerX < def.beats[3]!.checkpointX || final.triggerX >= def.finishX || !Number.isFinite(final.minY) || !Number.isFinite(final.maxY) || final.minY >= final.maxY || !Number.isInteger(final.warningSteps) || final.warningSteps < 30 || final.warningSteps > 120 || !Number.isFinite(final.cameraX) || !Number.isFinite(final.cameraY) || final.cameraX < final.triggerX || final.cameraX > def.finishX) throw new Error('Invalid final encounter gate, warning or frame');
  const finalSoldiers = def.soldiers.filter(soldier => soldier.finalPhase !== undefined);
  if (finalSoldiers.length !== 2 || finalSoldiers.filter(soldier => soldier.finalPhase === 0).length !== 1 || finalSoldiers.filter(soldier => soldier.finalPhase === 1).length !== 1) throw new Error('Final encounter requires one guard and one bomber');
  let previous = -Infinity;
  for (const beat of def.beats) {
    if (beat.startX <= previous || beat.checkpointX < beat.startX || beat.checkpointX >= def.finishX) throw new Error('Checkpoints must progress toward the finish');
    previous = beat.checkpointX;
  }
  for (const soldier of def.soldiers) {
    const beat = def.beats[soldier.beat];
    const end = def.beats[soldier.beat + 1]?.startX ?? def.finishX;
    if ((soldier.beat === 3) !== (soldier.finalPhase !== undefined)) throw new Error('Outlet soldiers must belong to a final phase');
    if (!beat || soldier.x < beat.startX || soldier.x >= end || soldier.health < 1 || soldier.cooldown < 30 || soldier.patrolMinX > soldier.x || soldier.patrolMaxX < soldier.x) throw new Error('Invalid soldier spawn or encounter assignment');
  }
  for (const water of def.water) {
    if (water.width <= 0 || water.width > 4 || water.x - water.width / 2 < def.beats[0]!.startX || water.x + water.width / 2 >= def.finishX) throw new Error('Invalid or untraversable water span');
    for (const beat of def.beats) if (beat.checkpointX >= water.x - water.width / 2 && beat.checkpointX <= water.x + water.width / 2) throw new Error('Checkpoint lies in water');
  }
}
