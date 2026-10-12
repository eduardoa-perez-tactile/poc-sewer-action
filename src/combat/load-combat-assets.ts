import '@gameengine/ui';
import { loading } from '@gameengine/runtime';

// The boot cover holds fixed steps until the projectile prefab is resident, so warming the
// deterministic pool never performs document IO on the frame thread.
void loading.boot({ load: ['boot'] });
