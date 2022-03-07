import "phaser";
import Textures from "./textures";
import { SceneNames } from "./scene-names";

export default class GameoverScene extends Phaser.Scene {

    private keyEnter: Phaser.Input.Keyboard.Key

    constructor() {
        super(SceneNames.GAMEOVER)
    }

    preload() {
        this.load.image('buttonImage', Textures.buttonImage)
    }

    create() {
        let graphics = this.add.graphics();

        graphics.fillStyle(0x200000, 0.5);
        graphics.fillRect(0, 0, 800, 600);

        let title = this.add.text(this.sys.canvas.width/2, 200, 'Game over!', { font: '32px Courier', color: '#ffffff'})
        title.setOrigin(0.5).setShadow(3, 3, 'rgba(0,0,0,0.8)', 1)

        const respawnButton = this.add.image(400, 300, 'buttonImage').setScale(0.3, 0.2).setInteractive()
        this.input.on('gameobjectup', (pointer: any, gameObject: any, event: any) => {
            if (gameObject == respawnButton) {
                this.scene.start(SceneNames.SCROLL_GAME)
            }
        })

        let respawnText = this.add.text(this.sys.canvas.width/2, 300, 'Respawn', { font: '24px Courier', color: '#ffffff' })
        respawnText.setOrigin(0.5).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1)

        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    }

    update() {
        if (this.keyEnter.isDown) {
            this.scene.start(SceneNames.SCROLL_GAME)
        }
    }

}