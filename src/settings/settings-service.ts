import Settings from "./settings";

export default class SettingsService {

    private static readonly STORAGE_KEY = 'settings'

    getSettings(): Settings {
        const configString = localStorage.getItem(SettingsService.STORAGE_KEY)
        return new Settings(configString ? JSON.parse(configString) : {})
    }

    updateSettings(settings: Settings) {
        const configString = JSON.stringify(settings)
        localStorage.setItem(SettingsService.STORAGE_KEY, configString)
    }

}