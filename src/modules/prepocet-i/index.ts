import { moduleRegistry } from '@/core/registry';
import { PowerCalculator } from './component';

moduleRegistry.register({
  type: 'prepocet-i',
  name: 'Výkon',
  description: 'Dvousměrný přepočet mezi proudem a výkonem pro NN, VN a VVN',
  component: PowerCalculator,
  defaultWidth: 1,
  defaultHeight: 1,
});
