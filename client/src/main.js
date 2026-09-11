import { net } from './net.js';
import { Lobby } from './ui/Lobby.js';
import { Game } from './game/Game.js';
import { S2C } from '@crl/shared';

async function main() {
  const root = document.getElementById('ui-root');
  let game = null;

  const lobby = new Lobby(root, {
    onMatchStart: () => {},
  });

  net.on(S2C.MATCH_START, (msg) => {
    if (!game) game = new Game(root);
    game.start(msg);
  });

  net.on('_close', () => {
    lobby.showError('Disconnected from server. Reload to reconnect.');
  });

  try {
    await net.connect();
  } catch (e) {
    lobby.showError('Could not connect to server.');
  }
}

main();
