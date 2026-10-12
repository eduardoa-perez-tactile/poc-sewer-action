import { defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, Player, PlayerControl, PlayerDashState, PlayerGroundContact, PlayerMotion, PlayerStepInput } from '../schema.gen.ts';

export const MovePlayerVertically = defineSystem({
  name: 'MovePlayerVertically',
  after: ['CapturePlayerIntent'],
  query: query(read(Player), read(PlayerControl), read(PlayerDashState), read(PlayerGroundContact), write(PlayerMotion)),
  resources: [read(GameState), read(PlayerStepInput)],
  runIf: { resource: GameState, field: 'phase', value: 'Playing' },
  run(ctx, players) {
    const jumpRequested = ctx.resource(PlayerStepInput).jumpRequested[0] !== 0;
    for (const chunk of players.chunks()) {
      const config = chunk.col(Player);
      const control = chunk.col(PlayerControl);
      const dash = chunk.col(PlayerDashState);
      const contact = chunk.col(PlayerGroundContact);
      const motion = chunk.col(PlayerMotion);

      for (let row = 0; row < chunk.length; row++) {
        const hasGroundContact = contact.grounded[row] !== 0;
        let grounded = motion.groundedForMovement[row] !== 0;
        let ignoreGroundContact = motion.ignoreGroundContact[row] !== 0;
        let coyote = motion.coyoteStepsRemaining[row]!;
        let buffered = motion.jumpBufferStepsRemaining[row]!;
        let airJumps = motion.airJumpsRemaining[row]!;
        let velocity = motion.verticalVelocity[row]!;

        if (ignoreGroundContact) {
          if (!hasGroundContact) ignoreGroundContact = false;
          grounded = false;
        } else {
          grounded = hasGroundContact;
        }

        if (grounded) {
          coyote = config.coyoteSteps[row]!;
          airJumps = config.airJumps[row]!;
          if (velocity < 0) velocity = 0;
        }

        if (dash.active[row] !== 0) {
          if (!grounded) {
            velocity = velocity < 0 ? velocity * 0.12 : 0;
            velocity -= config.gravity[row]! * config.dashGravityMultiplier[row]! * ctx.dt;
          } else {
            velocity = 0;
          }
          motion.verticalVelocity[row] = velocity;
          motion.groundedForMovement[row] = grounded ? 1 : 0;
          motion.coyoteStepsRemaining[row] = coyote;
          motion.airJumpsRemaining[row] = airJumps;
          motion.jumpWasHeld[row] = control.jumpHeld[row]!;
          motion.ignoreGroundContact[row] = ignoreGroundContact ? 1 : 0;
          continue;
        }

        if (jumpRequested && dash.controlLockStepsRemaining[row]! === 0) buffered = config.jumpBufferSteps[row]! + 1;

        if (buffered > 0 && dash.controlLockStepsRemaining[row]! === 0) {
          if (grounded || coyote > 0) {
            velocity = config.jumpSpeed[row]!;
            buffered = 0;
            coyote = 0;
            grounded = false;
            ignoreGroundContact = true;
          } else if (airJumps > 0) {
            velocity = config.jumpSpeed[row]!;
            buffered = 0;
            airJumps -= 1;
          }
        }

        const jumpHeld = control.jumpHeld[row] !== 0;
        if (motion.jumpWasHeld[row] !== 0 && !jumpHeld && velocity > 0) {
          velocity *= config.jumpCutMultiplier[row]!;
        }

        const airborne = !grounded;
        if (airborne) {
          velocity -= config.gravity[row]! * ctx.dt;
          const maxFallSpeed = config.maxFallSpeed[row]!;
          if (velocity < -maxFallSpeed) velocity = -maxFallSpeed;
        } else {
          velocity = 0;
        }

        if (coyote > 0 && airborne) coyote -= 1;
        if (buffered > 0) buffered -= 1;

        motion.verticalVelocity[row] = velocity;
        motion.groundedForMovement[row] = grounded ? 1 : 0;
        motion.coyoteStepsRemaining[row] = coyote;
        motion.jumpBufferStepsRemaining[row] = buffered;
        motion.airJumpsRemaining[row] = airJumps;
        motion.jumpWasHeld[row] = jumpHeld ? 1 : 0;
        motion.ignoreGroundContact[row] = ignoreGroundContact ? 1 : 0;
      }
    }
  },
});
