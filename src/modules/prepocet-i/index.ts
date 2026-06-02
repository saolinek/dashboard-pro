import { moduleRegistry } from '@/core/registry';
import { PowerCalculator } from './component';

moduleRegistry.register({
  type: 'prepocet-i',
  name: 'Kalkulačka výkonu',
  description: 'Výpočet činného výkonu z proudu a napětí',
  component: PowerCalculator,
  defaultWidth: 1,
  defaultHeight: 1,
});
