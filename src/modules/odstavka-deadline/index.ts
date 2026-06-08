import { moduleRegistry } from '@/core/registry';
import { OutageDeadline } from './component';

moduleRegistry.register({
  type: 'odstavka-deadline',
  name: 'Odstávka – Maximální datum',
  description: 'Maximální datum pro odstávku po 20 kalendářních dnech, s posunem víkendu na pondělí',
  component: OutageDeadline,
  defaultWidth: 2,
  defaultHeight: 1,
});
