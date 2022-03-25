import TilemapWorld from "../world/tilemap-world";
import Character from "../character/character";

export default class WanderBeehavior {

    private character: Character
    private world: TilemapWorld
    private aroundX: number
    private aroundY: number
    private speed: number
    private maxDistance: number
    private targetX?: number = null
    private targetDirection: number

    constructor(character: Character, world: TilemapWorld) {
        this.character = character
        this.world = world
    }

    wanderAround(x: number, y: number, speed: number, maxDistance: number) {
        this.aroundX = x
        this.aroundY = y
        this.speed = speed
        this.maxDistance = maxDistance
    }

    getMotion(): [number, boolean] {
        const sprite = this.character.getSprite()

        if (this.targetX === null || (sprite.x - this.targetX) * this.targetDirection > 0) {
            const range = this.world.getAccessibleRange(this.aroundX, this.aroundY, this.maxDistance)
            this.targetX = Math.abs(sprite.x - range[0]) > Math.abs(sprite.x - range[1]) ? range[0] : range[1]
            this.targetDirection = Math.sign(this.targetX - sprite.x)
        }

        let jump = false
        let blockedLeft = sprite.body.blocked.left && sprite.body.deltaXFinal() <= 0
        let blockedRight = sprite.body.blocked.right && sprite.body.deltaXFinal() >= 0
        if ((blockedLeft || blockedRight) && sprite.body.onFloor()) {
            jump = true
        }

        return [this.targetDirection * this.speed, jump]
    }

}