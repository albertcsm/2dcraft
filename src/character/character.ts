export default interface Character {
    getSprite(): Phaser.Physics.Arcade.Sprite
    passivePush(vx: number, vy: number): void
    hurt(): void
}