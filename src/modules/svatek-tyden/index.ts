import { moduleRegistry } from '@/core/registry';
import { TydenComponent } from './component';

moduleRegistry.register({
  type: 'svatek-tyden',
  name: 'Týden',
  description: 'Zobrazuje sedm dní od vybraného data',
  component: TydenComponent,
  defaultWidth: 2,
  defaultHeight: 2,
});
