import 'phaser'
import Textures from "../scene/textures";
import Character from './character';
import Player from './player';

export default class Zombie implements Character {

    private scene: Phaser.Scene
    private sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    private lives: number
    private passiveVelocity?: Phaser.Math.Vector2
    private disabledUntil: number
    private invincibleUntil: number
    private chasingAfter?: Player
    private chasingRange: number = Infinity

    constructor(scene: Phaser.Scene) {
        this.scene = scene
    }

    preload() {
        this.scene.load.spritesheet('zombie', Textures.zombieSprite, { frameWidth: 218, frameHeight: 288 });
    }
    
    init(initX: number, initY: number) {
        this.lives = 3
        this.passiveVelocity = null
        this.disabledUntil = 0
        this.invincibleUntil = 0
        this.chasingAfter = null
        this.chasingRange = Infinity

        this.sprite = this.scene.physics.add.sprite(initX, initY, 'zombie').setSize(90, 260).setScale(0.2);
        this.sprite.setCollideWorldBounds(true);

        this.scene.anims.create({
            key: 'zombieWalk',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        })
    }

    update() {
        if (!this.lives) {
            return
        }

        if (Date.now() < this.disabledUntil) {
            if (this.passiveVelocity.x !== 0 || this.passiveVelocity.y !== 0) {
                this.sprite.setVelocity(this.passiveVelocity.x, this.passiveVelocity.y)
                this.passiveVelocity = new Phaser.Math.Vector2(0, 0)
            }
            return;
        } else if (this.chasingAfter) {
            const dx = this.chasingAfter.getSprite().x - this.sprite.x
            const dy = this.chasingAfter.getSprite().y - this.sprite.y
            if (Math.abs(dx) < this.sprite.displayWidth * 3/4) {
                this.sprite.anims.stop()
                this.sprite.setVelocityX(0)
                if (Math.abs(dy) < this.sprite.displayHeight * 2/3) {
                    this.chasingAfter.hurt()
                }
            } else if (Math.abs(dx) < this.chasingRange) {
                this.sprite.setVelocityX(dx < 0 ? -50 : 50)
                this.sprite.flipX = dx < 0
                this.sprite.anims.play('zombieWalk', true)
            } else {
                this.sprite.anims.stop()
                this.sprite.setVelocityX(0)
            }
        }
    }

    getSprite(): Phaser.Physics.Arcade.Sprite {
        return this.sprite
    }

    passivePush(vx: number, vy: number) {
        this.passiveVelocity = new Phaser.Math.Vector2(vx, vy)
        this.disabledUntil = Date.now() + 400;
    }

    hurt() {
        if (Date.now() > this.invincibleUntil) {
            this.invincibleUntil = Date.now() + 1000;
            if (this.lives > 0) {
                this.lives--
                
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: 0,
                    duration: 100,
                    yoyo: true,
                    repeat: 0,
                })
            } else {
                this.sprite.destroy()
            }
        }
    }

    chaseAfter(player: Player, range: number) {
        this.chasingAfter = player
        this.chasingRange = range
    }

}