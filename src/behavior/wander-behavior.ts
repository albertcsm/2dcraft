import TilemapWorld from "../world/tilemap-world";
import Character from "../character/character";

export default class WanderBeehavior {

    private character: Character
    private world: TilemapWorld
    private aroundX: number
    private aroundY: number
    private speed: number
    private maxDistance: number
    private rangeLeft: number
    private rangeRight: number
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
        this.rangeLeft = maxDistance
        this.rangeRight = maxDistance
        this.targetX = null
    }

    getMotion(): [number, boolean] {
        const sprite = this.character.getSprite()

        if (this.targetX === null || (sprite.x - this.targetX) * this.targetDirection > 0) {
            const range = this.world.getAccessibleRange(this.aroundX, this.aroundY, this.rangeLeft, this.rangeRight)
            this.targetX = Math.abs(sprite.x - range[0]) > Math.abs(sprite.x - range[1]) ? range[0] : range[1]
            this.targetDirection = Math.sign(this.targetX - sprite.x)
        }

        let jump = false
        let blockedLeft = this.targetDirection < 0 && sprite.body.blocked.left
        let blockedRight = this.targetDirection > 0 && sprite.body.blocked.right
        if ((blockedLeft || blockedRight) && sprite.body.onFloor()) {
            const range = this.world.getAccessibleRange(sprite.x, sprite.y, 1, 1)
            if ((blockedLeft && range[0] < sprite.x) || (blockedRight && range[1] > sprite.x)) {
                jump = true
            } else if (blockedLeft) {
                this.adapteWanderRange(sprite.x, sprite.y, 0, this.maxDistance * 2)
            } else {
                this.adapteWanderRange(sprite.x, sprite.y, this.maxDistance * 2, 0)
            }
        }

        return [this.targetDirection * this.speed, jump]
    }

    private adapteWanderRange(x: number, y: number, rangeLeft: number, rangeRight: number) {
        this.aroundX = x
        this.aroundY = y
        this.rangeLeft = rangeLeft
        this.rangeRight = rangeRight
        this.targetX = null
    }

}