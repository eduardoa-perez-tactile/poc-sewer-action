// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
import { typeToken, rowRead as $r, registerSchema, type EntityId } from '@gameengine/runtime';

export type { EntityId };

/** Project schema IR, registered with the engine when the bundle boots. */
export const schemaIr = {
  "version": 1,
  "package": "SewerAction",
  "enums": [
    {
      "name": "EnemyState",
      "values": [
        "Idle",
        "Patrol",
        "Attack",
        "Stunned",
        "Dead"
      ],
      "package": "SewerAction"
    },
    {
      "name": "GamePhase",
      "values": [
        "Booting",
        "Playing",
        "PlayerDead",
        "Completed"
      ],
      "package": "SewerAction"
    },
    {
      "name": "MoveDirection",
      "values": [
        "Left",
        "Neutral",
        "Right"
      ],
      "package": "SewerAction"
    },
    {
      "name": "HazardKind",
      "values": [
        "Water",
        "Explosive",
        "Contact"
      ],
      "package": "SewerAction"
    }
  ],
  "types": [
    {
      "name": "ActorDied",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "actor",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "killer",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2,
          "optional": true
        }
      ],
      "package": "SewerAction",
      "doc": "Fact emitted after health reaches zero; game flow and presentation may react."
    },
    {
      "name": "DamageRequested",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "source",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "target",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "amount",
          "kind": "u16",
          "scalar": "u16",
          "lanes": 1,
          "min": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Combat and hazards request damage; the health system validates and applies it."
    },
    {
      "name": "Health",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "current",
          "kind": "u16",
          "scalar": "u16",
          "lanes": 1,
          "default": 1,
          "min": 0
        },
        {
          "name": "maximum",
          "kind": "u16",
          "scalar": "u16",
          "lanes": 1,
          "default": 1,
          "min": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Single source of truth for actor survivability."
    },
    {
      "name": "Weapon",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "cooldownSeconds",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.15,
          "min": 0
        },
        {
          "name": "cooldownRemaining",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": 0
        },
        {
          "name": "damage",
          "kind": "u16",
          "scalar": "u16",
          "lanes": 1,
          "default": 1,
          "min": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Deterministic weapon cadence and damage configuration."
    },
    {
      "name": "EnemyBrain",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "state",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "EnemyState",
          "default": "Idle"
        },
        {
          "name": "decisionRemaining",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": 0,
          "doc": "Simulation-time delay until the next decision."
        }
      ],
      "package": "SewerAction",
      "doc": "Deterministic soldier decision state; visuals derive animation from it."
    },
    {
      "name": "GameState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "initialized",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "The deterministic game bootstrap has run."
        },
        {
          "name": "phase",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "GamePhase",
          "default": "Booting",
          "doc": "Authoritative vertical-slice phase."
        }
      ],
      "package": "SewerAction",
      "doc": "Simulation-owned level flow. Presentation may observe it but never advance it."
    },
    {
      "name": "GameplayPresentation",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "phase",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "GamePhase",
          "default": "Booting",
          "doc": "Authoritative vertical-slice phase."
        },
        {
          "name": "moveX",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "MoveDirection",
          "default": "Neutral"
        }
      ],
      "package": "SewerAction",
      "doc": "Read-only presentation snapshot derived from consequential simulation state."
    },
    {
      "name": "Hazard",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "kind",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "HazardKind",
          "default": "Contact"
        },
        {
          "name": "damage",
          "kind": "u16",
          "scalar": "u16",
          "lanes": 1,
          "default": 1,
          "min": 1
        },
        {
          "name": "repeatSeconds",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": 0,
          "doc": "Simulation-time interval; zero means one hit per contact."
        }
      ],
      "package": "SewerAction",
      "doc": "Data-driven environmental damage contract."
    },
    {
      "name": "MenuIntent",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "moveX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": -1,
          "max": 1
        },
        {
          "name": "moveY",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": -1,
          "max": 1
        },
        {
          "name": "confirm",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "back",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "pause",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        }
      ],
      "package": "SewerAction",
      "doc": "Recorded, device-independent menu and pause intent produced by the action map."
    },
    {
      "name": "Player",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "moveSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 8.5,
          "min": 0,
          "doc": "Maximum horizontal movement speed in world units per second."
        },
        {
          "name": "jumpSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 9.2,
          "min": 0,
          "doc": "Initial vertical jump speed in world units per second."
        }
      ],
      "package": "SewerAction",
      "doc": "Player-owned deterministic movement configuration."
    },
    {
      "name": "PlayerActionState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "moveX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": -1,
          "max": 1
        },
        {
          "name": "jump",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "dash",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "fire",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "crouch",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        }
      ],
      "package": "SewerAction",
      "doc": "Current normalized action-map sample. Written from recorded ActionState before gameplay systems run."
    },
    {
      "name": "PlayerControl",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "moveX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": -1,
          "max": 1,
          "doc": "Recorded horizontal intent normalized to [-1, 1]."
        },
        {
          "name": "crouch",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Whether the recorded crouch control is held."
        }
      ],
      "package": "SewerAction",
      "doc": "Latest recorded held player control. Action systems consume step-scoped intent events directly."
    },
    {
      "name": "PlayerIntent",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "moveX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": -1,
          "max": 1
        },
        {
          "name": "jump",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "dash",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "fire",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "crouch",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        }
      ],
      "package": "SewerAction",
      "doc": "Recorded boundary event produced by keyboard, gamepad, touch, or UI adapters."
    }
  ],
  "commands": [],
  "protocol": [],
  "services": []
} as const;
registerSchema(schemaIr);

export const EnemyState = {
  Idle: 0,
  Patrol: 1,
  Attack: 2,
  Stunned: 3,
  Dead: 4,
} as const;
export type EnemyStateName = 'Idle' | 'Patrol' | 'Attack' | 'Stunned' | 'Dead';

export const GamePhase = {
  Booting: 0,
  Playing: 1,
  PlayerDead: 2,
  Completed: 3,
} as const;
export type GamePhaseName = 'Booting' | 'Playing' | 'PlayerDead' | 'Completed';

export const MoveDirection = {
  Left: 0,
  Neutral: 1,
  Right: 2,
} as const;
export type MoveDirectionName = 'Left' | 'Neutral' | 'Right';

export const HazardKind = {
  Water: 0,
  Explosive: 1,
  Contact: 2,
} as const;
export type HazardKindName = 'Water' | 'Explosive' | 'Contact';

export interface ActorDiedViews {
  actor: Uint32Array;
  killer: Uint32Array;
}
export interface ActorDiedValue {
  actor: EntityId;
  killer: EntityId;
}
/** Fact emitted after health reaches zero; game flow and presentation may react. (event, sim) */
export const ActorDied = typeToken<ActorDiedViews, ActorDiedValue>('ActorDied', 'event', { sig: 'actor:entity:2,killer:entity:2', read: (v: ActorDiedViews, i: number, o: Record<string, unknown>) => { o.actor = $r.ent(v.actor, i); o.killer = $r.ent(v.killer, i); return o; } });

export interface DamageRequestedViews {
  source: Uint32Array;
  target: Uint32Array;
  amount: Uint16Array;
}
export interface DamageRequestedValue {
  source: EntityId;
  target: EntityId;
  amount: number;
}
/** Combat and hazards request damage; the health system validates and applies it. (event, sim) */
export const DamageRequested = typeToken<DamageRequestedViews, DamageRequestedValue>('DamageRequested', 'event', { sig: 'source:entity:2,target:entity:2,amount:u16:1', read: (v: DamageRequestedViews, i: number, o: Record<string, unknown>) => { o.source = $r.ent(v.source, i); o.target = $r.ent(v.target, i); o.amount = v.amount[i]; return o; } });

export interface HealthViews {
  current: Uint16Array;
  maximum: Uint16Array;
}
export interface HealthValue {
  current: number;
  maximum: number;
}
/** Single source of truth for actor survivability. (component, sim) */
export const Health = typeToken<HealthViews, HealthValue>('Health', 'component', { sig: 'current:u16:1,maximum:u16:1', read: (v: HealthViews, i: number, o: Record<string, unknown>) => { o.current = v.current[i]; o.maximum = v.maximum[i]; return o; } });

export interface WeaponViews {
  cooldownSeconds: Float32Array;
  cooldownRemaining: Float32Array;
  damage: Uint16Array;
}
export interface WeaponValue {
  cooldownSeconds: number;
  cooldownRemaining: number;
  damage: number;
}
/** Deterministic weapon cadence and damage configuration. (component, sim) */
export const Weapon = typeToken<WeaponViews, WeaponValue>('Weapon', 'component', { sig: 'cooldownSeconds:f32:1,cooldownRemaining:f32:1,damage:u16:1', read: (v: WeaponViews, i: number, o: Record<string, unknown>) => { o.cooldownSeconds = v.cooldownSeconds[i]; o.cooldownRemaining = v.cooldownRemaining[i]; o.damage = v.damage[i]; return o; } });

export interface EnemyBrainViews {
  state: Uint8Array;
  /** Simulation-time delay until the next decision. */
  decisionRemaining: Float32Array;
}
export interface EnemyBrainValue {
  state: EnemyStateName | number;
  /** Simulation-time delay until the next decision. */
  decisionRemaining: number;
}
/** Deterministic soldier decision state; visuals derive animation from it. (component, sim) */
export const EnemyBrain = typeToken<EnemyBrainViews, EnemyBrainValue>('EnemyBrain', 'component', { sig: 'state:enum:1,decisionRemaining:f32:1', read: (v: EnemyBrainViews, i: number, o: Record<string, unknown>) => { o.state = $r.enm('EnemyState', v.state[i]!); o.decisionRemaining = v.decisionRemaining[i]; return o; } });

export interface GameStateViews {
  /** The deterministic game bootstrap has run. */
  initialized: Uint8Array;
  /** Authoritative vertical-slice phase. */
  phase: Uint8Array;
}
export interface GameStateValue {
  /** The deterministic game bootstrap has run. */
  initialized: boolean;
  /** Authoritative vertical-slice phase. */
  phase: GamePhaseName | number;
}
/** Simulation-owned level flow. Presentation may observe it but never advance it. (resource, sim) */
export const GameState = typeToken<GameStateViews, GameStateValue>('GameState', 'resource', { sig: 'initialized:bool:1,phase:enum:1', read: (v: GameStateViews, i: number, o: Record<string, unknown>) => { o.initialized = v.initialized[i] !== 0; o.phase = $r.enm('GamePhase', v.phase[i]!); return o; } });

export interface GameplayPresentationViews {
  /** Authoritative vertical-slice phase. */
  phase: Uint8Array;
  moveX: Uint8Array;
}
export interface GameplayPresentationValue {
  /** Authoritative vertical-slice phase. */
  phase: GamePhaseName | number;
  moveX: MoveDirectionName | number;
}
/** Read-only presentation snapshot derived from consequential simulation state. (resource, presentation-only) */
export const GameplayPresentation = typeToken<GameplayPresentationViews, GameplayPresentationValue>('GameplayPresentation', 'resource', { sig: 'phase:enum:1,moveX:enum:1', read: (v: GameplayPresentationViews, i: number, o: Record<string, unknown>) => { o.phase = $r.enm('GamePhase', v.phase[i]!); o.moveX = $r.enm('MoveDirection', v.moveX[i]!); return o; } });

export interface HazardViews {
  kind: Uint8Array;
  damage: Uint16Array;
  /** Simulation-time interval; zero means one hit per contact. */
  repeatSeconds: Float32Array;
}
export interface HazardValue {
  kind: HazardKindName | number;
  damage: number;
  /** Simulation-time interval; zero means one hit per contact. */
  repeatSeconds: number;
}
/** Data-driven environmental damage contract. (component, sim) */
export const Hazard = typeToken<HazardViews, HazardValue>('Hazard', 'component', { sig: 'kind:enum:1,damage:u16:1,repeatSeconds:f32:1', read: (v: HazardViews, i: number, o: Record<string, unknown>) => { o.kind = $r.enm('HazardKind', v.kind[i]!); o.damage = v.damage[i]; o.repeatSeconds = v.repeatSeconds[i]; return o; } });

export interface MenuIntentViews {
  moveX: Float32Array;
  moveY: Float32Array;
  confirm: Uint8Array;
  back: Uint8Array;
  pause: Uint8Array;
}
export interface MenuIntentValue {
  moveX: number;
  moveY: number;
  confirm: boolean;
  back: boolean;
  pause: boolean;
}
/** Recorded, device-independent menu and pause intent produced by the action map. (event, sim) */
export const MenuIntent = typeToken<MenuIntentViews, MenuIntentValue>('MenuIntent', 'event', { sig: 'moveX:f32:1,moveY:f32:1,confirm:bool:1,back:bool:1,pause:bool:1', read: (v: MenuIntentViews, i: number, o: Record<string, unknown>) => { o.moveX = v.moveX[i]; o.moveY = v.moveY[i]; o.confirm = v.confirm[i] !== 0; o.back = v.back[i] !== 0; o.pause = v.pause[i] !== 0; return o; } });

export interface PlayerViews {
  /** Maximum horizontal movement speed in world units per second. */
  moveSpeed: Float32Array;
  /** Initial vertical jump speed in world units per second. */
  jumpSpeed: Float32Array;
}
export interface PlayerValue {
  /** Maximum horizontal movement speed in world units per second. */
  moveSpeed: number;
  /** Initial vertical jump speed in world units per second. */
  jumpSpeed: number;
}
/** Player-owned deterministic movement configuration. (component, sim) */
export const Player = typeToken<PlayerViews, PlayerValue>('Player', 'component', { sig: 'moveSpeed:f32:1,jumpSpeed:f32:1', read: (v: PlayerViews, i: number, o: Record<string, unknown>) => { o.moveSpeed = v.moveSpeed[i]; o.jumpSpeed = v.jumpSpeed[i]; return o; } });

export interface PlayerActionStateViews {
  moveX: Float32Array;
  jump: Uint8Array;
  dash: Uint8Array;
  fire: Uint8Array;
  crouch: Uint8Array;
}
export interface PlayerActionStateValue {
  moveX: number;
  jump: boolean;
  dash: boolean;
  fire: boolean;
  crouch: boolean;
}
/** Current normalized action-map sample. Written from recorded ActionState before gameplay systems run. (resource, sim) */
export const PlayerActionState = typeToken<PlayerActionStateViews, PlayerActionStateValue>('PlayerActionState', 'resource', { sig: 'moveX:f32:1,jump:bool:1,dash:bool:1,fire:bool:1,crouch:bool:1', read: (v: PlayerActionStateViews, i: number, o: Record<string, unknown>) => { o.moveX = v.moveX[i]; o.jump = v.jump[i] !== 0; o.dash = v.dash[i] !== 0; o.fire = v.fire[i] !== 0; o.crouch = v.crouch[i] !== 0; return o; } });

export interface PlayerControlViews {
  /** Recorded horizontal intent normalized to [-1, 1]. */
  moveX: Float32Array;
  /** Whether the recorded crouch control is held. */
  crouch: Uint8Array;
}
export interface PlayerControlValue {
  /** Recorded horizontal intent normalized to [-1, 1]. */
  moveX: number;
  /** Whether the recorded crouch control is held. */
  crouch: boolean;
}
/** Latest recorded held player control. Action systems consume step-scoped intent events directly. (component, sim) */
export const PlayerControl = typeToken<PlayerControlViews, PlayerControlValue>('PlayerControl', 'component', { sig: 'moveX:f32:1,crouch:bool:1', read: (v: PlayerControlViews, i: number, o: Record<string, unknown>) => { o.moveX = v.moveX[i]; o.crouch = v.crouch[i] !== 0; return o; } });

export interface PlayerIntentViews {
  moveX: Float32Array;
  jump: Uint8Array;
  dash: Uint8Array;
  fire: Uint8Array;
  crouch: Uint8Array;
}
export interface PlayerIntentValue {
  moveX: number;
  jump: boolean;
  dash: boolean;
  fire: boolean;
  crouch: boolean;
}
/** Recorded boundary event produced by keyboard, gamepad, touch, or UI adapters. (event, sim) */
export const PlayerIntent = typeToken<PlayerIntentViews, PlayerIntentValue>('PlayerIntent', 'event', { sig: 'moveX:f32:1,jump:bool:1,dash:bool:1,fire:bool:1,crouch:bool:1', read: (v: PlayerIntentViews, i: number, o: Record<string, unknown>) => { o.moveX = v.moveX[i]; o.jump = v.jump[i] !== 0; o.dash = v.dash[i] !== 0; o.fire = v.fire[i] !== 0; o.crouch = v.crouch[i] !== 0; return o; } });
