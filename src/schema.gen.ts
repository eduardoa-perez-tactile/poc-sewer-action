// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
import { typeToken, rowRead as $r, registerSchema, dataToken, type DataRecord, type EntityId } from '@gameengine/runtime';
import './content.gen.ts';

export type { EntityId };

/** Project schema IR, registered with the engine when the bundle boots. */
export const schemaIr = {
  "version": 1,
  "package": "SewerAction",
  "enums": [
    {
      "name": "AudioCueKind",
      "values": [
        "Shot",
        "Laser",
        "PlayerDeath",
        "EnemyDeath"
      ],
      "package": "SewerAction"
    },
    {
      "name": "EnemyProjectileKind",
      "values": [
        "Bullet",
        "Bomb"
      ],
      "package": "SewerAction"
    },
    {
      "name": "ComparisonAction",
      "values": [
        "open",
        "close",
        "baseline",
        "polished",
        "shake",
        "recoil",
        "particles",
        "flashes",
        "audio"
      ],
      "package": "SewerAction"
    },
    {
      "name": "ComparisonExposure",
      "values": [
        "hidden",
        "developer",
        "bonus"
      ],
      "package": "SewerAction"
    },
    {
      "name": "EnemyState",
      "values": [
        "Idle",
        "Patrol",
        "Chase",
        "Attack",
        "Stunned",
        "Dead"
      ],
      "package": "SewerAction"
    },
    {
      "name": "EnemyFacing",
      "values": [
        "Left",
        "Right"
      ],
      "package": "SewerAction"
    },
    {
      "name": "EnemyAttackKind",
      "values": [
        "None",
        "Shoot",
        "CrouchShoot",
        "Bomb"
      ],
      "package": "SewerAction"
    },
    {
      "name": "EnemyRestartBrainState",
      "values": [
        "Idle",
        "Patrol",
        "Chase"
      ],
      "package": "SewerAction"
    },
    {
      "name": "EnemyRestartFacing",
      "values": [
        "Left",
        "Right"
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
      "name": "PresentationFacingDirection",
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
      "name": "FinalEncounterPhase",
      "values": [
        "Waiting",
        "Guard",
        "Warning",
        "Bombardment",
        "ExitOpen",
        "Won",
        "Failed"
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
    },
    {
      "name": "PlayerRestartFacing",
      "values": [
        "Left",
        "Right"
      ],
      "package": "SewerAction"
    }
  ],
  "types": [
    {
      "name": "CombatEffect",
      "kind": "event",
      "sim": false,
      "fields": [
        {
          "name": "kind",
          "kind": "string",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "position",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2
        },
        {
          "name": "step",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Write-only feedback from accepted projectile releases and impacts; never consumed by gameplay."
    },
    {
      "name": "CombatVisual",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "kind",
          "kind": "string",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "remaining",
          "kind": "array",
          "scalar": "f32",
          "lanes": 4
        },
        {
          "name": "bursts",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        }
      ],
      "package": "SewerAction",
      "doc": "Fixed presentation effect slot, hidden after its authored one-shot duration."
    },
    {
      "name": "CombatVisualState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "active",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "lastStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        }
      ],
      "package": "SewerAction",
      "doc": "Run gate and per-step feedback deduplication."
    },
    {
      "name": "SoldierVisual",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "actor",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "clip",
          "kind": "asset",
          "scalar": "u32",
          "lanes": 1,
          "assetType": "clip2d",
          "default": "art/soldier/idle.clip2d.json"
        },
        {
          "name": "previousPosition",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2
        },
        {
          "name": "initialized",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "flashesApplied",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        },
        {
          "name": "time",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "frame",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        }
      ],
      "package": "SewerAction",
      "doc": "Presentation proxy; the actor retains the authoritative attack Clip2D clock."
    },
    {
      "name": "SoldierVisualState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "active",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        }
      ],
      "package": "SewerAction",
      "doc": "Stops the animation adapter between movement, combat and settling bursts."
    },
    {
      "name": "AudioCue",
      "kind": "event",
      "sim": false,
      "fields": [
        {
          "name": "kind",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "AudioCueKind"
        },
        {
          "name": "step",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Accepted gameplay consequence, write-only from sim to audio."
    },
    {
      "name": "GameplayAudioState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "lastSteps",
          "kind": "array",
          "scalar": "u32",
          "lanes": 6
        },
        {
          "name": "nextSteps",
          "kind": "array",
          "scalar": "u32",
          "lanes": 6
        }
      ],
      "package": "SewerAction",
      "doc": "Fixed-step cue deduplication and absolute cooldown deadlines; never read by gameplay."
    },
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
      "name": "ActorSpawn",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "position",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ],
          "doc": "Authored restart position for this actor."
        }
      ],
      "package": "SewerAction",
      "doc": "Stable authored state used by deterministic full restart."
    },
    {
      "name": "Alive",
      "kind": "tag",
      "sim": true,
      "fields": [],
      "package": "SewerAction",
      "doc": "Present only while an actor can receive hits and participate in combat."
    },
    {
      "name": "Cadaver",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "ageSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "settleStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 10
        },
        {
          "name": "velocity",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ]
        }
      ],
      "package": "SewerAction",
      "doc": "Non-combat enemy corpse that settles deterministically and then remains still."
    },
    {
      "name": "CadaverSettling",
      "kind": "tag",
      "sim": true,
      "fields": [],
      "package": "SewerAction",
      "doc": "Present only during the bounded cadaver settling burst."
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
        },
        {
          "name": "bypassInvulnerability",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Environmental entry damage must not leave an invulnerable player stranded alive in water."
        },
        {
          "name": "knockback",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ]
        }
      ],
      "package": "SewerAction",
      "doc": "Combat and hazards request damage; the health system validates and applies it."
    },
    {
      "name": "EnemyAttackPoolState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "warmed",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        }
      ],
      "package": "SewerAction",
      "doc": "One-shot enemy bullet and bomb pool bootstrap state."
    },
    {
      "name": "EnemyProjectile",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "kind",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "EnemyProjectileKind",
          "default": "Bullet"
        },
        {
          "name": "velocityX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "velocityY",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "gravity",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": 0
        },
        {
          "name": "distanceRemaining",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": 0
        },
        {
          "name": "lifetimeStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
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
          "name": "owner",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2,
          "optional": true
        }
      ],
      "package": "SewerAction",
      "doc": "Pooled fixed-step enemy bullet or ballistic bomb state."
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
        },
        {
          "name": "invulnerabilitySteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 6,
          "doc": "Fixed steps between accepted hits."
        },
        {
          "name": "invulnerableUntilStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "First fixed step on which another hit is valid."
        }
      ],
      "package": "SewerAction",
      "doc": "Single source of truth for actor survivability."
    },
    {
      "name": "HitReacting",
      "kind": "tag",
      "sim": true,
      "fields": [],
      "package": "SewerAction",
      "doc": "Present only while fixed-step knockback remains active."
    },
    {
      "name": "HitReaction",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "steps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 8,
          "min": 1
        },
        {
          "name": "stepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "knockback",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ],
          "doc": "Current deterministic world-space knockback velocity."
        }
      ],
      "package": "SewerAction",
      "doc": "Fixed-step hit stun and knockback owned by gameplay."
    },
    {
      "name": "Projectile",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "direction",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1,
          "min": -1,
          "max": 1,
          "doc": "Horizontal travel direction, always -1 or 1 while active."
        },
        {
          "name": "speed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 18,
          "min": 0
        },
        {
          "name": "distanceRemaining",
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
        },
        {
          "name": "owner",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2,
          "optional": true
        }
      ],
      "package": "SewerAction",
      "doc": "Pooled fixed-step projectile state."
    },
    {
      "name": "ProjectilePoolState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "warmed",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Whether the deterministic projectile pool has been queued."
        }
      ],
      "package": "SewerAction",
      "doc": "One-shot projectile pool bootstrap state."
    },
    {
      "name": "RestartRequested",
      "kind": "event",
      "sim": true,
      "fields": [],
      "package": "SewerAction",
      "doc": "Recorded intent to rebuild the current encounter from authored state."
    },
    {
      "name": "Weapon",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "fireIntervalSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 9,
          "min": 1,
          "doc": "Fixed simulation steps between accepted shots."
        },
        {
          "name": "cooldownStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "Fixed steps until another shot may be accepted."
        },
        {
          "name": "projectileSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 18,
          "min": 0,
          "doc": "Projectile speed in world units per second."
        },
        {
          "name": "projectileRange",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 12,
          "min": 0,
          "doc": "Maximum projectile travel distance in world units."
        },
        {
          "name": "recoilSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1.5,
          "min": 0,
          "doc": "Horizontal velocity impulse opposite the firing direction."
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
      "name": "ComparisonRequested",
      "kind": "event",
      "sim": false,
      "fields": [
        {
          "name": "enabled",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "action",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "ComparisonAction"
        }
      ],
      "package": "SewerAction",
      "doc": "View/controller presentation intent; never consumed by simulation."
    },
    {
      "name": "EnemyFlashState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "enabled",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        }
      ],
      "package": "SewerAction",
      "doc": "Last applied flash choice; global tint refresh only when this choice changes."
    },
    {
      "name": "GameFeelComparison",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "config",
          "kind": "asset",
          "scalar": "u32",
          "lanes": 1,
          "assetType": "data",
          "default": "settings/game-feel.json"
        },
        {
          "name": "initialized",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "exposure",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "ComparisonExposure",
          "default": "hidden"
        },
        {
          "name": "open",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "shake",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "recoil",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "particles",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        },
        {
          "name": "flashes",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        },
        {
          "name": "audio",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        }
      ],
      "package": "SewerAction",
      "doc": "Presentation choices only. No gameplay system reads this resource."
    },
    {
      "name": "ShotFeedbackState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "lastStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        }
      ],
      "package": "SewerAction",
      "doc": "Accepted shot deduplication, including cues suppressed by comparison choices."
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
          "default": "Patrol"
        },
        {
          "name": "facing",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "EnemyFacing",
          "default": "Left"
        },
        {
          "name": "patrolMinX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": -2,
          "doc": "Inclusive left edge of the authored patrol route."
        },
        {
          "name": "patrolMaxX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 2,
          "doc": "Inclusive right edge of the authored patrol route."
        },
        {
          "name": "patrolSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1.25,
          "min": 0
        },
        {
          "name": "chaseSpeed",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 2.75,
          "min": 0
        },
        {
          "name": "detectionRangeX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 5,
          "min": 0
        },
        {
          "name": "detectionRangeY",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 2,
          "min": 0
        },
        {
          "name": "stopDistance",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 1.25,
          "min": 0
        },
        {
          "name": "collisionHalfWidth",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.35,
          "min": 0
        },
        {
          "name": "edgeProbeDistance",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0.08,
          "min": 0
        },
        {
          "name": "turnPauseSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 18
        },
        {
          "name": "turnPauseStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "targetMemorySteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 90
        },
        {
          "name": "targetMemoryStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "targetDetected",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "lastKnownTargetX",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "attackKind",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "EnemyAttackKind",
          "default": "None"
        },
        {
          "name": "attackSequence",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "doc": "Round-robin attack selection; deterministic and replayed."
        },
        {
          "name": "attackRange",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 4.5,
          "min": 0
        },
        {
          "name": "attackCooldownSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 48,
          "min": 1
        },
        {
          "name": "attackCooldownStepsRemaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        },
        {
          "name": "attackTelegraphed",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "True from attack start until its clip event releases the projectile."
        }
      ],
      "package": "SewerAction",
      "doc": "Deterministic soldier configuration, decisions, chase memory and ranged attack cadence."
    },
    {
      "name": "EnemyRestartState",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "state",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "EnemyRestartBrainState",
          "default": "Patrol"
        },
        {
          "name": "facing",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "EnemyRestartFacing",
          "default": "Left"
        },
        {
          "name": "attackSequence",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        }
      ],
      "package": "SewerAction",
      "doc": "Authored enemy state restored by a deterministic encounter restart."
    },
    {
      "name": "CameraFeedback",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "active",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "Whether transient feedback still needs presentation frames."
        },
        {
          "name": "bump",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ],
          "doc": "Short presentation-only camera impulse requested by a feedback adapter."
        },
        {
          "name": "shake",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": 0,
          "doc": "Presentation-only shake strength; never visible to gameplay."
        },
        {
          "name": "shakeTime",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": 0,
          "doc": "Remaining presentation seconds for the current shake."
        }
      ],
      "package": "SewerAction",
      "doc": "Transient camera feedback hooks consumed only by LateUpdate."
    },
    {
      "name": "CameraFollowState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "center",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ],
          "doc": "Settled presentation camera center applied as a visual offset."
        },
        {
          "name": "target",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ],
          "doc": "Bounded target after dead-zone and directional look-ahead."
        },
        {
          "name": "lookAhead",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "doc": "Current horizontal look-ahead in world units."
        },
        {
          "name": "settled",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false,
          "doc": "True once the follow rig can stop rewriting camera state."
        }
      ],
      "package": "SewerAction",
      "doc": "Presentation-owned camera state excluded from gameplay hashes and queries."
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
        },
        {
          "name": "playerPosition",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ],
          "doc": "Latest authoritative player position copied for presentation systems."
        },
        {
          "name": "playerVelocity",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            0,
            0
          ],
          "doc": "Latest authoritative player velocity copied for presentation systems."
        },
        {
          "name": "playerFacing",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "PresentationFacingDirection",
          "default": "Right",
          "doc": "Authoritative facing direction copied for presentation look-ahead and feedback."
        }
      ],
      "package": "SewerAction",
      "doc": "Read-only presentation snapshot derived from consequential simulation state."
    },
    {
      "name": "ParallaxLayer",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "factor",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2,
          "default": [
            1,
            1
          ],
          "doc": "Fraction of camera motion retained by this presentation layer."
        }
      ],
      "package": "SewerAction",
      "doc": "Authored presentation-only parallax configuration."
    },
    {
      "name": "RoomCameraBounds",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "left",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": -8,
          "doc": "Authored left edge of the room camera envelope."
        },
        {
          "name": "right",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 8,
          "doc": "Authored right edge of the room camera envelope."
        },
        {
          "name": "bottom",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": -4.5,
          "doc": "Authored bottom edge of the room camera envelope."
        },
        {
          "name": "top",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 4.5,
          "doc": "Authored top edge of the room camera envelope."
        }
      ],
      "package": "SewerAction",
      "doc": "Scene-authored presentation bounds for the active room camera."
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
      "name": "WaterContact",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "inside",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        },
        {
          "name": "splashCooldownSteps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 30,
          "min": 1
        },
        {
          "name": "nextSplashStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        }
      ],
      "package": "SewerAction",
      "doc": "Player contact with the union of water volumes. Entry damage is independent of splash cooldown."
    },
    {
      "name": "WaterEntered",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "player",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "position",
          "kind": "vec2",
          "scalar": "f32",
          "lanes": 2
        },
        {
          "name": "entryStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Accepted water entry fact; presentation observes this without affecting the hazard outcome."
    },
    {
      "name": "WaterSplash",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "secondsRemaining",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 0,
          "min": 0
        },
        {
          "name": "lastEntryStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0
        }
      ],
      "package": "SewerAction",
      "doc": "One preallocated splash slot for the single-player slice, hidden when its one-shot clip ends."
    },
    {
      "name": "WaterSplashState",
      "kind": "resource",
      "sim": false,
      "fields": [
        {
          "name": "active",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": false
        }
      ],
      "package": "SewerAction",
      "doc": "Run gate for bounded splash presentation; stops all adapter work once hidden."
    },
    {
      "name": "EncounterMember",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "beat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "activated",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Authored encounter membership; bounded actors allocated once during boot."
    },
    {
      "name": "FinalCue",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "phase",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Static in-world phase lamp; phase 2 is the existing outlet arrow."
    },
    {
      "name": "FinalEncounter",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "phase",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "FinalEncounterPhase",
          "default": "Waiting"
        },
        {
          "name": "deadlineStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Final fight owner. Warning uses an absolute fixed-step deadline; terminal phases are latched."
    },
    {
      "name": "FinalSoldier",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "phase",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "active",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        }
      ],
      "package": "SewerAction",
      "doc": "One preallocated actor per final combat phase; inactive actors cannot take damage."
    },
    {
      "name": "FinalWarning",
      "kind": "tag",
      "sim": true,
      "fields": [],
      "package": "SewerAction",
      "doc": "Present only while the final warning deadline needs fixed-step work."
    },
    {
      "name": "LevelCollisionIndex",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "words",
          "kind": "array",
          "scalar": "u32",
          "lanes": 128
        }
      ],
      "package": "SewerAction",
      "doc": "Four packed 32-bit words per row; at most 128 columns by 32 rows."
    },
    {
      "name": "LevelProgress",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "data",
          "kind": "asset",
          "scalar": "u32",
          "lanes": 1,
          "assetType": "data"
        },
        {
          "name": "built",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "beat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "checkpoint",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "cleared",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "finished",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "activationPending",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        }
      ],
      "package": "SewerAction",
      "doc": "Level anchor owns ordered progress and checkpoint state. Route gates and checkpoint state; finished means the final outlet was accepted."
    },
    {
      "name": "TerrainVisual",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "row",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "columns",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Merged visible sewer ledges derived from the collision tilemap during boot."
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
        },
        {
          "name": "columns",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "max": 128,
          "doc": "Active columns in the packed static occupancy rows."
        },
        {
          "name": "rows",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 0,
          "max": 32,
          "doc": "Active rows in the packed static occupancy rows."
        },
        {
          "name": "solidRows",
          "kind": "array",
          "scalar": "u32",
          "lanes": 32,
          "doc": "Immutable packed index derived exclusively by BuildRoomCollision from the same static cells it spawns."
        }
      ],
      "package": "SewerAction",
      "doc": "World mapping and builder-owned immutable lookup index for deterministic platform collision cells."
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
      "name": "PlayerRestartState",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "facing",
          "kind": "enum",
          "scalar": "u8",
          "lanes": 1,
          "enumName": "PlayerRestartFacing",
          "default": "Right"
        },
        {
          "name": "grounded",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1,
          "default": true
        },
        {
          "name": "airJumps",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 1
        }
      ],
      "package": "SewerAction",
      "doc": "Authored player state restored by a deterministic encounter restart."
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
  "services": [],
  "data": [
    {
      "name": "ComparisonDef",
      "schema": {
        "type": "object",
        "properties": {
          "exposure": {
            "enum": [
              "hidden",
              "developer",
              "bonus"
            ]
          },
          "shake": {
            "type": "boolean"
          },
          "recoil": {
            "type": "boolean"
          },
          "particles": {
            "type": "boolean"
          },
          "flashes": {
            "type": "boolean"
          },
          "audio": {
            "type": "boolean"
          }
        },
        "required": [
          "exposure",
          "shake",
          "recoil",
          "particles",
          "flashes",
          "audio"
        ],
        "additionalProperties": false
      },
      "package": "SewerAction",
      "doc": "Shipped product choice. Developer exposure is opened by the optional QA cheat; bonus exposes a launcher."
    },
    {
      "name": "SewerLevelDef",
      "schema": {
        "type": "object",
        "properties": {
          "tilemap": {
            "type": "string",
            "x-ref": "asset"
          },
          "finishX": {
            "type": "number"
          },
          "transition": {
            "type": "string"
          },
          "beats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "startX": {
                  "type": "number"
                },
                "checkpointX": {
                  "type": "number"
                },
                "checkpointY": {
                  "type": "number"
                }
              },
              "required": [
                "name",
                "startX",
                "checkpointX",
                "checkpointY"
              ],
              "additionalProperties": false
            }
          },
          "soldiers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "beat": {
                  "type": "integer"
                },
                "x": {
                  "type": "number"
                },
                "y": {
                  "type": "number"
                },
                "patrolMinX": {
                  "type": "number"
                },
                "patrolMaxX": {
                  "type": "number"
                },
                "health": {
                  "type": "integer"
                },
                "cooldown": {
                  "type": "integer"
                },
                "finalPhase": {
                  "type": "integer"
                }
              },
              "required": [
                "beat",
                "x",
                "y",
                "patrolMinX",
                "patrolMaxX",
                "health",
                "cooldown"
              ],
              "additionalProperties": false
            }
          },
          "finalEncounter": {
            "type": "object",
            "properties": {
              "triggerX": {
                "type": "number"
              },
              "minY": {
                "type": "number"
              },
              "maxY": {
                "type": "number"
              },
              "warningSteps": {
                "type": "integer"
              },
              "cameraX": {
                "type": "number"
              },
              "cameraY": {
                "type": "number"
              }
            },
            "required": [
              "triggerX",
              "minY",
              "maxY",
              "warningSteps",
              "cameraX",
              "cameraY"
            ],
            "additionalProperties": false
          },
          "water": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "x": {
                  "type": "number"
                },
                "width": {
                  "type": "number"
                },
                "surfaceY": {
                  "type": "number"
                }
              },
              "required": [
                "x",
                "width",
                "surfaceY"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "tilemap",
          "finishX",
          "transition",
          "beats",
          "soldiers",
          "finalEncounter",
          "water"
        ],
        "additionalProperties": false
      },
      "package": "SewerAction",
      "doc": "Complete sewer route, spawn manifest, checkpoints and issue-25 transition hook."
    }
  ]
} as const;
registerSchema(schemaIr);

export const AudioCueKind = {
  Shot: 0,
  Laser: 1,
  PlayerDeath: 2,
  EnemyDeath: 3,
} as const;
export type AudioCueKindName = 'Shot' | 'Laser' | 'PlayerDeath' | 'EnemyDeath';

export const EnemyProjectileKind = {
  Bullet: 0,
  Bomb: 1,
} as const;
export type EnemyProjectileKindName = 'Bullet' | 'Bomb';

export const ComparisonAction = {
  open: 0,
  close: 1,
  baseline: 2,
  polished: 3,
  shake: 4,
  recoil: 5,
  particles: 6,
  flashes: 7,
  audio: 8,
} as const;
export type ComparisonActionName = 'open' | 'close' | 'baseline' | 'polished' | 'shake' | 'recoil' | 'particles' | 'flashes' | 'audio';

export const ComparisonExposure = {
  hidden: 0,
  developer: 1,
  bonus: 2,
} as const;
export type ComparisonExposureName = 'hidden' | 'developer' | 'bonus';

export const EnemyState = {
  Idle: 0,
  Patrol: 1,
  Chase: 2,
  Attack: 3,
  Stunned: 4,
  Dead: 5,
} as const;
export type EnemyStateName = 'Idle' | 'Patrol' | 'Chase' | 'Attack' | 'Stunned' | 'Dead';

export const EnemyFacing = {
  Left: 0,
  Right: 1,
} as const;
export type EnemyFacingName = 'Left' | 'Right';

export const EnemyAttackKind = {
  None: 0,
  Shoot: 1,
  CrouchShoot: 2,
  Bomb: 3,
} as const;
export type EnemyAttackKindName = 'None' | 'Shoot' | 'CrouchShoot' | 'Bomb';

export const EnemyRestartBrainState = {
  Idle: 0,
  Patrol: 1,
  Chase: 2,
} as const;
export type EnemyRestartBrainStateName = 'Idle' | 'Patrol' | 'Chase';

export const EnemyRestartFacing = {
  Left: 0,
  Right: 1,
} as const;
export type EnemyRestartFacingName = 'Left' | 'Right';

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

export const PresentationFacingDirection = {
  Left: 0,
  Right: 1,
} as const;
export type PresentationFacingDirectionName = 'Left' | 'Right';

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

export const FinalEncounterPhase = {
  Waiting: 0,
  Guard: 1,
  Warning: 2,
  Bombardment: 3,
  ExitOpen: 4,
  Won: 5,
  Failed: 6,
} as const;
export type FinalEncounterPhaseName = 'Waiting' | 'Guard' | 'Warning' | 'Bombardment' | 'ExitOpen' | 'Won' | 'Failed';

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

export const PlayerRestartFacing = {
  Left: 0,
  Right: 1,
} as const;
export type PlayerRestartFacingName = 'Left' | 'Right';

export interface CombatEffectViews {
  kind: Uint32Array;
  position: Float32Array;
  step: Uint32Array;
}
export interface CombatEffectValue {
  kind: string;
  position: [number, number];
  step: number;
}
/** Write-only feedback from accepted projectile releases and impacts; never consumed by gameplay. (event, presentation-only) */
export const CombatEffect = typeToken<CombatEffectViews, CombatEffectValue>('CombatEffect', 'event', { sig: 'kind:string:1,position:vec2:2,step:u32:1', read: (v: CombatEffectViews, i: number, o: Record<string, unknown>) => { o.kind = $r.str(v.kind[i]!); o.position = $r.lanes(v.position, i, 2, o.position); o.step = v.step[i]; return o; } });

export interface CombatVisualViews {
  kind: Uint32Array;
  remaining: Float32Array;
  bursts: Uint32Array;
}
export interface CombatVisualValue {
  kind: string;
  remaining: number[];
  bursts: number;
}
/** Fixed presentation effect slot, hidden after its authored one-shot duration. (component, presentation-only) */
export const CombatVisual = typeToken<CombatVisualViews, CombatVisualValue>('CombatVisual', 'component', { sig: 'kind:string:1,remaining:array:4,bursts:u32:1', read: (v: CombatVisualViews, i: number, o: Record<string, unknown>) => { o.kind = $r.str(v.kind[i]!); o.remaining = $r.lanes(v.remaining, i, 4, o.remaining); o.bursts = v.bursts[i]; return o; } });

export interface CombatVisualStateViews {
  active: Uint8Array;
  lastStep: Uint32Array;
}
export interface CombatVisualStateValue {
  active: boolean;
  lastStep: number;
}
/** Run gate and per-step feedback deduplication. (resource, presentation-only) */
export const CombatVisualState = typeToken<CombatVisualStateViews, CombatVisualStateValue>('CombatVisualState', 'resource', { sig: 'active:bool:1,lastStep:u32:1', read: (v: CombatVisualStateViews, i: number, o: Record<string, unknown>) => { o.active = v.active[i] !== 0; o.lastStep = v.lastStep[i]; return o; } });

export interface SoldierVisualViews {
  actor: Uint32Array;
  clip: Uint32Array;
  previousPosition: Float32Array;
  initialized: Uint8Array;
  flashesApplied: Uint8Array;
  time: Float32Array;
  frame: Uint32Array;
}
export interface SoldierVisualValue {
  actor: EntityId;
  clip: string | null;
  previousPosition: [number, number];
  initialized: boolean;
  flashesApplied: boolean;
  time: number;
  frame: number;
}
/** Presentation proxy; the actor retains the authoritative attack Clip2D clock. (component, presentation-only) */
export const SoldierVisual = typeToken<SoldierVisualViews, SoldierVisualValue>('SoldierVisual', 'component', { sig: 'actor:entity:2,clip:asset:1,previousPosition:vec2:2,initialized:bool:1,flashesApplied:bool:1,time:f32:1,frame:u32:1', read: (v: SoldierVisualViews, i: number, o: Record<string, unknown>) => { o.actor = $r.ent(v.actor, i); o.clip = $r.asset(v.clip[i]!); o.previousPosition = $r.lanes(v.previousPosition, i, 2, o.previousPosition); o.initialized = v.initialized[i] !== 0; o.flashesApplied = v.flashesApplied[i] !== 0; o.time = v.time[i]; o.frame = v.frame[i]; return o; } });

export interface SoldierVisualStateViews {
  active: Uint8Array;
}
export interface SoldierVisualStateValue {
  active: boolean;
}
/** Stops the animation adapter between movement, combat and settling bursts. (resource, presentation-only) */
export const SoldierVisualState = typeToken<SoldierVisualStateViews, SoldierVisualStateValue>('SoldierVisualState', 'resource', { sig: 'active:bool:1', read: (v: SoldierVisualStateViews, i: number, o: Record<string, unknown>) => { o.active = v.active[i] !== 0; return o; } });

export interface AudioCueViews {
  kind: Uint8Array;
  step: Uint32Array;
}
export interface AudioCueValue {
  kind: AudioCueKindName | number;
  step: number;
}
/** Accepted gameplay consequence, write-only from sim to audio. (event, presentation-only) */
export const AudioCue = typeToken<AudioCueViews, AudioCueValue>('AudioCue', 'event', { sig: 'kind:enum:1,step:u32:1', read: (v: AudioCueViews, i: number, o: Record<string, unknown>) => { o.kind = $r.enm('AudioCueKind', v.kind[i]!); o.step = v.step[i]; return o; } });

export interface GameplayAudioStateViews {
  lastSteps: Uint32Array;
  nextSteps: Uint32Array;
}
export interface GameplayAudioStateValue {
  lastSteps: number[];
  nextSteps: number[];
}
/** Fixed-step cue deduplication and absolute cooldown deadlines; never read by gameplay. (resource, presentation-only) */
export const GameplayAudioState = typeToken<GameplayAudioStateViews, GameplayAudioStateValue>('GameplayAudioState', 'resource', { sig: 'lastSteps:array:6,nextSteps:array:6', read: (v: GameplayAudioStateViews, i: number, o: Record<string, unknown>) => { o.lastSteps = $r.lanes(v.lastSteps, i, 6, o.lastSteps); o.nextSteps = $r.lanes(v.nextSteps, i, 6, o.nextSteps); return o; } });

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

export interface ActorSpawnViews {
  /** Authored restart position for this actor. */
  position: Float32Array;
}
export interface ActorSpawnValue {
  /** Authored restart position for this actor. */
  position: [number, number];
}
/** Stable authored state used by deterministic full restart. (component, sim) */
export const ActorSpawn = typeToken<ActorSpawnViews, ActorSpawnValue>('ActorSpawn', 'component', { sig: 'position:vec2:2', read: (v: ActorSpawnViews, i: number, o: Record<string, unknown>) => { o.position = $r.lanes(v.position, i, 2, o.position); return o; } });

export type AliveViews = Record<string, never>;
export type AliveValue = Record<string, never>;
/** Present only while an actor can receive hits and participate in combat. (tag, sim) */
export const Alive = typeToken<AliveViews, AliveValue>('Alive', 'tag');

export interface CadaverViews {
  ageSteps: Uint32Array;
  settleStepsRemaining: Uint32Array;
  velocity: Float32Array;
}
export interface CadaverValue {
  ageSteps: number;
  settleStepsRemaining: number;
  velocity: [number, number];
}
/** Non-combat enemy corpse that settles deterministically and then remains still. (component, sim) */
export const Cadaver = typeToken<CadaverViews, CadaverValue>('Cadaver', 'component', { sig: 'ageSteps:u32:1,settleStepsRemaining:u32:1,velocity:vec2:2', read: (v: CadaverViews, i: number, o: Record<string, unknown>) => { o.ageSteps = v.ageSteps[i]; o.settleStepsRemaining = v.settleStepsRemaining[i]; o.velocity = $r.lanes(v.velocity, i, 2, o.velocity); return o; } });

export type CadaverSettlingViews = Record<string, never>;
export type CadaverSettlingValue = Record<string, never>;
/** Present only during the bounded cadaver settling burst. (tag, sim) */
export const CadaverSettling = typeToken<CadaverSettlingViews, CadaverSettlingValue>('CadaverSettling', 'tag');

export interface DamageRequestedViews {
  source: Uint32Array;
  target: Uint32Array;
  amount: Uint16Array;
  /** Environmental entry damage must not leave an invulnerable player stranded alive in water. */
  bypassInvulnerability: Uint8Array;
  knockback: Float32Array;
}
export interface DamageRequestedValue {
  source: EntityId;
  target: EntityId;
  amount: number;
  /** Environmental entry damage must not leave an invulnerable player stranded alive in water. */
  bypassInvulnerability: boolean;
  knockback: [number, number];
}
/** Combat and hazards request damage; the health system validates and applies it. (event, sim) */
export const DamageRequested = typeToken<DamageRequestedViews, DamageRequestedValue>('DamageRequested', 'event', { sig: 'source:entity:2,target:entity:2,amount:u16:1,bypassInvulnerability:bool:1,knockback:vec2:2', read: (v: DamageRequestedViews, i: number, o: Record<string, unknown>) => { o.source = $r.ent(v.source, i); o.target = $r.ent(v.target, i); o.amount = v.amount[i]; o.bypassInvulnerability = v.bypassInvulnerability[i] !== 0; o.knockback = $r.lanes(v.knockback, i, 2, o.knockback); return o; } });

export interface EnemyAttackPoolStateViews {
  warmed: Uint8Array;
}
export interface EnemyAttackPoolStateValue {
  warmed: boolean;
}
/** One-shot enemy bullet and bomb pool bootstrap state. (resource, sim) */
export const EnemyAttackPoolState = typeToken<EnemyAttackPoolStateViews, EnemyAttackPoolStateValue>('EnemyAttackPoolState', 'resource', { sig: 'warmed:bool:1', read: (v: EnemyAttackPoolStateViews, i: number, o: Record<string, unknown>) => { o.warmed = v.warmed[i] !== 0; return o; } });

export interface EnemyProjectileViews {
  kind: Uint8Array;
  velocityX: Float32Array;
  velocityY: Float32Array;
  gravity: Float32Array;
  distanceRemaining: Float32Array;
  lifetimeStepsRemaining: Uint32Array;
  damage: Uint16Array;
  owner: Uint32Array;
}
export interface EnemyProjectileValue {
  kind: EnemyProjectileKindName | number;
  velocityX: number;
  velocityY: number;
  gravity: number;
  distanceRemaining: number;
  lifetimeStepsRemaining: number;
  damage: number;
  owner: EntityId;
}
/** Pooled fixed-step enemy bullet or ballistic bomb state. (component, sim) */
export const EnemyProjectile = typeToken<EnemyProjectileViews, EnemyProjectileValue>('EnemyProjectile', 'component', { sig: 'kind:enum:1,velocityX:f32:1,velocityY:f32:1,gravity:f32:1,distanceRemaining:f32:1,lifetimeStepsRemaining:u32:1,damage:u16:1,owner:entity:2', read: (v: EnemyProjectileViews, i: number, o: Record<string, unknown>) => { o.kind = $r.enm('EnemyProjectileKind', v.kind[i]!); o.velocityX = v.velocityX[i]; o.velocityY = v.velocityY[i]; o.gravity = v.gravity[i]; o.distanceRemaining = v.distanceRemaining[i]; o.lifetimeStepsRemaining = v.lifetimeStepsRemaining[i]; o.damage = v.damage[i]; o.owner = $r.ent(v.owner, i); return o; } });

export interface HealthViews {
  current: Uint16Array;
  maximum: Uint16Array;
  /** Fixed steps between accepted hits. */
  invulnerabilitySteps: Uint32Array;
  /** First fixed step on which another hit is valid. */
  invulnerableUntilStep: Uint32Array;
}
export interface HealthValue {
  current: number;
  maximum: number;
  /** Fixed steps between accepted hits. */
  invulnerabilitySteps: number;
  /** First fixed step on which another hit is valid. */
  invulnerableUntilStep: number;
}
/** Single source of truth for actor survivability. (component, sim) */
export const Health = typeToken<HealthViews, HealthValue>('Health', 'component', { sig: 'current:u16:1,maximum:u16:1,invulnerabilitySteps:u32:1,invulnerableUntilStep:u32:1', read: (v: HealthViews, i: number, o: Record<string, unknown>) => { o.current = v.current[i]; o.maximum = v.maximum[i]; o.invulnerabilitySteps = v.invulnerabilitySteps[i]; o.invulnerableUntilStep = v.invulnerableUntilStep[i]; return o; } });

export type HitReactingViews = Record<string, never>;
export type HitReactingValue = Record<string, never>;
/** Present only while fixed-step knockback remains active. (tag, sim) */
export const HitReacting = typeToken<HitReactingViews, HitReactingValue>('HitReacting', 'tag');

export interface HitReactionViews {
  steps: Uint32Array;
  stepsRemaining: Uint32Array;
  /** Current deterministic world-space knockback velocity. */
  knockback: Float32Array;
}
export interface HitReactionValue {
  steps: number;
  stepsRemaining: number;
  /** Current deterministic world-space knockback velocity. */
  knockback: [number, number];
}
/** Fixed-step hit stun and knockback owned by gameplay. (component, sim) */
export const HitReaction = typeToken<HitReactionViews, HitReactionValue>('HitReaction', 'component', { sig: 'steps:u32:1,stepsRemaining:u32:1,knockback:vec2:2', read: (v: HitReactionViews, i: number, o: Record<string, unknown>) => { o.steps = v.steps[i]; o.stepsRemaining = v.stepsRemaining[i]; o.knockback = $r.lanes(v.knockback, i, 2, o.knockback); return o; } });

export interface ProjectileViews {
  /** Horizontal travel direction, always -1 or 1 while active. */
  direction: Float32Array;
  speed: Float32Array;
  distanceRemaining: Float32Array;
  damage: Uint16Array;
  owner: Uint32Array;
}
export interface ProjectileValue {
  /** Horizontal travel direction, always -1 or 1 while active. */
  direction: number;
  speed: number;
  distanceRemaining: number;
  damage: number;
  owner: EntityId;
}
/** Pooled fixed-step projectile state. (component, sim) */
export const Projectile = typeToken<ProjectileViews, ProjectileValue>('Projectile', 'component', { sig: 'direction:f32:1,speed:f32:1,distanceRemaining:f32:1,damage:u16:1,owner:entity:2', read: (v: ProjectileViews, i: number, o: Record<string, unknown>) => { o.direction = v.direction[i]; o.speed = v.speed[i]; o.distanceRemaining = v.distanceRemaining[i]; o.damage = v.damage[i]; o.owner = $r.ent(v.owner, i); return o; } });

export interface ProjectilePoolStateViews {
  /** Whether the deterministic projectile pool has been queued. */
  warmed: Uint8Array;
}
export interface ProjectilePoolStateValue {
  /** Whether the deterministic projectile pool has been queued. */
  warmed: boolean;
}
/** One-shot projectile pool bootstrap state. (resource, sim) */
export const ProjectilePoolState = typeToken<ProjectilePoolStateViews, ProjectilePoolStateValue>('ProjectilePoolState', 'resource', { sig: 'warmed:bool:1', read: (v: ProjectilePoolStateViews, i: number, o: Record<string, unknown>) => { o.warmed = v.warmed[i] !== 0; return o; } });

export type RestartRequestedViews = Record<string, never>;
export type RestartRequestedValue = Record<string, never>;
/** Recorded intent to rebuild the current encounter from authored state. (event, sim) */
export const RestartRequested = typeToken<RestartRequestedViews, RestartRequestedValue>('RestartRequested', 'event');

export interface WeaponViews {
  /** Fixed simulation steps between accepted shots. */
  fireIntervalSteps: Uint32Array;
  /** Fixed steps until another shot may be accepted. */
  cooldownStepsRemaining: Uint32Array;
  /** Projectile speed in world units per second. */
  projectileSpeed: Float32Array;
  /** Maximum projectile travel distance in world units. */
  projectileRange: Float32Array;
  /** Horizontal velocity impulse opposite the firing direction. */
  recoilSpeed: Float32Array;
  damage: Uint16Array;
}
export interface WeaponValue {
  /** Fixed simulation steps between accepted shots. */
  fireIntervalSteps: number;
  /** Fixed steps until another shot may be accepted. */
  cooldownStepsRemaining: number;
  /** Projectile speed in world units per second. */
  projectileSpeed: number;
  /** Maximum projectile travel distance in world units. */
  projectileRange: number;
  /** Horizontal velocity impulse opposite the firing direction. */
  recoilSpeed: number;
  damage: number;
}
/** Deterministic weapon cadence and damage configuration. (component, sim) */
export const Weapon = typeToken<WeaponViews, WeaponValue>('Weapon', 'component', { sig: 'fireIntervalSteps:u32:1,cooldownStepsRemaining:u32:1,projectileSpeed:f32:1,projectileRange:f32:1,recoilSpeed:f32:1,damage:u16:1', read: (v: WeaponViews, i: number, o: Record<string, unknown>) => { o.fireIntervalSteps = v.fireIntervalSteps[i]; o.cooldownStepsRemaining = v.cooldownStepsRemaining[i]; o.projectileSpeed = v.projectileSpeed[i]; o.projectileRange = v.projectileRange[i]; o.recoilSpeed = v.recoilSpeed[i]; o.damage = v.damage[i]; return o; } });

export interface ComparisonRequestedViews {
  enabled: Uint8Array;
  action: Uint8Array;
}
export interface ComparisonRequestedValue {
  enabled: boolean;
  action: ComparisonActionName | number;
}
/** View/controller presentation intent; never consumed by simulation. (event, presentation-only) */
export const ComparisonRequested = typeToken<ComparisonRequestedViews, ComparisonRequestedValue>('ComparisonRequested', 'event', { sig: 'enabled:bool:1,action:enum:1', read: (v: ComparisonRequestedViews, i: number, o: Record<string, unknown>) => { o.enabled = v.enabled[i] !== 0; o.action = $r.enm('ComparisonAction', v.action[i]!); return o; } });

export interface EnemyFlashStateViews {
  enabled: Uint8Array;
}
export interface EnemyFlashStateValue {
  enabled: boolean;
}
/** Last applied flash choice; global tint refresh only when this choice changes. (resource, presentation-only) */
export const EnemyFlashState = typeToken<EnemyFlashStateViews, EnemyFlashStateValue>('EnemyFlashState', 'resource', { sig: 'enabled:bool:1', read: (v: EnemyFlashStateViews, i: number, o: Record<string, unknown>) => { o.enabled = v.enabled[i] !== 0; return o; } });

export interface GameFeelComparisonViews {
  config: Uint32Array;
  initialized: Uint8Array;
  exposure: Uint8Array;
  open: Uint8Array;
  shake: Uint8Array;
  recoil: Uint8Array;
  particles: Uint8Array;
  flashes: Uint8Array;
  audio: Uint8Array;
}
export interface GameFeelComparisonValue {
  config: string | null;
  initialized: boolean;
  exposure: ComparisonExposureName | number;
  open: boolean;
  shake: boolean;
  recoil: boolean;
  particles: boolean;
  flashes: boolean;
  audio: boolean;
}
/** Presentation choices only. No gameplay system reads this resource. (resource, presentation-only) */
export const GameFeelComparison = typeToken<GameFeelComparisonViews, GameFeelComparisonValue>('GameFeelComparison', 'resource', { sig: 'config:asset:1,initialized:bool:1,exposure:enum:1,open:bool:1,shake:bool:1,recoil:bool:1,particles:bool:1,flashes:bool:1,audio:bool:1', read: (v: GameFeelComparisonViews, i: number, o: Record<string, unknown>) => { o.config = $r.asset(v.config[i]!); o.initialized = v.initialized[i] !== 0; o.exposure = $r.enm('ComparisonExposure', v.exposure[i]!); o.open = v.open[i] !== 0; o.shake = v.shake[i] !== 0; o.recoil = v.recoil[i] !== 0; o.particles = v.particles[i] !== 0; o.flashes = v.flashes[i] !== 0; o.audio = v.audio[i] !== 0; return o; } });

export interface ShotFeedbackStateViews {
  lastStep: Uint32Array;
}
export interface ShotFeedbackStateValue {
  lastStep: number;
}
/** Accepted shot deduplication, including cues suppressed by comparison choices. (resource, presentation-only) */
export const ShotFeedbackState = typeToken<ShotFeedbackStateViews, ShotFeedbackStateValue>('ShotFeedbackState', 'resource', { sig: 'lastStep:u32:1', read: (v: ShotFeedbackStateViews, i: number, o: Record<string, unknown>) => { o.lastStep = v.lastStep[i]; return o; } });

export interface EnemyBrainViews {
  state: Uint8Array;
  facing: Uint8Array;
  /** Inclusive left edge of the authored patrol route. */
  patrolMinX: Float32Array;
  /** Inclusive right edge of the authored patrol route. */
  patrolMaxX: Float32Array;
  patrolSpeed: Float32Array;
  chaseSpeed: Float32Array;
  detectionRangeX: Float32Array;
  detectionRangeY: Float32Array;
  stopDistance: Float32Array;
  collisionHalfWidth: Float32Array;
  edgeProbeDistance: Float32Array;
  turnPauseSteps: Uint32Array;
  turnPauseStepsRemaining: Uint32Array;
  targetMemorySteps: Uint32Array;
  targetMemoryStepsRemaining: Uint32Array;
  targetDetected: Uint8Array;
  lastKnownTargetX: Float32Array;
  attackKind: Uint8Array;
  /** Round-robin attack selection; deterministic and replayed. */
  attackSequence: Uint32Array;
  attackRange: Float32Array;
  attackCooldownSteps: Uint32Array;
  attackCooldownStepsRemaining: Uint32Array;
  /** True from attack start until its clip event releases the projectile. */
  attackTelegraphed: Uint8Array;
}
export interface EnemyBrainValue {
  state: EnemyStateName | number;
  facing: EnemyFacingName | number;
  /** Inclusive left edge of the authored patrol route. */
  patrolMinX: number;
  /** Inclusive right edge of the authored patrol route. */
  patrolMaxX: number;
  patrolSpeed: number;
  chaseSpeed: number;
  detectionRangeX: number;
  detectionRangeY: number;
  stopDistance: number;
  collisionHalfWidth: number;
  edgeProbeDistance: number;
  turnPauseSteps: number;
  turnPauseStepsRemaining: number;
  targetMemorySteps: number;
  targetMemoryStepsRemaining: number;
  targetDetected: boolean;
  lastKnownTargetX: number;
  attackKind: EnemyAttackKindName | number;
  /** Round-robin attack selection; deterministic and replayed. */
  attackSequence: number;
  attackRange: number;
  attackCooldownSteps: number;
  attackCooldownStepsRemaining: number;
  /** True from attack start until its clip event releases the projectile. */
  attackTelegraphed: boolean;
}
/** Deterministic soldier configuration, decisions, chase memory and ranged attack cadence. (component, sim) */
export const EnemyBrain = typeToken<EnemyBrainViews, EnemyBrainValue>('EnemyBrain', 'component', { sig: 'state:enum:1,facing:enum:1,patrolMinX:f32:1,patrolMaxX:f32:1,patrolSpeed:f32:1,chaseSpeed:f32:1,detectionRangeX:f32:1,detectionRangeY:f32:1,stopDistance:f32:1,collisionHalfWidth:f32:1,edgeProbeDistance:f32:1,turnPauseSteps:u32:1,turnPauseStepsRemaining:u32:1,targetMemorySteps:u32:1,targetMemoryStepsRemaining:u32:1,targetDetected:bool:1,lastKnownTargetX:f32:1,attackKind:enum:1,attackSequence:u32:1,attackRange:f32:1,attackCooldownSteps:u32:1,attackCooldownStepsRemaining:u32:1,attackTelegraphed:bool:1', read: (v: EnemyBrainViews, i: number, o: Record<string, unknown>) => { o.state = $r.enm('EnemyState', v.state[i]!); o.facing = $r.enm('EnemyFacing', v.facing[i]!); o.patrolMinX = v.patrolMinX[i]; o.patrolMaxX = v.patrolMaxX[i]; o.patrolSpeed = v.patrolSpeed[i]; o.chaseSpeed = v.chaseSpeed[i]; o.detectionRangeX = v.detectionRangeX[i]; o.detectionRangeY = v.detectionRangeY[i]; o.stopDistance = v.stopDistance[i]; o.collisionHalfWidth = v.collisionHalfWidth[i]; o.edgeProbeDistance = v.edgeProbeDistance[i]; o.turnPauseSteps = v.turnPauseSteps[i]; o.turnPauseStepsRemaining = v.turnPauseStepsRemaining[i]; o.targetMemorySteps = v.targetMemorySteps[i]; o.targetMemoryStepsRemaining = v.targetMemoryStepsRemaining[i]; o.targetDetected = v.targetDetected[i] !== 0; o.lastKnownTargetX = v.lastKnownTargetX[i]; o.attackKind = $r.enm('EnemyAttackKind', v.attackKind[i]!); o.attackSequence = v.attackSequence[i]; o.attackRange = v.attackRange[i]; o.attackCooldownSteps = v.attackCooldownSteps[i]; o.attackCooldownStepsRemaining = v.attackCooldownStepsRemaining[i]; o.attackTelegraphed = v.attackTelegraphed[i] !== 0; return o; } });

export interface EnemyRestartStateViews {
  state: Uint8Array;
  facing: Uint8Array;
  attackSequence: Uint32Array;
}
export interface EnemyRestartStateValue {
  state: EnemyRestartBrainStateName | number;
  facing: EnemyRestartFacingName | number;
  attackSequence: number;
}
/** Authored enemy state restored by a deterministic encounter restart. (component, sim) */
export const EnemyRestartState = typeToken<EnemyRestartStateViews, EnemyRestartStateValue>('EnemyRestartState', 'component', { sig: 'state:enum:1,facing:enum:1,attackSequence:u32:1', read: (v: EnemyRestartStateViews, i: number, o: Record<string, unknown>) => { o.state = $r.enm('EnemyRestartBrainState', v.state[i]!); o.facing = $r.enm('EnemyRestartFacing', v.facing[i]!); o.attackSequence = v.attackSequence[i]; return o; } });

export interface CameraFeedbackViews {
  /** Whether transient feedback still needs presentation frames. */
  active: Uint8Array;
  /** Short presentation-only camera impulse requested by a feedback adapter. */
  bump: Float32Array;
  /** Presentation-only shake strength; never visible to gameplay. */
  shake: Float32Array;
  /** Remaining presentation seconds for the current shake. */
  shakeTime: Float32Array;
}
export interface CameraFeedbackValue {
  /** Whether transient feedback still needs presentation frames. */
  active: boolean;
  /** Short presentation-only camera impulse requested by a feedback adapter. */
  bump: [number, number];
  /** Presentation-only shake strength; never visible to gameplay. */
  shake: number;
  /** Remaining presentation seconds for the current shake. */
  shakeTime: number;
}
/** Transient camera feedback hooks consumed only by LateUpdate. (resource, presentation-only) */
export const CameraFeedback = typeToken<CameraFeedbackViews, CameraFeedbackValue>('CameraFeedback', 'resource', { sig: 'active:bool:1,bump:vec2:2,shake:f32:1,shakeTime:f32:1', read: (v: CameraFeedbackViews, i: number, o: Record<string, unknown>) => { o.active = v.active[i] !== 0; o.bump = $r.lanes(v.bump, i, 2, o.bump); o.shake = v.shake[i]; o.shakeTime = v.shakeTime[i]; return o; } });

export interface CameraFollowStateViews {
  /** Settled presentation camera center applied as a visual offset. */
  center: Float32Array;
  /** Bounded target after dead-zone and directional look-ahead. */
  target: Float32Array;
  /** Current horizontal look-ahead in world units. */
  lookAhead: Float32Array;
  /** True once the follow rig can stop rewriting camera state. */
  settled: Uint8Array;
}
export interface CameraFollowStateValue {
  /** Settled presentation camera center applied as a visual offset. */
  center: [number, number];
  /** Bounded target after dead-zone and directional look-ahead. */
  target: [number, number];
  /** Current horizontal look-ahead in world units. */
  lookAhead: number;
  /** True once the follow rig can stop rewriting camera state. */
  settled: boolean;
}
/** Presentation-owned camera state excluded from gameplay hashes and queries. (resource, presentation-only) */
export const CameraFollowState = typeToken<CameraFollowStateViews, CameraFollowStateValue>('CameraFollowState', 'resource', { sig: 'center:vec2:2,target:vec2:2,lookAhead:f32:1,settled:bool:1', read: (v: CameraFollowStateViews, i: number, o: Record<string, unknown>) => { o.center = $r.lanes(v.center, i, 2, o.center); o.target = $r.lanes(v.target, i, 2, o.target); o.lookAhead = v.lookAhead[i]; o.settled = v.settled[i] !== 0; return o; } });

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
  /** Latest authoritative player position copied for presentation systems. */
  playerPosition: Float32Array;
  /** Latest authoritative player velocity copied for presentation systems. */
  playerVelocity: Float32Array;
  /** Authoritative facing direction copied for presentation look-ahead and feedback. */
  playerFacing: Uint8Array;
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
  /** Latest authoritative player position copied for presentation systems. */
  playerPosition: [number, number];
  /** Latest authoritative player velocity copied for presentation systems. */
  playerVelocity: [number, number];
  /** Authoritative facing direction copied for presentation look-ahead and feedback. */
  playerFacing: PresentationFacingDirectionName | number;
}
/** Read-only presentation snapshot derived from consequential simulation state. (resource, presentation-only) */
export const GameplayPresentation = typeToken<GameplayPresentationViews, GameplayPresentationValue>('GameplayPresentation', 'resource', { sig: 'phase:enum:1,moveX:enum:1,dashing:bool:1,dashDirection:enum:1,dashReady:bool:1,playerPosition:vec2:2,playerVelocity:vec2:2,playerFacing:enum:1', read: (v: GameplayPresentationViews, i: number, o: Record<string, unknown>) => { o.phase = $r.enm('GamePhase', v.phase[i]!); o.moveX = $r.enm('MoveDirection', v.moveX[i]!); o.dashing = v.dashing[i] !== 0; o.dashDirection = $r.enm('PresentationDashDirection', v.dashDirection[i]!); o.dashReady = v.dashReady[i] !== 0; o.playerPosition = $r.lanes(v.playerPosition, i, 2, o.playerPosition); o.playerVelocity = $r.lanes(v.playerVelocity, i, 2, o.playerVelocity); o.playerFacing = $r.enm('PresentationFacingDirection', v.playerFacing[i]!); return o; } });

export interface ParallaxLayerViews {
  /** Fraction of camera motion retained by this presentation layer. */
  factor: Float32Array;
}
export interface ParallaxLayerValue {
  /** Fraction of camera motion retained by this presentation layer. */
  factor: [number, number];
}
/** Authored presentation-only parallax configuration. (component, presentation-only) */
export const ParallaxLayer = typeToken<ParallaxLayerViews, ParallaxLayerValue>('ParallaxLayer', 'component', { sig: 'factor:vec2:2', read: (v: ParallaxLayerViews, i: number, o: Record<string, unknown>) => { o.factor = $r.lanes(v.factor, i, 2, o.factor); return o; } });

export interface RoomCameraBoundsViews {
  /** Authored left edge of the room camera envelope. */
  left: Float32Array;
  /** Authored right edge of the room camera envelope. */
  right: Float32Array;
  /** Authored bottom edge of the room camera envelope. */
  bottom: Float32Array;
  /** Authored top edge of the room camera envelope. */
  top: Float32Array;
}
export interface RoomCameraBoundsValue {
  /** Authored left edge of the room camera envelope. */
  left: number;
  /** Authored right edge of the room camera envelope. */
  right: number;
  /** Authored bottom edge of the room camera envelope. */
  bottom: number;
  /** Authored top edge of the room camera envelope. */
  top: number;
}
/** Scene-authored presentation bounds for the active room camera. (resource, presentation-only) */
export const RoomCameraBounds = typeToken<RoomCameraBoundsViews, RoomCameraBoundsValue>('RoomCameraBounds', 'resource', { sig: 'left:f32:1,right:f32:1,bottom:f32:1,top:f32:1', read: (v: RoomCameraBoundsViews, i: number, o: Record<string, unknown>) => { o.left = v.left[i]; o.right = v.right[i]; o.bottom = v.bottom[i]; o.top = v.top[i]; return o; } });

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

export interface WaterContactViews {
  inside: Uint8Array;
  splashCooldownSteps: Uint32Array;
  nextSplashStep: Uint32Array;
}
export interface WaterContactValue {
  inside: boolean;
  splashCooldownSteps: number;
  nextSplashStep: number;
}
/** Player contact with the union of water volumes. Entry damage is independent of splash cooldown. (component, sim) */
export const WaterContact = typeToken<WaterContactViews, WaterContactValue>('WaterContact', 'component', { sig: 'inside:bool:1,splashCooldownSteps:u32:1,nextSplashStep:u32:1', read: (v: WaterContactViews, i: number, o: Record<string, unknown>) => { o.inside = v.inside[i] !== 0; o.splashCooldownSteps = v.splashCooldownSteps[i]; o.nextSplashStep = v.nextSplashStep[i]; return o; } });

export interface WaterEnteredViews {
  player: Uint32Array;
  position: Float32Array;
  entryStep: Uint32Array;
}
export interface WaterEnteredValue {
  player: EntityId;
  position: [number, number];
  entryStep: number;
}
/** Accepted water entry fact; presentation observes this without affecting the hazard outcome. (event, sim) */
export const WaterEntered = typeToken<WaterEnteredViews, WaterEnteredValue>('WaterEntered', 'event', { sig: 'player:entity:2,position:vec2:2,entryStep:u32:1', read: (v: WaterEnteredViews, i: number, o: Record<string, unknown>) => { o.player = $r.ent(v.player, i); o.position = $r.lanes(v.position, i, 2, o.position); o.entryStep = v.entryStep[i]; return o; } });

export interface WaterSplashViews {
  secondsRemaining: Float32Array;
  lastEntryStep: Uint32Array;
}
export interface WaterSplashValue {
  secondsRemaining: number;
  lastEntryStep: number;
}
/** One preallocated splash slot for the single-player slice, hidden when its one-shot clip ends. (component, presentation-only) */
export const WaterSplash = typeToken<WaterSplashViews, WaterSplashValue>('WaterSplash', 'component', { sig: 'secondsRemaining:f32:1,lastEntryStep:u32:1', read: (v: WaterSplashViews, i: number, o: Record<string, unknown>) => { o.secondsRemaining = v.secondsRemaining[i]; o.lastEntryStep = v.lastEntryStep[i]; return o; } });

export interface WaterSplashStateViews {
  active: Uint8Array;
}
export interface WaterSplashStateValue {
  active: boolean;
}
/** Run gate for bounded splash presentation; stops all adapter work once hidden. (resource, presentation-only) */
export const WaterSplashState = typeToken<WaterSplashStateViews, WaterSplashStateValue>('WaterSplashState', 'resource', { sig: 'active:bool:1', read: (v: WaterSplashStateViews, i: number, o: Record<string, unknown>) => { o.active = v.active[i] !== 0; return o; } });

export interface EncounterMemberViews {
  beat: Uint32Array;
  activated: Uint8Array;
}
export interface EncounterMemberValue {
  beat: number;
  activated: boolean;
}
/** Authored encounter membership; bounded actors allocated once during boot. (component, sim) */
export const EncounterMember = typeToken<EncounterMemberViews, EncounterMemberValue>('EncounterMember', 'component', { sig: 'beat:u32:1,activated:bool:1', read: (v: EncounterMemberViews, i: number, o: Record<string, unknown>) => { o.beat = v.beat[i]; o.activated = v.activated[i] !== 0; return o; } });

export interface FinalCueViews {
  phase: Uint32Array;
}
export interface FinalCueValue {
  phase: number;
}
/** Static in-world phase lamp; phase 2 is the existing outlet arrow. (component, presentation-only) */
export const FinalCue = typeToken<FinalCueViews, FinalCueValue>('FinalCue', 'component', { sig: 'phase:u32:1', read: (v: FinalCueViews, i: number, o: Record<string, unknown>) => { o.phase = v.phase[i]; return o; } });

export interface FinalEncounterViews {
  phase: Uint8Array;
  deadlineStep: Uint32Array;
}
export interface FinalEncounterValue {
  phase: FinalEncounterPhaseName | number;
  deadlineStep: number;
}
/** Final fight owner. Warning uses an absolute fixed-step deadline; terminal phases are latched. (component, sim) */
export const FinalEncounter = typeToken<FinalEncounterViews, FinalEncounterValue>('FinalEncounter', 'component', { sig: 'phase:enum:1,deadlineStep:u32:1', read: (v: FinalEncounterViews, i: number, o: Record<string, unknown>) => { o.phase = $r.enm('FinalEncounterPhase', v.phase[i]!); o.deadlineStep = v.deadlineStep[i]; return o; } });

export interface FinalSoldierViews {
  phase: Uint32Array;
  active: Uint8Array;
}
export interface FinalSoldierValue {
  phase: number;
  active: boolean;
}
/** One preallocated actor per final combat phase; inactive actors cannot take damage. (component, sim) */
export const FinalSoldier = typeToken<FinalSoldierViews, FinalSoldierValue>('FinalSoldier', 'component', { sig: 'phase:u32:1,active:bool:1', read: (v: FinalSoldierViews, i: number, o: Record<string, unknown>) => { o.phase = v.phase[i]; o.active = v.active[i] !== 0; return o; } });

export type FinalWarningViews = Record<string, never>;
export type FinalWarningValue = Record<string, never>;
/** Present only while the final warning deadline needs fixed-step work. (tag, sim) */
export const FinalWarning = typeToken<FinalWarningViews, FinalWarningValue>('FinalWarning', 'tag');

export interface LevelCollisionIndexViews {
  words: Uint32Array;
}
export interface LevelCollisionIndexValue {
  words: number[];
}
/** Four packed 32-bit words per row; at most 128 columns by 32 rows. (component, sim) */
export const LevelCollisionIndex = typeToken<LevelCollisionIndexViews, LevelCollisionIndexValue>('LevelCollisionIndex', 'component', { sig: 'words:array:128', read: (v: LevelCollisionIndexViews, i: number, o: Record<string, unknown>) => { o.words = $r.lanes(v.words, i, 128, o.words); return o; } });

export interface LevelProgressViews {
  data: Uint32Array;
  built: Uint8Array;
  beat: Uint32Array;
  checkpoint: Uint32Array;
  cleared: Uint32Array;
  finished: Uint8Array;
  activationPending: Uint8Array;
}
export interface LevelProgressValue {
  data: string | null;
  built: boolean;
  beat: number;
  checkpoint: number;
  cleared: number;
  finished: boolean;
  activationPending: boolean;
}
/** Level anchor owns ordered progress and checkpoint state. Route gates and checkpoint state; finished means the final outlet was accepted. (component, sim) */
export const LevelProgress = typeToken<LevelProgressViews, LevelProgressValue>('LevelProgress', 'component', { sig: 'data:asset:1,built:bool:1,beat:u32:1,checkpoint:u32:1,cleared:u32:1,finished:bool:1,activationPending:bool:1', read: (v: LevelProgressViews, i: number, o: Record<string, unknown>) => { o.data = $r.asset(v.data[i]!); o.built = v.built[i] !== 0; o.beat = v.beat[i]; o.checkpoint = v.checkpoint[i]; o.cleared = v.cleared[i]; o.finished = v.finished[i] !== 0; o.activationPending = v.activationPending[i] !== 0; return o; } });

export interface TerrainVisualViews {
  row: Uint32Array;
  columns: Uint32Array;
}
export interface TerrainVisualValue {
  row: number;
  columns: number;
}
/** Merged visible sewer ledges derived from the collision tilemap during boot. (component, presentation-only) */
export const TerrainVisual = typeToken<TerrainVisualViews, TerrainVisualValue>('TerrainVisual', 'component', { sig: 'row:u32:1,columns:u32:1', read: (v: TerrainVisualViews, i: number, o: Record<string, unknown>) => { o.row = v.row[i]; o.columns = v.columns[i]; return o; } });

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
  /** Active columns in the packed static occupancy rows. */
  columns: Uint32Array;
  /** Active rows in the packed static occupancy rows. */
  rows: Uint32Array;
  /** Immutable packed index derived exclusively by BuildRoomCollision from the same static cells it spawns. */
  solidRows: Uint32Array;
}
export interface PlatformCollisionGridValue {
  /** World x coordinate of cell (0, 0) lower-left corner. */
  originX: number;
  /** World y coordinate of cell (0, 0) lower-left corner. */
  originY: number;
  /** Square cell size in world units. */
  cellSize: number;
  /** Active columns in the packed static occupancy rows. */
  columns: number;
  /** Active rows in the packed static occupancy rows. */
  rows: number;
  /** Immutable packed index derived exclusively by BuildRoomCollision from the same static cells it spawns. */
  solidRows: number[];
}
/** World mapping and builder-owned immutable lookup index for deterministic platform collision cells. (resource, sim) */
export const PlatformCollisionGrid = typeToken<PlatformCollisionGridViews, PlatformCollisionGridValue>('PlatformCollisionGrid', 'resource', { sig: 'originX:f32:1,originY:f32:1,cellSize:f32:1,columns:u32:1,rows:u32:1,solidRows:array:32', read: (v: PlatformCollisionGridViews, i: number, o: Record<string, unknown>) => { o.originX = v.originX[i]; o.originY = v.originY[i]; o.cellSize = v.cellSize[i]; o.columns = v.columns[i]; o.rows = v.rows[i]; o.solidRows = $r.lanes(v.solidRows, i, 32, o.solidRows); return o; } });

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

export interface PlayerRestartStateViews {
  facing: Uint8Array;
  grounded: Uint8Array;
  airJumps: Uint32Array;
}
export interface PlayerRestartStateValue {
  facing: PlayerRestartFacingName | number;
  grounded: boolean;
  airJumps: number;
}
/** Authored player state restored by a deterministic encounter restart. (component, sim) */
export const PlayerRestartState = typeToken<PlayerRestartStateViews, PlayerRestartStateValue>('PlayerRestartState', 'component', { sig: 'facing:enum:1,grounded:bool:1,airJumps:u32:1', read: (v: PlayerRestartStateViews, i: number, o: Record<string, unknown>) => { o.facing = $r.enm('PlayerRestartFacing', v.facing[i]!); o.grounded = v.grounded[i] !== 0; o.airJumps = v.airJumps[i]; return o; } });

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

/** Shipped product choice. Developer exposure is opened by the optional QA cheat; bonus exposes a launcher. */
export type ComparisonDefData = {
  exposure: "hidden" | "developer" | "bonus";
  shake: boolean;
  recoil: boolean;
  particles: boolean;
  flashes: boolean;
  audio: boolean;
};
/** A loaded ComparisonDef as `loadData` returns it (frozen). */
export type ReadonlyComparisonDefData = DataRecord<ComparisonDefData>;
export const ComparisonDef = dataToken<ComparisonDefData>('ComparisonDef');

/** Complete sewer route, spawn manifest, checkpoints and issue-25 transition hook. */
export type SewerLevelDefData = {
  tilemap: string;
  finishX: number;
  transition: string;
  beats: {
    name: string;
    startX: number;
    checkpointX: number;
    checkpointY: number;
  }[];
  soldiers: {
    beat: number;
    x: number;
    y: number;
    patrolMinX: number;
    patrolMaxX: number;
    health: number;
    cooldown: number;
    finalPhase?: number;
  }[];
  finalEncounter: {
    triggerX: number;
    minY: number;
    maxY: number;
    warningSteps: number;
    cameraX: number;
    cameraY: number;
  };
  water: {
    x: number;
    width: number;
    surfaceY: number;
  }[];
};
/** A loaded SewerLevelDef as `loadData` returns it (frozen). */
export type ReadonlySewerLevelDefData = DataRecord<SewerLevelDefData>;
export const SewerLevelDef = dataToken<SewerLevelDefData>('SewerLevelDef');
