import "phaser";
import Textures from "./textures";
import { SceneNames } from "./scene-names";

export default class GameoverScene extends Phaser.Scene {

    private backgroundImage: Phaser.GameObjects.Graphics
    private titleText: Phaser.GameObjects.Text
    private respawnButton: Phaser.GameObjects.Image
    private respawnText: Phaser.GameObjects.Text
    private keyEnter: Phaser.Input.Keyboard.Key

    constructor() {
        super(SceneNames.GAMEOVER)
    }

    preload() {
        this.load.image('buttonImage', Textures.buttonImage)
    }

    create() {
        this.backgroundImage = this.add.graphics();

        this.titleText = this.add.text(0, 0, 'Game over!', { font: '32px Courier', color: '#ffffff'})
        this.titleText.setOrigin(0.5).setShadow(3, 3, 'rgba(0,0,0,0.8)', 1)

        this.respawnButton = this.add.image(0, 0, 'buttonImage').setScale(0.3, 0.2).setInteractive()

        this.respawnText = this.add.text(0, 0, 'Respawn', { font: '24px Courier', color: '#ffffff' })
        this.respawnText.setOrigin(0.5).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1).setInteractive()

        this.input.on('gameobjectup', (pointer: any, gameObject: any, event: any) => {
            if (gameObject == this.respawnButton || gameObject == this.respawnText) {
                this.scene.start(SceneNames.SCROLL_GAME)
            }
        })

        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

        this.scale.on('resize', this.handleCanvasResize, this);
        this.handleCanvasResize()
    }

    update() {
        if (this.keyEnter.isDown) {
            this.scene.start(SceneNames.SCROLL_GAME)
        }
    }

    private handleCanvasResize() {
        const canvasWidth = this.sys.game.canvas.width
        const canvasHeight = this.sys.game.canvas.height

        this.backgroundImage.clear()
        this.backgroundImage.fillStyle(0x200000, 0.5).fillRect(0, 0, canvasWidth, canvasHeight)

        this.titleText.setPosition(canvasWidth / 2, canvasHeight / 2 - 100)
        this.respawnButton.setPosition(canvasWidth / 2, canvasHeight / 2)
        this.respawnText.setPosition(canvasWidth / 2, canvasHeight / 2)
    }

}