import { moduleRegistry } from '@/core/registry';
import { OutagePlanner } from './component';

moduleRegistry.register({
  type: 'odstavky',
  name: 'Plánovač odstávek',
  description: 'Ověření lhůty pro ohlášení odstávky v pracovních dnech',
  component: OutagePlanner,
  defaultWidth: 1,
  defaultHeight: 1,
});
