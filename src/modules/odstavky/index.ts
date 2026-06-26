import { moduleRegistry } from '@/core/registry';
import { OutagePlanner } from './component';

moduleRegistry.register({
  type: 'odstavky',
  name: 'Odstávky',
  description: 'Ověření lhůty pro ohlášení odstávky v kalendářních dnech',
  component: OutagePlanner,
  defaultWidth: 1,
  defaultHeight: 1,
});
