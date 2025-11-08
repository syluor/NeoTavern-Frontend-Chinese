import { CharactersBlock } from './CharactersBlock';
import { RightMenu_HotSwap } from './HotSwap';

export class RightMenu {
  constructor() {
    new RightMenu_HotSwap();
    new CharactersBlock();
  }
}
