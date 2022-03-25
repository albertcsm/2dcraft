import 'phaser'
import Resources from '../scene/resources'
import Character from './character';

export default class Player implements Character {

    static readonly MAX_LIVES = 5
    static readonly INIT_LIVES = 5

    private scene: Phaser.Scene
    private sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    private lives: number
    private facing: number
    private lookingUp: number
    private moving: boolean
    private playerDisabledUntil: number
    private playerInvincibleUntil: number
    private playerPassiveVelocity: Phaser.Math.Vector2
    private alwaysInvincible: boolean
    private invincibleTween: Phaser.Tweens.Tween

    constructor(scene: Phaser.Scene) {
        this.scene = scene
    }

    preload() {
        this.scene.load.spritesheet('player', Resources.alexSprite, { frameWidth: 200, frameHeight: 300 });
    }

    init(initX: number, initY: number) {
        this.lives = Player.INIT_LIVES
        this.facing = +1
        this.lookingUp = 0
        this.moving = false
        this.playerDisabledUntil = 0
        this.playerInvincibleUntil = 0
        this.playerPassiveVelocity = new Phaser.Math.Vector2(0,0)
        this.alwaysInvincible = false
        
        this.sprite = this.scene.physics.add.sprite(initX, initY, 'player').setSize(90, 260).setScale(0.2);
        this.sprite.setCollideWorldBounds(true);

        this.scene.anims.create({
            key: 'left',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.scene.anims.create({
            key: 'right',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.scene.anims.create({
            key: 'left-up',
            frames: [ { key: 'player', frame: 8 } ]
        });

        this.scene.anims.create({
            key: 'left-down',
            frames: [ { key: 'player', frame: 9 } ]
        });

        this.scene.anims.create({
            key: 'right-up',
            frames: [ { key: 'player', frame: 10 } ]
        });

        this.scene.anims.create({
            key: 'right-down',
            frames: [ { key: 'player', frame: 11 } ]
        });
    
        this.sprite.anims.play('right', true);

        this.invincibleTween = this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 5,
            paused: true
        })
    }

    update() {
        if (Date.now() < this.playerDisabledUntil) {
            if (this.playerPassiveVelocity.x !== 0 || this.playerPassiveVelocity.y !== 0) {
                this.sprite.setVelocity(this.playerPassiveVelocity.x, this.playerPassiveVelocity.y)
                this.playerPassiveVelocity = new Phaser.Math.Vector2(0, 0)
            }
            return;
        } else if (this.moving) {
            this.sprite.setVelocityX(this.facing > 0 ? 160 : -160);
            this.sprite.anims.play(this.facing > 0 ? 'right' : 'left', true);    
        } else {
            this.sprite.setVelocityX(0);
            if (this.lookingUp > 0) {
                this.sprite.anims.play(`${this.facing < 0 ? 'left' : 'right'}-up`, true);
            } else if (this.lookingUp < 0) {
                this.sprite.anims.play(`${this.facing < 0 ? 'left' : 'right'}-down`, true);
            } else {
                this.sprite.anims.play(this.facing < 0 ? 'left' : 'right', true);
                this.sprite.anims.stop();
            }
        }
    }

    getLives(): number {
        return this.lives
    }

    getSprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
        return this.sprite
    }

    getFacing(): number {
        return this.facing
    }

    getLookingUp(): number {
        return this.lookingUp
    }

    jump() {
        if (this.sprite.body.blocked.down) {
            this.sprite.setVelocityY(-280);
        }
    }

    lookUp() {
        this.lookingUp = +1
    }
    
    lookDown() {
        this.lookingUp = -1
    }

    lookForward() {
        this.lookingUp = 0
    }

    moveLeft() {
        this.facing = -1
        this.moving = true
    }

    moveRight() {
        this.facing = +1
        this.moving = true
    }

    stopMoving() {
        this.moving = false
    }

    passivePush(vx: number, vy: number) {
        this.playerPassiveVelocity = new Phaser.Math.Vector2(vx, vy)
        this.playerDisabledUntil = Date.now() + 400;
    }

    hurt() {
        if (Date.now() > this.playerInvincibleUntil) {
            this.playerInvincibleUntil = Date.now() + 1000;

            if (!this.alwaysInvincible && this.lives > 0) {
                this.lives--
            }

            this.invincibleTween.resume()
            this.invincibleTween.restart()
        }
    }

    setInvincible(invincible: boolean) {
        this.alwaysInvincible = invincible
    }

}