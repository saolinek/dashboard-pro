import { moduleRegistry } from '@/core/registry';
import { OutageDeadline } from './component';

moduleRegistry.register({
  type: 'odstavka-deadline',
  name: 'Max. datum',
  description: 'Maximální datum pro odstávku po 20 kalendářních dnech',
  component: OutageDeadline,
  defaultWidth: 2,
  defaultHeight: 1,
});
