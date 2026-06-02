import { moduleRegistry } from '@/core/registry';
import { WorkComponent } from './component';

moduleRegistry.register({
  type: 'work',
  name: 'Pracovní doba',
  description: 'Výpočet doporučeného odchodu domů',
  component: WorkComponent,
  defaultWidth: 1,
  defaultHeight: 1,
});
