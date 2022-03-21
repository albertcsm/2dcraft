import 'phaser';
import ScrollScene from './scene/scroll-scene'
import GameoverScene from './scene/gameover-scene';
import WinningScene from './scene/winning-scene';
import './style.css'
import SettingsScene from './scene/settings-scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1138,
    height: 640
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
  input :{
		activePointers: 10,
	},
  scene: [ScrollScene, SettingsScene, GameoverScene, WinningScene]
}

new Phaser.Game(config);

