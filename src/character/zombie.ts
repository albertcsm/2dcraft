import 'phaser'
import Resources from "../scene/resources"
import TilemapWorld from '../world/tilemap-world';
import Character from './character';
import Player from './player';
import WanderBeehavior from '../behavior/wander-behavior';

export default class Zombie implements Character {

    private static readonly wanderDistance = 100

    private scene: Phaser.Scene
    private sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    private lives: number
    private passiveVelocity?: Phaser.Math.Vector2
    private disabledUntil: number
    private invincibleUntil: number
    private chasingAfter?: Player
    private chasingRange: number = Infinity
    private wanderBehavior: WanderBeehavior
    private invincibleTween: Phaser.Tweens.Tween

    constructor(scene: Phaser.Scene) {
        this.scene = scene
    }

    static preload(scene: Phaser.Scene) {
        scene.load.spritesheet('zombie', Resources.zombieSprite, { frameWidth: 220, frameHeight: 300 });
    }
    
    init(world: TilemapWorld, initX: number, initY: number) {
        this.lives = 2
        this.passiveVelocity = null
        this.disabledUntil = 0
        this.invincibleUntil = 0
        this.chasingAfter = null
        this.chasingRange = Infinity

        this.sprite = this.scene.physics.add.sprite(initX, initY, 'zombie').setSize(90, 260).setScale(0.2);
        this.sprite.setCollideWorldBounds(true);

        this.wanderBehavior = new WanderBeehavior(this, world)
        this.wanderBehavior.wanderAround(initX, initY, 20, Zombie.wanderDistance)

        this.scene.anims.create({
            key: 'zombieWalk',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 0, end: 1 }),
            frameRate: 2,
            repeat: -1
        })

        this.scene.anims.create({
            key: 'zombieChase',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        })

        this.invincibleTween = this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 0,
            paused: true
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
        }
        
        let vx = 0
        let jump = false
        if (this.chasingAfter) {
            const dx = this.chasingAfter.getSprite().x - this.sprite.x
            const dy = this.chasingAfter.getSprite().y - this.sprite.y
            if (Math.abs(dx) < this.sprite.displayWidth * 3/4) {
                if (Math.abs(dy) < this.sprite.displayHeight * 2/3) {
                    this.chasingAfter.hurt()
                }
            } else if (Math.abs(dx) < this.chasingRange) {
                vx = dx < 0 ? -50 : 50
                if (this.sprite.body.onWall() && this.sprite.body.onFloor()) {
                    jump = true
                }
            } else {
                [vx, jump] = this.wanderBehavior.getMotion()
            }
        } else {
            [vx, jump] = this.wanderBehavior.getMotion()
        }

        if (vx !== 0) {
            this.sprite.setVelocityX(vx);
            this.sprite.flipX = vx < 0
            this.sprite.anims.play(Math.abs(vx) > 25 ? 'zombieChase' : 'zombieWalk', true)
        } else {
            this.sprite.setVelocityX(0)
            this.sprite.anims.stop()
        }
        if (jump) {
            this.sprite.setVelocityY(-250);
        }

        // add tiny motion when being pushed to trigger collision detection with wall
        if (this.sprite.body.touching.left) {
            this.sprite.setVelocityX(0.001)
            // avoid being pushed into wall
            this.sprite.setPushable(!this.sprite.body.onWall())
        } else if (this.sprite.body.touching.right) {
            this.sprite.setVelocityX(-0.001)
            // avoid being pushed into wall
            this.sprite.setPushable(!this.sprite.body.onWall())
        } else {
            this.sprite.setPushable(true)
        }
    }

    getSprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
        return this.sprite
    }

    passivePush(vx: number, vy: number) {
        this.passiveVelocity = new Phaser.Math.Vector2(vx, vy)
        this.disabledUntil = Date.now() + 400;
    }

    hurt() {
        if (this.lives === 0) {
            return
        }

        if (Date.now() > this.invincibleUntil) {
            this.invincibleUntil = Date.now() + 1000;
            this.lives--

            if (this.lives > 0) {                
                this.invincibleTween.resume()
                this.invincibleTween.restart()
            } else {
                this.sprite.destroy()
            }
        }
    }

    chaseAfter(player: Player, range: number) {
        this.chasingAfter = player
        this.chasingRange = range
    }

    randomWalk() {
        this.chasingAfter = null
        this.chasingRange = Infinity
    }

}