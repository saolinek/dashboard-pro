import { moduleRegistry } from '@/core/registry';
import { OutageTimer } from './component';

moduleRegistry.register({
  type: 'odstavka-timer',
  name: 'Konec odstávky',
  description: 'Výpočet času konce odstávky (zima 8h, léto 12h)',
  component: OutageTimer,
  defaultWidth: 2,
  defaultHeight: 2,
});
