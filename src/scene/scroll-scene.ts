import 'phaser'
import VirtualJoystick from 'phaser3-rex-plugins/plugins/virtualjoystick.js'
import Resources from './resources'
import { SceneNames } from './scene-names';
import Player from '../character/player';
import TilemapWorld from '../world/tilemap-world'
import { TileType } from '../world/tile-type';
import Zombie from '../character/zombie';
import SettingsService from '../settings/settings-service';
import Settings from '../settings/settings';

export default class ScrollScene extends Phaser.Scene {

    private settingsService: SettingsService
    private settings: Settings
    private backgroundImage: Phaser.GameObjects.Image
    private world: TilemapWorld
    private player: Player
    private zombies: Zombie[]
    private playerLiveImages: Phaser.GameObjects.Image[]
    private gotChest: boolean
    private keyUp: Phaser.Input.Keyboard.Key
    private keyLeft: Phaser.Input.Keyboard.Key
    private keyDown: Phaser.Input.Keyboard.Key
    private keyRight: Phaser.Input.Keyboard.Key
    private keyJump: Phaser.Input.Keyboard.Key
    private keyPut: Phaser.Input.Keyboard.Key
    private keyBreak: Phaser.Input.Keyboard.Key
    private joystick: VirtualJoystick
    private jumpButtonCircle: Phaser.GameObjects.Arc
    private putButtonCircle: Phaser.GameObjects.Arc
    private breakButtonCircle: Phaser.GameObjects.Arc
    private putButtonImage: Phaser.GameObjects.Image
    private breakButtonImage: Phaser.GameObjects.Image
    private pauseButtonImage: Phaser.GameObjects.Image
    private buttonJump: boolean
    private buttonPut: boolean
    private buttonBreak: boolean
    private puttingTile: boolean
    private breakingTile: boolean

    constructor() {
        super(SceneNames.SCROLL_GAME)
        this.settingsService = new SettingsService()
        this.world = new TilemapWorld(this)
        this.player = new Player(this)
    }

    preload() {
        this.load.image('sky', Resources.skyImage)
        this.world.preload()
        this.player.preload()
        Zombie.preload(this)
        this.load.image('explosionEffectImage', Resources.explosionEffectImage);
        this.load.image('heartImage', Resources.heartImage);
        this.load.image('cubeImage', Resources.cubeImage);
        this.load.image('pickaxeImage', Resources.pickaxeImage);
        this.load.image('pauseImage', Resources.pauseImage)
        this.load.bitmapFont('atari', Resources.fontAtariImage, Resources.fontAtariMetadata);
    }
    
    create() {
        this.settings = this.settingsService.getSettings()
        this.gotChest = false
        this.buttonJump = false
        this.buttonPut = false
        this.buttonBreak = false
        this.puttingTile = false
        this.breakingTile = false
        this.zombies = []

        const backgroundExtend = this.add.graphics().setScrollFactor(0)

        // to be re-scaled in handleCanvasResize()
        this.backgroundImage = this.add.image(0, 0, 'sky').setOrigin(0, 0)

        this.world.init()
        this.player.init(100, 300)
        this.world.addCharacter(this.player)
        this.world.addObjectTouchedCallback(TileType.CHEST, this.touchChest.bind(this));
        this.spawnZombies()

        this.physics.world.setBounds(0, 0, this.world.getWidth(), this.world.getHeight())
        backgroundExtend.fillStyle(0xadc8ff).fillRect(0, 0, this.world.getWidth(), this.world.getHeight())

        this.playerLiveImages = []
        for (let i = Player.MAX_LIVES; i > 0; i--) {
            // to be re-positioned in handleCanvasResize()
            let image = this.add.image(0, 0, 'heartImage').setScale(0.1).setScrollFactor(0);
            this.playerLiveImages.push(image)
        }

        // this.cursors = this.input.keyboard.createCursorKeys();
        this.keyUp = this.input.keyboard.addKey('w')
        this.keyLeft = this.input.keyboard.addKey('a')
        this.keyDown = this.input.keyboard.addKey('s')
        this.keyRight = this.input.keyboard.addKey('d')
        this.keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        this.keyPut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA)
        this.keyBreak = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD)

        // to be re-positioned
        this.joystick = new VirtualJoystick(this, {
            x: 0,
            y: 0,
            radius: 60,
            base: this.add.circle(0, 0, 60, 0x888888, 0.50),
            thumb: this.add.circle(0, 0, 30, 0xcccccc, 0.75),
            dir: '4dir'
        })
        this.jumpButtonCircle = this.add.circle(0, 0, 30, 0xcccccc, 0.75).setScrollFactor(0).setInteractive()
        this.putButtonCircle = this.add.circle(0, 0, 30, 0xcccccc, 0.75).setScrollFactor(0).setInteractive()
        this.putButtonImage = this.add.image(0, 0, 'cubeImage').setScale(0.1).setAlpha(0.50).setScrollFactor(0)
        this.breakButtonCircle = this.add.circle(0, 0, 30, 0xcccccc, 0.75).setScrollFactor(0).setInteractive()
        this.breakButtonImage = this.add.image(0, 0, 'pickaxeImage').setScale(0.1).setAlpha(0.50).setScrollFactor(0)

        this.input.on('gameobjectdown', (pointer: any, gameObject: any, event: any) => {
            if (gameObject == this.jumpButtonCircle) {
                this.buttonJump = true
            } else if (gameObject == this.putButtonCircle) {
                this.buttonPut = true
            } else if (gameObject == this.breakButtonCircle) {
                this.buttonBreak = true
            } else if (gameObject == this.pauseButtonImage) {
                this.scene.pause()
                this.scene.run(SceneNames.SETTINGS)
            }
        });
    
        const gameobjectupHandler = (pointer: any, gameObject: any, event: any) => {
            if (gameObject == this.jumpButtonCircle) {
                this.buttonJump = false
            } else if (gameObject == this.putButtonCircle) {
                this.buttonPut = false
            } else if (gameObject == this.breakButtonCircle) {
                this.buttonBreak = false
            } 
        }
        this.input.on('gameobjectup', gameobjectupHandler)
        this.input.on('gameobjectout', gameobjectupHandler)

        this.add.bitmapText(8, 8, 'atari', '2D Craft').setOrigin(0).setScale(0.4).setScrollFactor(0);
        this.pauseButtonImage = this.add.image(0, 0, 'pauseImage').setOrigin(0.5, 0).setScale(0.125).setScrollFactor(0).setInteractive()

        this.cameras.main.setBounds(0, 0, this.world.getWidth(), this.world.getHeight());
        this.cameras.main.startFollow(this.player.getSprite());

        this.scale.on('resize', this.handleCanvasResize, this);
        this.handleCanvasResize()

        this.events.on('resume', () => {
            // reload settings in case modified
            this.settings = this.settingsService.getSettings()
            this.applySettings()
        })
        this.applySettings()
    }

    update() {
        if (this.gotChest) {
            this.scene.pause();
            this.scene.run(SceneNames.WINNING);
        } else if (this.player.getLives() === 0) {
            // let animations run for a while
            this.time.delayedCall(200, () => {
                this.scene.pause();
                this.scene.run(SceneNames.GAMEOVER);
            })
        }

        for (let i = 0; i < this.playerLiveImages.length; i++) {
            this.playerLiveImages[i].setAlpha(i >= this.player.getLives() ? 0.2 : 1)
        }

        this.world.update()

        const pressedUp = this.keyUp.isDown || this.joystick.up
        const pressedDown = this.keyDown.isDown || this.joystick.down
        const pressedLeft = this.keyLeft.isDown || this.joystick.left
        const pressedRight = this.keyRight.isDown || this.joystick.right
        const pressedJump = this.keyJump.isDown || this.buttonJump
        const pressedPut = this.keyPut.isDown || this.buttonPut
        const pressedBreak = this.keyBreak.isDown || this.buttonBreak

        if (pressedUp) {
            this.player.lookUp()
        } else if (pressedDown) {
            this.player.lookDown()
        } else {
            this.player.lookForward()
        }

        if (pressedLeft) {
            this.player.moveLeft()
        } else if (pressedRight) {
            this.player.moveRight()
        } else {
            this.player.stopMoving()
        } 
        
        if (pressedJump) {
            this.player.jump()
        }

        this.player.update()
        this.zombies.forEach(z => z.update())
        
        const tileSize = this.world.getTileSize()

        if (pressedPut && !this.puttingTile) {
            if (this.player.getLookingUp() < 0) {
                let pos = this.player.getSprite().getBottomCenter()
                this.puttingTile = this.world.putObject(TileType.STONE, pos.x, pos.y, tileSize/2, 0);
            } else if (this.player.getLookingUp() > 0) {
                let pos = this.player.getSprite().getTopCenter()
                this.puttingTile = this.world.putObject(TileType.STONE, pos.x, pos.y - tileSize/2, tileSize, tileSize/2);
            } else if (this.player.getFacing() < 0) {
                let pos = this.player.getSprite().getLeftCenter()
                this.puttingTile = this.world.putObject(TileType.STONE, pos.x - tileSize/2, this.player.getSprite().getBounds().centerY, 0, tileSize/2);
            } else if (this.player.getFacing() > 0) {
                let pos = this.player.getSprite().getRightCenter()
                this.puttingTile = this.world.putObject(TileType.STONE, pos.x + tileSize/2, this.player.getSprite().getBounds().centerY, 0, tileSize/2);
            }
        } else if (!pressedPut) {
            this.puttingTile = false
        }

        if (pressedBreak && !this.breakingTile) {
            if (this.player.getLookingUp() < 0) {
                let pos = this.player.getSprite().getBottomCenter()
                this.breakingTile = this.world.breakObject(pos.x, pos.y, tileSize/2, 0);
            } else if (this.player.getLookingUp() > 0) {
                let pos = this.player.getSprite().getTopCenter()
                this.breakingTile = this.world.breakObject(pos.x, pos.y - tileSize/2, tileSize, tileSize/2);
            } else if (this.player.getFacing() < 0) {
                let pos = this.player.getSprite().getLeftCenter()
                this.breakingTile = this.world.breakObject(pos.x - tileSize/2, this.player.getSprite().getBounds().centerY - tileSize/2, 0, tileSize/2);
            } else if (this.player.getFacing() > 0) {
                let pos = this.player.getSprite().getRightCenter()
                this.breakingTile = this.world.breakObject(pos.x + tileSize/2, this.player.getSprite().getBounds().centerY - tileSize/2, 0, tileSize/2);
            }
        } else if (!pressedBreak) {
            this.breakingTile = false;
        }
    }

    private applySettings() {
        if (this.settings.peacefulMode) {
            this.player.setInvincible(true)
            this.playerLiveImages.forEach(i => i.setVisible(false))
            this.zombies.forEach(z => z.randomWalk())
        } else {
            this.player.setInvincible(false)
            this.playerLiveImages.forEach(i => i.setVisible(true))
            this.zombies.forEach(z => z.chaseAfter(this.player, 300))
        }
    }

    private spawnZombies() {
        for (const tile of this.world.findObjects(TileType.RED_CLOTH)) {
            this.world.breakObject(tile.getCenterX(), tile.getCenterY(), 0, 0)
            
            const zombie = new Zombie(this)
            zombie.init(this.world, tile.getCenterX(), tile.getCenterY())
            this.world.addCharacter(zombie)
            this.physics.add.collider(this.player.getSprite(), zombie.getSprite())
            this.zombies.forEach(z => this.physics.add.collider(zombie.getSprite(), z.getSprite()))            
            
            this.zombies.push(zombie)
        }
    }

    private handleCanvasResize() {
        const canvasWidth = this.sys.game.canvas.width
        const canvasHeight = this.sys.game.canvas.height

        const backgroundScale = canvasWidth / this.backgroundImage.width
        this.backgroundImage.setScale(backgroundScale * 1.1, 1).setScrollFactor(canvasWidth * 0.1 / this.world.getWidth(), 0);

        for (let i = 0; i < this.playerLiveImages.length; i++) {
            this.playerLiveImages[i].setPosition(canvasWidth - 20 - 30 * i, 20)
        }

        this.joystick.setPosition(90, canvasHeight - 90)    // 30 margin + 60 base radius
        this.jumpButtonCircle.setPosition(canvasWidth - 190, canvasHeight - 60)
        this.putButtonCircle.setPosition(canvasWidth - 130, canvasHeight - 100)
        this.putButtonImage.setPosition(canvasWidth - 130, canvasHeight - 100)
        this.breakButtonCircle.setPosition(canvasWidth - 60, canvasHeight - 110)    // 30 margin + 30 radius
        this.breakButtonImage.setPosition(canvasWidth - 60, canvasHeight - 110)

        this.pauseButtonImage.setPosition(canvasWidth / 2, 0)
    }

    private touchChest(spirit: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) {
        this.gotChest = true;
    }

}