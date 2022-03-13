import "phaser";
import Textures from "./textures";
import { SceneNames } from "./scene-names";

export default class WinningScene extends Phaser.Scene {

    private backgroundStripe: Phaser.GameObjects.Graphics
    private trophyImage: Phaser.GameObjects.Image
    private titleText: Phaser.GameObjects.Text
    private keyEnter: Phaser.Input.Keyboard.Key

    constructor() {
        super(SceneNames.WINNING)
    }

    preload() {
        this.load.image('trophyImage', Textures.trophyImage)
    }

    create() {
        this.backgroundStripe = this.add.graphics().setInteractive()

        this.trophyImage = this.add.image(0, 0, 'trophyImage').setScale(0.4).setInteractive()

        this.titleText = this.add.text(0, 0, 'You Win!', { font: '32px Courier', color: '#ffffff'})
        this.titleText.setOrigin(0.5).setShadow(3, 3, 'rgba(0,0,0,0.8)', 1).setInteractive()

        this.input.on('gameobjectup', (pointer: any, gameObject: any, event: any) => {
            this.scene.start(SceneNames.SCROLL_GAME)
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

        this.backgroundStripe.clear()
        this.backgroundStripe.fillStyle(0x000000, 0.5).fillRect(0, 100, canvasWidth, canvasHeight - 200)

        this.trophyImage.setPosition(canvasWidth / 2, canvasHeight / 2 - 30)

        this.titleText.setPosition(canvasWidth / 2, canvasHeight / 2 + 140)
    }

}