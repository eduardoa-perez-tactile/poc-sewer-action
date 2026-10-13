import { clip2DInfo, defineSystem, query, read, Sprite, SpriteAnimation, RenderTime, VisualOffset, write } from '@gameengine/runtime';
import { GameState, Health, HitReaction, Player, PlayerAnimationPresentation, PlayerControl, PlayerGroundContact, PlayerMotion, PlayerDashState, PlayerFeelState, AudioCue, RestartRequested, CameraFeedback, GameFeelComparison } from '../schema.gen.ts';

import { bumpCamera, shakeCamera } from './drive-camera-feedback.ts';

/**
 * Mirrors authoritative movement facts into presentation-only flipbook playback. The authored
 * clip assets own frames, timing, looping and informational events; this adapter owns only state
 * selection and finite visual envelopes. Accepted shot/health facts trigger feedback; frames
 * never decide combat timing or movement.
 */
export const DrivePlayerAnimation = defineSystem({
  name: 'DrivePlayerAnimation',
  stage: 'LateUpdate',
  before: ['DriveCameraFeedback'],
  queries: { players: query(
    read(Player),
    read(PlayerControl),
    read(PlayerGroundContact),
    read(PlayerMotion),
    read(PlayerDashState),
    read(Health),
    read(HitReaction),
    write(PlayerAnimationPresentation),
    write(SpriteAnimation),
    write(Sprite),
  ), visuals: query(read(Player), write(VisualOffset)) },
  resources: [read(GameState), read(RenderTime), write(PlayerFeelState), write(CameraFeedback), read(GameFeelComparison)],
  events: [AudioCue, RestartRequested],
  runIf: { any: [{ changed: PlayerControl }, { changed: PlayerGroundContact }, { changed: PlayerMotion }, { changed: Health }, { changed: HitReaction }, { changed: GameState }, { changed: PlayerDashState }, { event: AudioCue }, { event: RestartRequested }, { resource: PlayerFeelState, field: 'active', value: true }] },
  run(ctx, { players, visuals }) {
    const feel = ctx.resource(PlayerFeelState);
    const dt = Math.max(0, ctx.resource(RenderTime).realDelta[0]!);
    const paused = ctx.is(GameState, 'phase', 'Paused');
    const restart = ctx.events.count(RestartRequested) > 0;
    let acceptedShot = false;
    if (!paused && !restart) ctx.events.forEach(AudioCue, (cue) => {
      if (cue.kind !== 'Shot' || cue.step <= feel.lastShotStep[0]!) return;
      feel.lastShotStep[0] = cue.step;
      feel.shotTime[0] = 0.095;
      acceptedShot = true;
    });
    if (!paused) {
      feel.shotTime[0] = Math.max(0, feel.shotTime[0]! - dt);
      feel.takeoffTime[0] = Math.max(0, feel.takeoffTime[0]! - dt);
      feel.landingTime[0] = Math.max(0, feel.landingTime[0]! - dt);
    }
    if (restart) {
      feel.initialized[0] = 0;
      feel.shotTime[0] = feel.takeoffTime[0] = feel.landingTime[0] = 0;
      feel.lastShotStep[0] = ctx.step;
    }
    for (const chunk of players.chunks()) {
      const control = chunk.col(PlayerControl);
      const contact = chunk.col(PlayerGroundContact);
      const motion = chunk.col(PlayerMotion);
      const health = chunk.col(Health);
      const reaction = chunk.col(HitReaction);
      const sprite = chunk.col(Sprite);

      for (let row = 0; row < chunk.length; row++) {
        const grounded = contact.grounded[row] !== 0 && motion.ignoreGroundContact[row] === 0;
        const dash = chunk.col(PlayerDashState).active[row] !== 0;
        const facing = chunk.is(PlayerMotion, row, 'facing', 'Left') ? -1 : 1;
        const vy = motion.verticalVelocity[row]!;
        const hp = health.current[row]!;
        const live = ctx.is(GameState, 'phase', 'Playing') && hp > 0;
        if (!paused && live && feel.initialized[0]) {
          if (feel.grounded[0] && !grounded && vy > 0) feel.takeoffTime[0] = 0.11;
          if (!feel.grounded[0] && grounded && feel.previousVerticalVelocity[0]! < -1) {
            feel.landingTime[0] = 0.14;
            feel.landingStrength[0] = Math.min(1, Math.abs(feel.previousVerticalVelocity[0]!) / 12);
            if (ctx.is(GameFeelComparison, 'recoil', true)) bumpCamera(ctx, 0, -0.028 * feel.landingStrength[0]!);
          }
        }
        if (!paused && !restart && feel.initialized[0] && hp < feel.previousHealth[0]!) {
          if (ctx.is(GameFeelComparison, 'shake', true)) shakeCamera(ctx, hp === 0 ? 0.15 : 0.095, hp === 0 ? 0.3 : 0.16);
          if (ctx.is(GameFeelComparison, 'recoil', true)) bumpCamera(ctx, -facing * 0.065, 0.035);
        }
        if (!paused) {
          feel.initialized[0] = 1;
          feel.grounded[0] = grounded ? 1 : 0;
          feel.previousVerticalVelocity[0] = vy;
          feel.previousHealth[0] = hp;
        }
        const moving = Math.abs(motion.horizontalVelocity[row]!) > 0.1;
        let clip = 'art/player/idle.clip2d.json';

        if (ctx.is(GameState, 'phase', 'Paused')) {
          feel.active[0] = 0;
          chunk.setField(PlayerAnimationPresentation, row, 'paused', true);
          chunk.setField(SpriteAnimation, row, 'playing', false);
          continue;
        }
        if (chunk.col(PlayerAnimationPresentation).paused[row]) {
          chunk.setField(PlayerAnimationPresentation, row, 'paused', false);
          chunk.setField(SpriteAnimation, row, 'playing', true);
        }
        const completed = ctx.is(GameState, 'phase', 'Completed');
        if (completed) {
          clip = 'art/player/idle.clip2d.json';
        } else if (health.current[row] === 0 || reaction.stepsRemaining[row]! > 0) {
          clip = 'art/player/hurt.clip2d.json';
        } else if (dash) {
          clip = 'art/player/fall.clip2d.json';
        } else if (feel.shotTime[0]! > 0) {
          clip = 'art/player/shoot.clip2d.json';
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

        if (!chunk.is(PlayerAnimationPresentation, row, 'clip', clip) || (acceptedShot && clip === 'art/player/shoot.clip2d.json')) {
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
        sprite.flipX[row] = facing < 0 ? 1 : 0;
        // Feet remain the anchor. These envelopes never touch collision or authoritative transforms.
        let sx = 1, sy = 1, lean = 0, recoilX = 0;
        if (live) {
          if (dash) { sx = 1.3; sy = 0.78; lean = -facing * 0.16; }
          else if (feel.landingTime[0]! > 0) {
            const weight = Math.sin(Math.PI * feel.landingTime[0]! / 0.14) * feel.landingStrength[0]!;
            sx = 1 + weight * 0.24; sy = 1 - weight * 0.24;
          } else if (feel.takeoffTime[0]! > 0) {
            const weight = Math.sin(Math.PI * feel.takeoffTime[0]! / 0.11);
            sx = 1 - weight * 0.12; sy = 1 + weight * 0.14;
          } else if (feel.shotTime[0]! > 0) {
            const weight = feel.shotTime[0]! / 0.095;
            recoilX = -facing * 0.07 * weight; lean = facing * 0.06 * weight;
          }
        }
        for (const visual of visuals.chunks()) for (let v = 0; v < visual.length; v++) {
          if (visual.entity(v) !== chunk.entity(row)) continue;
          const offset = visual.col(VisualOffset);
          offset.position[v * 3] = recoilX;
          offset.scale[v * 3] = sx; offset.scale[v * 3 + 1] = sy;
          offset.rotation[v * 4 + 2] = Math.sin(lean / 2);
          offset.rotation[v * 4 + 3] = Math.cos(lean / 2);
        }
        feel.active[0] = !paused && live && (dash || feel.shotTime[0]! > 0 || feel.takeoffTime[0]! > 0 || feel.landingTime[0]! > 0) ? 1 : 0;
      }
    }
  },
});
