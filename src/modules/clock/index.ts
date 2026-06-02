import { moduleRegistry } from '@/core/registry';
import { ClockComponent } from './component';

moduleRegistry.register({
  type: 'clock',
  name: 'Hodiny',
  description: 'Zobrazuje aktuální čas a datum',
  component: ClockComponent,
  defaultWidth: 1,
  defaultHeight: 1,
});
