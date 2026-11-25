import { Game } from './Game';

try {
  const game = new Game();
  game.start();
} catch (error: any) {
  alert("GAME CRASHED ON STARTUP!\n\nError: " + error.message + "\n\nCheck the console (F12) for the file and line number.");
  console.error(error);
}
