// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
import { typeToken, registerSchema, type EntityId } from '@gameengine/runtime';

export type { EntityId };

/** Project schema IR, registered with the engine when the bundle boots. */
export const schemaIr = {
  "version": 1,
  "package": "SewerAction",
  "enums": [],
  "types": [
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
        }
      ],
      "package": "SewerAction"
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
          "doc": "Maximum horizontal movement speed."
        },
        {
          "name": "jumpSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 9.2,
          "doc": "Initial vertical jump speed."
        }
      ],
      "package": "SewerAction"
    }
  ],
  "commands": [],
  "protocol": [],
  "services": []
} as const;
registerSchema(schemaIr);

export interface GameStateViews {
  /** The deterministic game bootstrap has run. */
  initialized: Uint8Array;
}
export interface GameStateValue {
  /** The deterministic game bootstrap has run. */
  initialized: boolean;
}
/** GameState (resource, sim) */
export const GameState = typeToken<GameStateViews, GameStateValue>('GameState', 'resource', { sig: 'initialized:bool:1', read: (v: GameStateViews, i: number, o: Record<string, unknown>) => { o.initialized = v.initialized[i] !== 0; return o; } });

export interface PlayerViews {
  /** Maximum horizontal movement speed. */
  moveSpeed: Float32Array;
  /** Initial vertical jump speed. */
  jumpSpeed: Float32Array;
}
export interface PlayerValue {
  /** Maximum horizontal movement speed. */
  moveSpeed: number;
  /** Initial vertical jump speed. */
  jumpSpeed: number;
}
/** Player (component, sim) */
export const Player = typeToken<PlayerViews, PlayerValue>('Player', 'component', { sig: 'moveSpeed:f32:1,jumpSpeed:f32:1', read: (v: PlayerViews, i: number, o: Record<string, unknown>) => { o.moveSpeed = v.moveSpeed[i]; o.jumpSpeed = v.jumpSpeed[i]; return o; } });
