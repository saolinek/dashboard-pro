import { moduleRegistry } from '@/core/registry';
import { BookmarksComponent } from './component';

moduleRegistry.register({
  type: 'bookmarks',
  name: 'Záložky',
  description: 'Správce rychlých odkazů a záložek',
  component: BookmarksComponent,
  defaultWidth: 1,
  defaultHeight: 2,
});
