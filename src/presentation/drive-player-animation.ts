import { clip2DInfo, defineSystem, query, read, Sprite, SpriteAnimation, write } from '@gameengine/runtime';
import { GameState, Health, HitReaction, Player, PlayerAnimationPresentation, PlayerControl, PlayerGroundContact, PlayerMotion } from '../schema.gen.ts';

/**
 * Mirrors authoritative movement facts into presentation-only flipbook playback. The authored
 * clip assets own frames, timing, looping and informational events; this adapter owns only state
 * selection. Later combat systems must own shoot/hurt triggers rather than reading frames.
 */
export const DrivePlayerAnimation = defineSystem({
  name: 'DrivePlayerAnimation',
  stage: 'LateUpdate',
  query: query(
    read(Player),
    read(PlayerControl),
    read(PlayerGroundContact),
    read(PlayerMotion),
    read(Health),
    read(HitReaction),
    write(PlayerAnimationPresentation),
    write(SpriteAnimation),
    write(Sprite),
  ),
  resources: [read(GameState)],
  runIf: { any: [{ changed: PlayerControl }, { changed: PlayerGroundContact }, { changed: PlayerMotion }, { changed: Health }, { changed: HitReaction }, { changed: GameState }] },
  run(ctx, players) {
    for (const chunk of players.chunks()) {
      const control = chunk.col(PlayerControl);
      const contact = chunk.col(PlayerGroundContact);
      const motion = chunk.col(PlayerMotion);
      const health = chunk.col(Health);
      const reaction = chunk.col(HitReaction);
      const sprite = chunk.col(Sprite);

      for (let row = 0; row < chunk.length; row++) {
        const grounded = contact.grounded[row] !== 0 && motion.ignoreGroundContact[row] === 0;
        const moving = Math.abs(motion.horizontalVelocity[row]!) > 0.1;
        let clip = 'art/player/idle.clip2d.json';

        const completed = ctx.is(GameState, 'phase', 'Completed');
        if (completed) {
          clip = 'art/player/idle.clip2d.json';
        } else if (health.current[row] === 0 || reaction.stepsRemaining[row]! > 0) {
          clip = 'art/player/hurt.clip2d.json';
        } else if (!grounded) {
          if (motion.verticalVelocity[row]! > 0.05) {
            clip = 'art/player/jump.clip2d.json';
          } else {
            clip = 'art/player/fall.clip2d.json';
          }
        } else if (control.crouch[row] !== 0) {
          clip = 'art/player/crouch.clip2d.json';
        } else if (moving) {
          clip = 'art/player/run.clip2d.json';
        }

        if (!chunk.is(PlayerAnimationPresentation, row, 'clip', clip)) {
          const info = clip2DInfo(clip);
          const frameDuration = info.frames[0]?.duration ?? 1;
          chunk.setField(PlayerAnimationPresentation, row, 'clip', clip);
          chunk.set(SpriteAnimation, row, {
            frames: info.frames.map((frame) => frame.sprite).join(','),
            fps: 1 / frameDuration,
            loop: info.loop !== 'once',
            playing: true,
            time: 0,
            frame: 0,
            events: info.events.map((event) => `${event.frame}:${event.name}`).join(','),
          });
        }
        if (completed) chunk.setField(SpriteAnimation, row, 'loop', false);
        sprite.flipX[row] = chunk.is(PlayerMotion, row, 'facing', 'Left') ? 1 : 0;
      }
    }
  },
});
