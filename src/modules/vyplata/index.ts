import { moduleRegistry } from '@/core/registry';
import { PayrollWidget } from './component';

moduleRegistry.register({
  type: 'vyplata',
  name: 'Výplata',
  description: 'Odpočet do nejbližší prémiové výplaty',
  component: PayrollWidget,
  defaultWidth: 2,
  defaultHeight: 1,
});
