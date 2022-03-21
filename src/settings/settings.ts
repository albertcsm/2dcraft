export default class Settings {
    
    peacefulMode: boolean = false

    constructor(setting: Partial<Settings>) {
        Object.assign(this, setting)
    }

}