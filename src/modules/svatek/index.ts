import { moduleRegistry } from '@/core/registry';
import { NamedaysComponent } from './component';

moduleRegistry.register({
  type: 'svatek',
  name: 'Svátek',
  description: 'Zobrazuje, kdo má dnes svátek a svátky do konce týdne',
  component: NamedaysComponent,
  defaultWidth: 2,
  defaultHeight: 2,
});
