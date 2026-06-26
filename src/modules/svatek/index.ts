import { moduleRegistry } from '@/core/registry';
import { NamedaysComponent } from './component';

moduleRegistry.register({
  type: 'svatek',
  name: 'Svátek',
  description: 'Zobrazuje, kdo má dnes svátek',
  component: NamedaysComponent,
  defaultWidth: 1,
  defaultHeight: 1,
});
