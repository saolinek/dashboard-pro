import { moduleRegistry } from '@/core/registry';
import { PayrollWidget } from './component';

moduleRegistry.register({
  type: 'vyplata',
  name: 'Výplata',
  description: 'Nejbližší termín zveřejnění výplatního lístku podle interní tabulky',
  component: PayrollWidget,
  defaultWidth: 2,
  defaultHeight: 1,
});
