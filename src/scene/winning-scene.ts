import "phaser";
import Textures from "./textures";
import { SceneNames } from "./scene-names";

export default class WinningScene extends Phaser.Scene {

    private keyEnter: Phaser.Input.Keyboard.Key

    constructor() {
        super(SceneNames.WINNING)
    }

    preload() {
        this.load.image('trophyImage', Textures.trophyImage)
    }

    create() {
        let graphics = this.add.graphics();

        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, 100, 800, 400);

        const trophyImage = this.add.image(400, 270, 'trophyImage').setScale(0.4).setInteractive()
        this.input.on('gameobjectup', (pointer: any, gameObject: any, event: any) => {
            if (gameObject == trophyImage) {
                this.scene.start(SceneNames.SCROLL_GAME)
            }
        })

        let title = this.add.text(this.sys.canvas.width/2, 440, 'You Win!', { font: '32px Courier', color: '#ffffff'})
        title.setOrigin(0.5).setShadow(3, 3, 'rgba(0,0,0,0.8)', 1)

        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    }

    update() {
        if (this.keyEnter.isDown) {
            this.scene.start(SceneNames.SCROLL_GAME)
        }
    }

}