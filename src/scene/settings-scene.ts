import "phaser";
import Textures from "./textures";
import { SceneNames } from "./scene-names";
import SettingsService from "../settings/settings-service";
import Settings from "../settings/settings";

export default class SettingsScene extends Phaser.Scene {

    private settingsService: SettingsService
    private settings: Settings
    private backgroundImage: Phaser.GameObjects.Graphics
    private titleText: Phaser.GameObjects.Text
    private peacefulModeButton: Phaser.GameObjects.Image
    private peacefulModeText: Phaser.GameObjects.Text
    private doneButton: Phaser.GameObjects.Image
    private doneText: Phaser.GameObjects.Text
    private keyEnter: Phaser.Input.Keyboard.Key

    constructor() {
        super(SceneNames.SETTINGS)
        this.settingsService = new SettingsService()
    }

    preload() {
        this.load.image('buttonImage', Textures.buttonImage)
    }

    create() {
        this.settings = this.settingsService.getSettings()

        this.backgroundImage = this.add.graphics();

        this.titleText = this.add.text(0, 0, 'Settings', { font: '32px Courier', color: '#ffffff'})
        this.titleText.setOrigin(0.5).setShadow(3, 3, 'rgba(0,0,0,0.8)', 1)

        this.peacefulModeButton = this.add.image(0, 0, 'buttonImage').setScale(0.3, 0.2).setInteractive()
        this.peacefulModeText = this.add.text(0, 0, this.getPeacefulModeText(), { font: '24px Courier', color: '#ffffff' })
        this.peacefulModeText.setOrigin(0.5).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1).setInteractive()

        this.doneButton = this.add.image(0, 0, 'buttonImage').setScale(0.3, 0.2).setInteractive()
        this.doneText = this.add.text(0, 0, 'Done', { font: '24px Courier', color: '#ffffff' })
        this.doneText.setOrigin(0.5).setShadow(2, 2, 'rgba(0,0,0,0.8)', 1).setInteractive()

        this.input.on('gameobjectup', (pointer: any, gameObject: any, event: any) => {
            if (gameObject == this.doneButton || gameObject == this.doneText) {
                this.saveAndDismiss()
            } else if (gameObject == this.peacefulModeButton || gameObject == this.peacefulModeText) {
                this.settings.peacefulMode = !this.settings.peacefulMode
                this.peacefulModeText.setText(this.getPeacefulModeText())
            }
        })

        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

        this.scale.on('resize', this.handleCanvasResize, this);
        this.handleCanvasResize()
    }

    update() {
        if (this.keyEnter.isDown) {
            this.saveAndDismiss()
        }
    }

    private handleCanvasResize() {
        const canvasWidth = this.sys.game.canvas.width
        const canvasHeight = this.sys.game.canvas.height

        this.backgroundImage.clear()
        this.backgroundImage.fillStyle(0x000000, 0.5).fillRect(0, 0, canvasWidth, canvasHeight)

        this.titleText.setPosition(canvasWidth / 2, 200)
        
        this.peacefulModeButton.setPosition(canvasWidth / 2, canvasHeight / 2)
        this.peacefulModeText.setPosition(canvasWidth / 2, canvasHeight / 2)

        this.doneButton.setPosition(canvasWidth / 2, canvasHeight - 200)
        this.doneText.setPosition(canvasWidth / 2, canvasHeight - 200)
    }

    private getPeacefulModeText() {
        return `Peaceful Mode: ${this.settings.peacefulMode ? 'ON': 'OFF'}`
    }

    private saveAndDismiss() {
        this.settingsService.updateSettings(this.settings)
        
        this.scene.stop()
        this.scene.resume(SceneNames.SCROLL_GAME)
    }

}