import { moduleRegistry } from '@/core/registry';
import { SpojeniUzluComponent } from './component';

moduleRegistry.register({
  type: 'spojeni-uzlu',
  name: 'Spojení uzlových oblastí',
  description: 'Rychlé generování e-mailu o provozních změnách spojením dvou oblastí',
  component: SpojeniUzluComponent,
  defaultWidth: 4,
  defaultHeight: 3,
});
