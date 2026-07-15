import { moduleRegistry } from '@/core/registry';
import { StornoH1Generator } from './component';

moduleRegistry.register({
  type: 'generator-storno-h1',
  name: 'Generátor e-mailu – STORNO H1',
  description: 'Automaticky vytvoří e-mail o stornu hlášení H1 se živým náhledem a mailto odkazem.',
  component: StornoH1Generator,
  defaultWidth: 2,
  defaultHeight: 3,
});
