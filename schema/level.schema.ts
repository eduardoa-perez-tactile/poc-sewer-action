import { array, asset, bool, component, dataAsset, p, u32 } from '@gameengine/schema';

export const SewerLevelDef = dataAsset('SewerLevelDef', {
  tilemap: p.ref('asset'),
  finishX: p.num(),
  transition: p.str(),
  beats: p.arr(p.obj({ name: p.str(), startX: p.num(), checkpointX: p.num(), checkpointY: p.num() })),
  soldiers: p.arr(p.obj({ beat: p.int(), x: p.num(), y: p.num(), patrolMinX: p.num(), patrolMaxX: p.num(), health: p.int(), cooldown: p.int() })),
  water: p.arr(p.obj({ x: p.num(), width: p.num(), surfaceY: p.num() })),
}, { doc: 'Complete sewer route, spawn manifest, checkpoints and issue-25 transition hook.' });

export const LevelProgress = component('LevelProgress', {
  data: asset('data'), built: bool(), beat: u32(), checkpoint: u32(), cleared: u32(), finished: bool(), activationPending: bool({ default: true }),
}, { sim: true, doc: 'Level anchor owns ordered progress and checkpoint state. No final encounter or win UI.' });
export const LevelCollisionIndex = component('LevelCollisionIndex', {
  words: array(u32(), 128),
}, { sim: true, doc: 'Four packed 32-bit words per row; at most 128 columns by 32 rows.' });
export const EncounterMember = component('EncounterMember', {
  beat: u32(), activated: bool(),
}, { sim: true, doc: 'Authored encounter membership; bounded actors allocated once during boot.' });

export const TerrainVisual = component('TerrainVisual', { row: u32(), columns: u32() }, { sim: false, doc: 'Merged visible sewer ledges derived from the collision tilemap during boot.' });
