import { moduleRegistry } from '@/core/registry';
import { InflationCalculator } from './component';

moduleRegistry.register({
  type: 'inflace',
  name: 'Kalkulačka inflace',
  description: 'Přepočet částky v Kč podle průměrné roční inflace ČSÚ',
  component: InflationCalculator,
  defaultWidth: 2,
  defaultHeight: 2,
});
