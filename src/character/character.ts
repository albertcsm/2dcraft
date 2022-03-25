export default interface Character {
    getSprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    passivePush(vx: number, vy: number): void
    hurt(): void
}