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
      "name": "PresentationDashDirection",
      "values": [
        "Left",
        "Right"
      ],
      "package": "SewerAction"
    },
    {
      "name": "RoomLandmarkKind",
      "values": [
        "Encounter",
        "WaterEdge",
        "Exit"
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
    },
    {
      "name": "DashDirection",
      "values": [
        "Left",
        "Right"
      ],
      "package": "SewerAction"
    },
    {
      "name": "FacingDirection",
      "values": [
        "Left",
        "Right"
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
        },
        {
          "name": "dashing",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Presentation-readable active dash flag derived from simulation state."
        },
        {
          "name": "dashDirection",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "PresentationDashDirection",
          "default": "Right",
          "doc": "Presentation-readable dash direction for animation and effects."
        },
        {
          "name": "dashReady",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true,
          "doc": "Whether the deterministic dash cooldown has completed."
        }
      ],
      "package": "SewerAction",
      "doc": "Read-only presentation snapshot derived from consequential simulation state."
    },
    {
      "name": "RoomCollisionState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "built",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Whether the current room tilemap has queued its static collision cells."
        },
        {
          "name": "cellCount",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "Expected derived cell count; confirms deferred spawns are visible before play begins."
        }
      ],
      "package": "SewerAction",
      "doc": "One-shot deterministic bootstrap state for tilemap-derived collision."
    },
    {
      "name": "RoomLandmark",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "kind",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "RoomLandmarkKind",
          "default": "Encounter",
          "doc": "Authored room landmark used by later gameplay tickets and content verification."
        }
      ],
      "package": "SewerAction",
      "doc": "A deterministic marker placed in the room scene without duplicating collision geometry."
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
      "name": "PlatformCollisionCell",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "x",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1,
          "default": 0,
          "doc": "Grid-space x coordinate."
        },
        {
          "name": "y",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1,
          "default": 0,
          "doc": "Grid-space y coordinate."
        }
      ],
      "package": "SewerAction",
      "doc": "A solid cell in the deterministic platform collision grid. Rendering is independent."
    },
    {
      "name": "PlatformCollisionGrid",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "originX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "doc": "World x coordinate of cell (0, 0) lower-left corner."
        },
        {
          "name": "originY",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": -0.5,
          "doc": "World y coordinate of cell (0, 0) lower-left corner."
        },
        {
          "name": "cellSize",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1,
          "min": 0.01,
          "doc": "Square cell size in world units."
        }
      ],
      "package": "SewerAction",
      "doc": "World mapping for deterministic platform collision cells."
    },
    {
      "name": "Player",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "maxHorizontalSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 8.5,
          "min": 0,
          "doc": "Maximum horizontal speed in world units per second."
        },
        {
          "name": "groundAcceleration",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 60,
          "min": 0,
          "doc": "Grounded acceleration in world units per second squared."
        },
        {
          "name": "groundDeceleration",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 80,
          "min": 0,
          "doc": "Grounded braking and reversal rate in world units per second squared."
        },
        {
          "name": "airAcceleration",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 30,
          "min": 0,
          "doc": "Airborne acceleration in world units per second squared."
        },
        {
          "name": "airDeceleration",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 12,
          "min": 0,
          "doc": "Airborne braking and reversal rate in world units per second squared."
        },
        {
          "name": "jumpSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 9.2,
          "min": 0,
          "doc": "Initial vertical jump speed in world units per second."
        },
        {
          "name": "gravity",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 24,
          "min": 0,
          "doc": "Downward acceleration in world units per second squared."
        },
        {
          "name": "maxFallSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 18,
          "min": 0,
          "doc": "Maximum downward speed in world units per second."
        },
        {
          "name": "jumpCutMultiplier",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.5,
          "min": 0,
          "max": 1,
          "doc": "Upward velocity multiplier applied when jump is released early."
        },
        {
          "name": "coyoteSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 6,
          "doc": "Fixed simulation steps after leaving ground in which the ground jump remains available."
        },
        {
          "name": "jumpBufferSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 6,
          "doc": "Fixed simulation steps for which a jump edge remains queued."
        },
        {
          "name": "airJumps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 1,
          "doc": "Air jumps restored on grounded contact."
        },
        {
          "name": "dashSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 12,
          "min": 0,
          "doc": "Locked horizontal speed while dashing in world units per second."
        },
        {
          "name": "dashDurationSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 8,
          "doc": "Fixed simulation steps for which a dash moves at dash speed."
        },
        {
          "name": "dashCooldownSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 48,
          "doc": "Fixed simulation steps from activation until another dash may start."
        },
        {
          "name": "dashControlLockSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 6,
          "doc": "Fixed simulation steps after a dash before movement and jump control return."
        },
        {
          "name": "dashGravityMultiplier",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.2,
          "min": 0,
          "max": 1,
          "doc": "Gravity multiplier while an airborne dash is active."
        },
        {
          "name": "collisionHalfWidth",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.42,
          "min": 0.01,
          "doc": "Half-width of the deterministic player collision box."
        },
        {
          "name": "collisionHeight",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1.2,
          "min": 0.01,
          "doc": "Height of the deterministic player collision box measured upward from the actor origin."
        },
        {
          "name": "maxStepHeight",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.35,
          "min": 0,
          "doc": "Maximum ledge height climbed automatically while grounded."
        },
        {
          "name": "groundSnapDistance",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.12,
          "min": 0,
          "doc": "Maximum downward floor snap used to stay stable over shallow cliff edges."
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
          "name": "jumpHeld",
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
      "name": "PlayerAnimationPresentation",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "clip",
          "kind": "asset",
          "scalar": "u32",
          "lanes": 1,
          "assetType": "clip2d",
          "doc": "Current authored flipbook selected by presentation."
        }
      ],
      "package": "SewerAction",
      "doc": "Presentation-only animation controller state; never read by gameplay."
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
        },
        {
          "name": "jumpHeld",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Whether jump is currently held for release-cut detection."
        }
      ],
      "package": "SewerAction",
      "doc": "Latest recorded held player control. Action systems consume step-scoped intent events directly."
    },
    {
      "name": "PlayerDashState",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "active",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Whether the player is currently in the fixed-step dash movement phase."
        },
        {
          "name": "direction",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "DashDirection",
          "default": "Right"
        },
        {
          "name": "activeStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "Dash movement steps remaining, including the current step."
        },
        {
          "name": "cooldownStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "Steps before another dash activation is accepted."
        },
        {
          "name": "controlLockStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "Steps before horizontal and jump control are accepted again."
        }
      ],
      "package": "SewerAction",
      "doc": "Authoritative deterministic dash state. Presentation may observe but never write it."
    },
    {
      "name": "PlayerGroundContact",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "grounded",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true,
          "doc": "Collision-owned ground contact fact consumed by movement."
        }
      ],
      "package": "SewerAction",
      "doc": "Deterministic traversal/collision output. Movement reads but never writes this component."
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
          "name": "jumpHeld",
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
    },
    {
      "name": "PlayerMotion",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "horizontalVelocity",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "doc": "Authoritative horizontal velocity in world units per second."
        },
        {
          "name": "verticalVelocity",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "doc": "Authoritative vertical velocity in world units per second."
        },
        {
          "name": "groundedForMovement",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true,
          "doc": "Movement-interpreted grounded state, one fixed step behind raw collision support."
        },
        {
          "name": "facing",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "FacingDirection",
          "default": "Right"
        },
        {
          "name": "coyoteStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "Remaining fixed steps in the grounded grace window."
        },
        {
          "name": "jumpBufferStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "Remaining fixed steps for a queued jump request."
        },
        {
          "name": "airJumpsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 1,
          "doc": "Air jumps available before the next grounded contact."
        },
        {
          "name": "jumpWasHeld",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Jump hold state from the previous fixed step for deterministic release detection."
        },
        {
          "name": "ignoreGroundContact",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Whether contact is ignored until the actor has separated after jumping."
        }
      ],
      "package": "SewerAction",
      "doc": "Authoritative player movement state. Presentation may observe but never write it."
    },
    {
      "name": "PlayerStepInput",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "jumpRequested",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Jump press for the current fixed step only."
        },
        {
          "name": "dashRequested",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Dash press for the current fixed step only."
        }
      ],
      "package": "SewerAction",
      "doc": "Unconditionally overwritten input sample consumed in the same fixed step."
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

export const PresentationDashDirection = {
  Left: 0,
  Right: 1,
} as const;
export type PresentationDashDirectionName = 'Left' | 'Right';

export const RoomLandmarkKind = {
  Encounter: 0,
  WaterEdge: 1,
  Exit: 2,
} as const;
export type RoomLandmarkKindName = 'Encounter' | 'WaterEdge' | 'Exit';

export const HazardKind = {
  Water: 0,
  Explosive: 1,
  Contact: 2,
} as const;
export type HazardKindName = 'Water' | 'Explosive' | 'Contact';

export const DashDirection = {
  Left: 0,
  Right: 1,
} as const;
export type DashDirectionName = 'Left' | 'Right';

export const FacingDirection = {
  Left: 0,
  Right: 1,
} as const;
export type FacingDirectionName = 'Left' | 'Right';

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
  /** Presentation-readable active dash flag derived from simulation state. */
  dashing: Uint8Array;
  /** Presentation-readable dash direction for animation and effects. */
  dashDirection: Uint8Array;
  /** Whether the deterministic dash cooldown has completed. */
  dashReady: Uint8Array;
}
export interface GameplayPresentationValue {
  /** Authoritative vertical-slice phase. */
  phase: GamePhaseName | number;
  moveX: MoveDirectionName | number;
  /** Presentation-readable active dash flag derived from simulation state. */
  dashing: boolean;
  /** Presentation-readable dash direction for animation and effects. */
  dashDirection: PresentationDashDirectionName | number;
  /** Whether the deterministic dash cooldown has completed. */
  dashReady: boolean;
}
/** Read-only presentation snapshot derived from consequential simulation state. (resource, presentation-only) */
export const GameplayPresentation = typeToken<GameplayPresentationViews, GameplayPresentationValue>('GameplayPresentation', 'resource', { sig: 'phase:enum:1,moveX:enum:1,dashing:bool:1,dashDirection:enum:1,dashReady:bool:1', read: (v: GameplayPresentationViews, i: number, o: Record<string, unknown>) => { o.phase = $r.enm('GamePhase', v.phase[i]!); o.moveX = $r.enm('MoveDirection', v.moveX[i]!); o.dashing = v.dashing[i] !== 0; o.dashDirection = $r.enm('PresentationDashDirection', v.dashDirection[i]!); o.dashReady = v.dashReady[i] !== 0; return o; } });

export interface RoomCollisionStateViews {
  /** Whether the current room tilemap has queued its static collision cells. */
  built: Uint8Array;
  /** Expected derived cell count; confirms deferred spawns are visible before play begins. */
  cellCount: Uint32Array;
}
export interface RoomCollisionStateValue {
  /** Whether the current room tilemap has queued its static collision cells. */
  built: boolean;
  /** Expected derived cell count; confirms deferred spawns are visible before play begins. */
  cellCount: number;
}
/** One-shot deterministic bootstrap state for tilemap-derived collision. (resource, sim) */
export const RoomCollisionState = typeToken<RoomCollisionStateViews, RoomCollisionStateValue>('RoomCollisionState', 'resource', { sig: 'built:bool:1,cellCount:u32:1', read: (v: RoomCollisionStateViews, i: number, o: Record<string, unknown>) => { o.built = v.built[i] !== 0; o.cellCount = v.cellCount[i]; return o; } });

export interface RoomLandmarkViews {
  /** Authored room landmark used by later gameplay tickets and content verification. */
  kind: Uint8Array;
}
export interface RoomLandmarkValue {
  /** Authored room landmark used by later gameplay tickets and content verification. */
  kind: RoomLandmarkKindName | number;
}
/** A deterministic marker placed in the room scene without duplicating collision geometry. (component, sim) */
export const RoomLandmark = typeToken<RoomLandmarkViews, RoomLandmarkValue>('RoomLandmark', 'component', { sig: 'kind:enum:1', read: (v: RoomLandmarkViews, i: number, o: Record<string, unknown>) => { o.kind = $r.enm('RoomLandmarkKind', v.kind[i]!); return o; } });

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

export interface PlatformCollisionCellViews {
  /** Grid-space x coordinate. */
  x: Int32Array;
  /** Grid-space y coordinate. */
  y: Int32Array;
}
export interface PlatformCollisionCellValue {
  /** Grid-space x coordinate. */
  x: number;
  /** Grid-space y coordinate. */
  y: number;
}
/** A solid cell in the deterministic platform collision grid. Rendering is independent. (component, sim) */
export const PlatformCollisionCell = typeToken<PlatformCollisionCellViews, PlatformCollisionCellValue>('PlatformCollisionCell', 'component', { sig: 'x:i32:1,y:i32:1', read: (v: PlatformCollisionCellViews, i: number, o: Record<string, unknown>) => { o.x = v.x[i]; o.y = v.y[i]; return o; } });

export interface PlatformCollisionGridViews {
  /** World x coordinate of cell (0, 0) lower-left corner. */
  originX: Float32Array;
  /** World y coordinate of cell (0, 0) lower-left corner. */
  originY: Float32Array;
  /** Square cell size in world units. */
  cellSize: Float32Array;
}
export interface PlatformCollisionGridValue {
  /** World x coordinate of cell (0, 0) lower-left corner. */
  originX: number;
  /** World y coordinate of cell (0, 0) lower-left corner. */
  originY: number;
  /** Square cell size in world units. */
  cellSize: number;
}
/** World mapping for deterministic platform collision cells. (resource, sim) */
export const PlatformCollisionGrid = typeToken<PlatformCollisionGridViews, PlatformCollisionGridValue>('PlatformCollisionGrid', 'resource', { sig: 'originX:f32:1,originY:f32:1,cellSize:f32:1', read: (v: PlatformCollisionGridViews, i: number, o: Record<string, unknown>) => { o.originX = v.originX[i]; o.originY = v.originY[i]; o.cellSize = v.cellSize[i]; return o; } });

export interface PlayerViews {
  /** Maximum horizontal speed in world units per second. */
  maxHorizontalSpeed: Float32Array;
  /** Grounded acceleration in world units per second squared. */
  groundAcceleration: Float32Array;
  /** Grounded braking and reversal rate in world units per second squared. */
  groundDeceleration: Float32Array;
  /** Airborne acceleration in world units per second squared. */
  airAcceleration: Float32Array;
  /** Airborne braking and reversal rate in world units per second squared. */
  airDeceleration: Float32Array;
  /** Initial vertical jump speed in world units per second. */
  jumpSpeed: Float32Array;
  /** Downward acceleration in world units per second squared. */
  gravity: Float32Array;
  /** Maximum downward speed in world units per second. */
  maxFallSpeed: Float32Array;
  /** Upward velocity multiplier applied when jump is released early. */
  jumpCutMultiplier: Float32Array;
  /** Fixed simulation steps after leaving ground in which the ground jump remains available. */
  coyoteSteps: Uint32Array;
  /** Fixed simulation steps for which a jump edge remains queued. */
  jumpBufferSteps: Uint32Array;
  /** Air jumps restored on grounded contact. */
  airJumps: Uint32Array;
  /** Locked horizontal speed while dashing in world units per second. */
  dashSpeed: Float32Array;
  /** Fixed simulation steps for which a dash moves at dash speed. */
  dashDurationSteps: Uint32Array;
  /** Fixed simulation steps from activation until another dash may start. */
  dashCooldownSteps: Uint32Array;
  /** Fixed simulation steps after a dash before movement and jump control return. */
  dashControlLockSteps: Uint32Array;
  /** Gravity multiplier while an airborne dash is active. */
  dashGravityMultiplier: Float32Array;
  /** Half-width of the deterministic player collision box. */
  collisionHalfWidth: Float32Array;
  /** Height of the deterministic player collision box measured upward from the actor origin. */
  collisionHeight: Float32Array;
  /** Maximum ledge height climbed automatically while grounded. */
  maxStepHeight: Float32Array;
  /** Maximum downward floor snap used to stay stable over shallow cliff edges. */
  groundSnapDistance: Float32Array;
}
export interface PlayerValue {
  /** Maximum horizontal speed in world units per second. */
  maxHorizontalSpeed: number;
  /** Grounded acceleration in world units per second squared. */
  groundAcceleration: number;
  /** Grounded braking and reversal rate in world units per second squared. */
  groundDeceleration: number;
  /** Airborne acceleration in world units per second squared. */
  airAcceleration: number;
  /** Airborne braking and reversal rate in world units per second squared. */
  airDeceleration: number;
  /** Initial vertical jump speed in world units per second. */
  jumpSpeed: number;
  /** Downward acceleration in world units per second squared. */
  gravity: number;
  /** Maximum downward speed in world units per second. */
  maxFallSpeed: number;
  /** Upward velocity multiplier applied when jump is released early. */
  jumpCutMultiplier: number;
  /** Fixed simulation steps after leaving ground in which the ground jump remains available. */
  coyoteSteps: number;
  /** Fixed simulation steps for which a jump edge remains queued. */
  jumpBufferSteps: number;
  /** Air jumps restored on grounded contact. */
  airJumps: number;
  /** Locked horizontal speed while dashing in world units per second. */
  dashSpeed: number;
  /** Fixed simulation steps for which a dash moves at dash speed. */
  dashDurationSteps: number;
  /** Fixed simulation steps from activation until another dash may start. */
  dashCooldownSteps: number;
  /** Fixed simulation steps after a dash before movement and jump control return. */
  dashControlLockSteps: number;
  /** Gravity multiplier while an airborne dash is active. */
  dashGravityMultiplier: number;
  /** Half-width of the deterministic player collision box. */
  collisionHalfWidth: number;
  /** Height of the deterministic player collision box measured upward from the actor origin. */
  collisionHeight: number;
  /** Maximum ledge height climbed automatically while grounded. */
  maxStepHeight: number;
  /** Maximum downward floor snap used to stay stable over shallow cliff edges. */
  groundSnapDistance: number;
}
/** Player-owned deterministic movement configuration. (component, sim) */
export const Player = typeToken<PlayerViews, PlayerValue>('Player', 'component', { sig: 'maxHorizontalSpeed:f32:1,groundAcceleration:f32:1,groundDeceleration:f32:1,airAcceleration:f32:1,airDeceleration:f32:1,jumpSpeed:f32:1,gravity:f32:1,maxFallSpeed:f32:1,jumpCutMultiplier:f32:1,coyoteSteps:u32:1,jumpBufferSteps:u32:1,airJumps:u32:1,dashSpeed:f32:1,dashDurationSteps:u32:1,dashCooldownSteps:u32:1,dashControlLockSteps:u32:1,dashGravityMultiplier:f32:1,collisionHalfWidth:f32:1,collisionHeight:f32:1,maxStepHeight:f32:1,groundSnapDistance:f32:1', read: (v: PlayerViews, i: number, o: Record<string, unknown>) => { o.maxHorizontalSpeed = v.maxHorizontalSpeed[i]; o.groundAcceleration = v.groundAcceleration[i]; o.groundDeceleration = v.groundDeceleration[i]; o.airAcceleration = v.airAcceleration[i]; o.airDeceleration = v.airDeceleration[i]; o.jumpSpeed = v.jumpSpeed[i]; o.gravity = v.gravity[i]; o.maxFallSpeed = v.maxFallSpeed[i]; o.jumpCutMultiplier = v.jumpCutMultiplier[i]; o.coyoteSteps = v.coyoteSteps[i]; o.jumpBufferSteps = v.jumpBufferSteps[i]; o.airJumps = v.airJumps[i]; o.dashSpeed = v.dashSpeed[i]; o.dashDurationSteps = v.dashDurationSteps[i]; o.dashCooldownSteps = v.dashCooldownSteps[i]; o.dashControlLockSteps = v.dashControlLockSteps[i]; o.dashGravityMultiplier = v.dashGravityMultiplier[i]; o.collisionHalfWidth = v.collisionHalfWidth[i]; o.collisionHeight = v.collisionHeight[i]; o.maxStepHeight = v.maxStepHeight[i]; o.groundSnapDistance = v.groundSnapDistance[i]; return o; } });

export interface PlayerActionStateViews {
  moveX: Float32Array;
  jump: Uint8Array;
  jumpHeld: Uint8Array;
  dash: Uint8Array;
  fire: Uint8Array;
  crouch: Uint8Array;
}
export interface PlayerActionStateValue {
  moveX: number;
  jump: boolean;
  jumpHeld: boolean;
  dash: boolean;
  fire: boolean;
  crouch: boolean;
}
/** Current normalized action-map sample. Written from recorded ActionState before gameplay systems run. (resource, sim) */
export const PlayerActionState = typeToken<PlayerActionStateViews, PlayerActionStateValue>('PlayerActionState', 'resource', { sig: 'moveX:f32:1,jump:bool:1,jumpHeld:bool:1,dash:bool:1,fire:bool:1,crouch:bool:1', read: (v: PlayerActionStateViews, i: number, o: Record<string, unknown>) => { o.moveX = v.moveX[i]; o.jump = v.jump[i] !== 0; o.jumpHeld = v.jumpHeld[i] !== 0; o.dash = v.dash[i] !== 0; o.fire = v.fire[i] !== 0; o.crouch = v.crouch[i] !== 0; return o; } });

export interface PlayerAnimationPresentationViews {
  /** Current authored flipbook selected by presentation. */
  clip: Uint32Array;
}
export interface PlayerAnimationPresentationValue {
  /** Current authored flipbook selected by presentation. */
  clip: string | null;
}
/** Presentation-only animation controller state; never read by gameplay. (component, presentation-only) */
export const PlayerAnimationPresentation = typeToken<PlayerAnimationPresentationViews, PlayerAnimationPresentationValue>('PlayerAnimationPresentation', 'component', { sig: 'clip:asset:1', read: (v: PlayerAnimationPresentationViews, i: number, o: Record<string, unknown>) => { o.clip = $r.asset(v.clip[i]!); return o; } });

export interface PlayerControlViews {
  /** Recorded horizontal intent normalized to [-1, 1]. */
  moveX: Float32Array;
  /** Whether the recorded crouch control is held. */
  crouch: Uint8Array;
  /** Whether jump is currently held for release-cut detection. */
  jumpHeld: Uint8Array;
}
export interface PlayerControlValue {
  /** Recorded horizontal intent normalized to [-1, 1]. */
  moveX: number;
  /** Whether the recorded crouch control is held. */
  crouch: boolean;
  /** Whether jump is currently held for release-cut detection. */
  jumpHeld: boolean;
}
/** Latest recorded held player control. Action systems consume step-scoped intent events directly. (component, sim) */
export const PlayerControl = typeToken<PlayerControlViews, PlayerControlValue>('PlayerControl', 'component', { sig: 'moveX:f32:1,crouch:bool:1,jumpHeld:bool:1', read: (v: PlayerControlViews, i: number, o: Record<string, unknown>) => { o.moveX = v.moveX[i]; o.crouch = v.crouch[i] !== 0; o.jumpHeld = v.jumpHeld[i] !== 0; return o; } });

export interface PlayerDashStateViews {
  /** Whether the player is currently in the fixed-step dash movement phase. */
  active: Uint8Array;
  direction: Uint8Array;
  /** Dash movement steps remaining, including the current step. */
  activeStepsRemaining: Uint32Array;
  /** Steps before another dash activation is accepted. */
  cooldownStepsRemaining: Uint32Array;
  /** Steps before horizontal and jump control are accepted again. */
  controlLockStepsRemaining: Uint32Array;
}
export interface PlayerDashStateValue {
  /** Whether the player is currently in the fixed-step dash movement phase. */
  active: boolean;
  direction: DashDirectionName | number;
  /** Dash movement steps remaining, including the current step. */
  activeStepsRemaining: number;
  /** Steps before another dash activation is accepted. */
  cooldownStepsRemaining: number;
  /** Steps before horizontal and jump control are accepted again. */
  controlLockStepsRemaining: number;
}
/** Authoritative deterministic dash state. Presentation may observe but never write it. (component, sim) */
export const PlayerDashState = typeToken<PlayerDashStateViews, PlayerDashStateValue>('PlayerDashState', 'component', { sig: 'active:bool:1,direction:enum:1,activeStepsRemaining:u32:1,cooldownStepsRemaining:u32:1,controlLockStepsRemaining:u32:1', read: (v: PlayerDashStateViews, i: number, o: Record<string, unknown>) => { o.active = v.active[i] !== 0; o.direction = $r.enm('DashDirection', v.direction[i]!); o.activeStepsRemaining = v.activeStepsRemaining[i]; o.cooldownStepsRemaining = v.cooldownStepsRemaining[i]; o.controlLockStepsRemaining = v.controlLockStepsRemaining[i]; return o; } });

export interface PlayerGroundContactViews {
  /** Collision-owned ground contact fact consumed by movement. */
  grounded: Uint8Array;
}
export interface PlayerGroundContactValue {
  /** Collision-owned ground contact fact consumed by movement. */
  grounded: boolean;
}
/** Deterministic traversal/collision output. Movement reads but never writes this component. (component, sim) */
export const PlayerGroundContact = typeToken<PlayerGroundContactViews, PlayerGroundContactValue>('PlayerGroundContact', 'component', { sig: 'grounded:bool:1', read: (v: PlayerGroundContactViews, i: number, o: Record<string, unknown>) => { o.grounded = v.grounded[i] !== 0; return o; } });

export interface PlayerIntentViews {
  moveX: Float32Array;
  jump: Uint8Array;
  jumpHeld: Uint8Array;
  dash: Uint8Array;
  fire: Uint8Array;
  crouch: Uint8Array;
}
export interface PlayerIntentValue {
  moveX: number;
  jump: boolean;
  jumpHeld: boolean;
  dash: boolean;
  fire: boolean;
  crouch: boolean;
}
/** Recorded boundary event produced by keyboard, gamepad, touch, or UI adapters. (event, sim) */
export const PlayerIntent = typeToken<PlayerIntentViews, PlayerIntentValue>('PlayerIntent', 'event', { sig: 'moveX:f32:1,jump:bool:1,jumpHeld:bool:1,dash:bool:1,fire:bool:1,crouch:bool:1', read: (v: PlayerIntentViews, i: number, o: Record<string, unknown>) => { o.moveX = v.moveX[i]; o.jump = v.jump[i] !== 0; o.jumpHeld = v.jumpHeld[i] !== 0; o.dash = v.dash[i] !== 0; o.fire = v.fire[i] !== 0; o.crouch = v.crouch[i] !== 0; return o; } });

export interface PlayerMotionViews {
  /** Authoritative horizontal velocity in world units per second. */
  horizontalVelocity: Float32Array;
  /** Authoritative vertical velocity in world units per second. */
  verticalVelocity: Float32Array;
  /** Movement-interpreted grounded state, one fixed step behind raw collision support. */
  groundedForMovement: Uint8Array;
  facing: Uint8Array;
  /** Remaining fixed steps in the grounded grace window. */
  coyoteStepsRemaining: Uint32Array;
  /** Remaining fixed steps for a queued jump request. */
  jumpBufferStepsRemaining: Uint32Array;
  /** Air jumps available before the next grounded contact. */
  airJumpsRemaining: Uint32Array;
  /** Jump hold state from the previous fixed step for deterministic release detection. */
  jumpWasHeld: Uint8Array;
  /** Whether contact is ignored until the actor has separated after jumping. */
  ignoreGroundContact: Uint8Array;
}
export interface PlayerMotionValue {
  /** Authoritative horizontal velocity in world units per second. */
  horizontalVelocity: number;
  /** Authoritative vertical velocity in world units per second. */
  verticalVelocity: number;
  /** Movement-interpreted grounded state, one fixed step behind raw collision support. */
  groundedForMovement: boolean;
  facing: FacingDirectionName | number;
  /** Remaining fixed steps in the grounded grace window. */
  coyoteStepsRemaining: number;
  /** Remaining fixed steps for a queued jump request. */
  jumpBufferStepsRemaining: number;
  /** Air jumps available before the next grounded contact. */
  airJumpsRemaining: number;
  /** Jump hold state from the previous fixed step for deterministic release detection. */
  jumpWasHeld: boolean;
  /** Whether contact is ignored until the actor has separated after jumping. */
  ignoreGroundContact: boolean;
}
/** Authoritative player movement state. Presentation may observe but never write it. (component, sim) */
export const PlayerMotion = typeToken<PlayerMotionViews, PlayerMotionValue>('PlayerMotion', 'component', { sig: 'horizontalVelocity:f32:1,verticalVelocity:f32:1,groundedForMovement:bool:1,facing:enum:1,coyoteStepsRemaining:u32:1,jumpBufferStepsRemaining:u32:1,airJumpsRemaining:u32:1,jumpWasHeld:bool:1,ignoreGroundContact:bool:1', read: (v: PlayerMotionViews, i: number, o: Record<string, unknown>) => { o.horizontalVelocity = v.horizontalVelocity[i]; o.verticalVelocity = v.verticalVelocity[i]; o.groundedForMovement = v.groundedForMovement[i] !== 0; o.facing = $r.enm('FacingDirection', v.facing[i]!); o.coyoteStepsRemaining = v.coyoteStepsRemaining[i]; o.jumpBufferStepsRemaining = v.jumpBufferStepsRemaining[i]; o.airJumpsRemaining = v.airJumpsRemaining[i]; o.jumpWasHeld = v.jumpWasHeld[i] !== 0; o.ignoreGroundContact = v.ignoreGroundContact[i] !== 0; return o; } });

export interface PlayerStepInputViews {
  /** Jump press for the current fixed step only. */
  jumpRequested: Uint8Array;
  /** Dash press for the current fixed step only. */
  dashRequested: Uint8Array;
}
export interface PlayerStepInputValue {
  /** Jump press for the current fixed step only. */
  jumpRequested: boolean;
  /** Dash press for the current fixed step only. */
  dashRequested: boolean;
}
/** Unconditionally overwritten input sample consumed in the same fixed step. (resource, sim) */
export const PlayerStepInput = typeToken<PlayerStepInputViews, PlayerStepInputValue>('PlayerStepInput', 'resource', { sig: 'jumpRequested:bool:1,dashRequested:bool:1', read: (v: PlayerStepInputViews, i: number, o: Record<string, unknown>) => { o.jumpRequested = v.jumpRequested[i] !== 0; o.dashRequested = v.dashRequested[i] !== 0; return o; } });
