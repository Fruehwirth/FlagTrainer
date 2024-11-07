import { Game } from './modules/game.js';
import { UI } from './modules/ui.js';
import { Settings } from './modules/settings.js';

document.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    const ui = new UI(game);
    const settings = new Settings(game, ui);

    await game.fetchFlags();
    game.preloadNextFlag();
    ui.showNextFlag();
});
