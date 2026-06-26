import { moduleRegistry } from '@/core/registry';
import { PowerCalculator } from './component';

moduleRegistry.register({
  type: 'prepocet-i',
  name: 'Výkon',
  description: 'Dvousměrný přepočet mezi proudem a výkonem při 23 kV a cos 0.95',
  component: PowerCalculator,
  defaultWidth: 1,
  defaultHeight: 1,
});
