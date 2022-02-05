import 'phaser';
import ScrollScene from './scene/scroll-scene'
import GameoverScene from './scene/gameover-scene';
import './style.css'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      // debug: true,
      // debugShowBody: true,
      // debugShowStaticBody: true,
    },
  },
  scene: [ScrollScene, GameoverScene]
}

new Phaser.Game(config);

