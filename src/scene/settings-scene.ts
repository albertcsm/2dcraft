import "phaser";
import { SceneNames } from "./scene-names";
import SettingsService from "../settings/settings-service";
import Settings from "../settings/settings";
// @ts-ignore
import settingsHtml from "../assets/form/settings.html";

export default class SettingsScene extends Phaser.Scene {

    private settingsService: SettingsService
    private settings: Settings

    constructor() {
        super(SceneNames.SETTINGS)
        this.settingsService = new SettingsService()
    }

    preload() {
    }

    create() {
        this.settings = this.settingsService.getSettings()

        this.add.dom(0, 0).setOrigin(0, 0).createFromHTML(settingsHtml);

        document.querySelector('#peaceful-mode-label').innerHTML = this.getPeacefulModeText()

        document.querySelector('#peaceful-mode-button').addEventListener('click', () => {
            this.settings.peacefulMode = !this.settings.peacefulMode
            document.querySelector('#peaceful-mode-label').innerHTML = this.getPeacefulModeText()
        })

        document.querySelector('#done-button').addEventListener('click', () => {
            this.saveAndDismiss()
        })
    }

    update() {
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