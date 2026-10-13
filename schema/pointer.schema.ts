import { bool, resource } from '@gameengine/schema';

export const PointerControlState = resource('PointerControlState', {
  fire: bool({ default: false }), jumpHeld: bool({ default: false }), playing: bool({ default: false }),
}, { sim: true, doc: 'Recorded pointer holds merged into the normalized action sample.' });
