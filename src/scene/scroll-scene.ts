import 'phaser'
import VirtualJoystick from 'phaser3-rex-plugins/plugins/virtualjoystick.js'
import worldMapData from '../assets/terrain/world1.json';
import Textures from './textures';'./textures'
import { SceneNames } from './scene-names';
import Player from '../character/player';

const TILE_SIZE = 32
const GRASS_INDICES = [90]
const TNT_INDEX = 9
const LAVA_INDEX = 238
const CHEST_INDEX = 28
const STONE_INDEX = 2
const TILE_TYPE_EMPTY = 1
const TILE_TYPE_SOFT = 2
const TILE_TYPE_HARD = 4

export default class ScrollScene extends Phaser.Scene {

    private backgroundImage: Phaser.GameObjects.Image
    private tilemap: Phaser.Tilemaps.Tilemap
    private tileset: Phaser.Tilemaps.Tileset
    private worldWidth: number
    private worldHeight: number
    private terrainLayer: Phaser.Tilemaps.TilemapLayer
    private player: Player
    private playerLiveImages: Phaser.GameObjects.Image[]
    private shouldSpreadLavaAfter: number
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
    private buttonJump: boolean
    private buttonPut: boolean
    private buttonBreak: boolean
    private puttingTile: boolean
    private breakingTile: boolean
    private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
        super(SceneNames.SCROLL_GAME)
        this.player = new Player(this)
    }

    preload() {
        this.load.image('sky', Textures.skyImage)
        this.player.preload()
        this.load.tilemapTiledJSON('worldMap', worldMapData);
        this.load.image('terrainTexture', Textures.terrainTexture);
        this.load.image('explosionEffectImage', Textures.explosionEffectImage);
        this.load.image('heartImage', Textures.heartImage);
        this.load.image('cubeImage', Textures.cubeImage);
        this.load.image('pickaxeImage', Textures.pickaxeImage);
        this.load.bitmapFont('atari', Textures.fontAtariImage, Textures.fontAtariMetadata);
    }
    
    create() {
        this.shouldSpreadLavaAfter = 0
        this.gotChest = false
        this.puttingTile = false
        this.breakingTile = false

        this.tilemap = this.make.tilemap({ key: 'worldMap' });
        this.tileset = this.tilemap.addTilesetImage('terrain', 'terrainTexture');
        this.worldWidth = this.tilemap.width * this.tileset.tileWidth
        this.worldHeight = this.tilemap.height * this.tileset.tileHeight

        this.add.graphics().fillStyle(0xadc8ff).fillRect(0, 0, this.worldWidth, this.worldHeight).setScrollFactor(0)

        // to be re-scaled in handleCanvasResize()
        this.backgroundImage = this.add.image(0, 0, 'sky').setOrigin(0, 0)
    
        this.terrainLayer = this.tilemap.createLayer('World1', this.tileset, 0, 0).setScale(1).setCollisionByExclusion([-1, ...GRASS_INDICES, LAVA_INDEX]);

        this.player.init()

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)    

        this.explosionEmitter = this.add.particles('explosionEffectImage').createEmitter({
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0.0 },
            alpha: 0.1,
            blendMode: Phaser.BlendModes.ADD,
            active: false,
            lifespan: 500,
            gravityY: 200
        });;

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
            console.log(pointer, gameObject, event)
            if (gameObject == this.jumpButtonCircle) {
                this.buttonJump = true
            } else if (gameObject == this.putButtonCircle) {
                this.buttonPut = true
            } else if (gameObject == this.breakButtonCircle) {
                this.buttonBreak = true
            }
        });
    
        this.input.on('gameobjectup', (pointer: any, gameObject: any, event: any) => {
            console.log(pointer, gameObject, event)
            if (gameObject == this.jumpButtonCircle) {
                this.buttonJump = false
            } else if (gameObject == this.putButtonCircle) {
                this.buttonPut = false
            } else if (gameObject == this.breakButtonCircle) {
                this.buttonBreak = false
            } 
        });

        this.physics.add.collider(this.player.getSprite(), this.terrainLayer);
        this.terrainLayer.setTileIndexCallback(TNT_INDEX, this.touchTnt, this);
        this.terrainLayer.setTileIndexCallback(LAVA_INDEX, this.touchLava, this);
        this.terrainLayer.setTileIndexCallback(CHEST_INDEX, this.touchChest, this);

        this.add.bitmapText(8, 8, 'atari', '2D Craft').setOrigin(0).setScale(0.4).setScrollFactor(0);

        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.player.getSprite());

        this.scale.on('resize', this.handleCanvasResize, this);
        this.handleCanvasResize()
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

        if (Date.now() > this.shouldSpreadLavaAfter) {
            this.spreadLava();
        }

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

        if (pressedPut && !this.puttingTile) {
            let tile;
            if (this.player.getLookingUp() < 0) {
                let pos = this.player.getSprite().getBottomCenter()
                tile = this.findTileToInteract(pos.x, pos.y, TILE_TYPE_EMPTY | TILE_TYPE_SOFT, TILE_SIZE/2, 0);
            } else if (this.player.getLookingUp() > 0) {
                let pos = this.player.getSprite().getTopCenter()
                tile = this.findTileToInteract(pos.x, pos.y - TILE_SIZE/2, TILE_TYPE_EMPTY | TILE_TYPE_SOFT, TILE_SIZE, TILE_SIZE/2);
            } else if (this.player.getFacing() < 0) {
                let pos = this.player.getSprite().getLeftCenter()
                tile = this.findTileToInteract(pos.x - TILE_SIZE/2, this.player.getSprite().getBounds().centerY - TILE_SIZE*0, TILE_TYPE_EMPTY | TILE_TYPE_SOFT, 0, TILE_SIZE/2);
            } else if (this.player.getFacing() > 0) {
                let pos = this.player.getSprite().getRightCenter()
                tile = this.findTileToInteract(pos.x + TILE_SIZE/2, this.player.getSprite().getBounds().centerY - TILE_SIZE*0, TILE_TYPE_EMPTY | TILE_TYPE_SOFT, 0, TILE_SIZE/2);
            }
            if (tile) {
                this.terrainLayer.putTileAt(STONE_INDEX, tile.x, tile.y)
                this.puttingTile = true
            }
        } else if (!pressedPut) {
            this.puttingTile = false
        }

        if (pressedBreak && !this.breakingTile) {
            let tile;
            if (this.player.getLookingUp() < 0) {
                let pos = this.player.getSprite().getBottomCenter()
                tile = this.findTileToInteract(pos.x, pos.y, TILE_TYPE_SOFT | TILE_TYPE_HARD, TILE_SIZE/2, 0);
            } else if (this.player.getLookingUp() > 0) {
                let pos = this.player.getSprite().getTopCenter()
                tile = this.findTileToInteract(pos.x, pos.y - TILE_SIZE/2, TILE_TYPE_SOFT | TILE_TYPE_HARD, TILE_SIZE, TILE_SIZE/2);
            } else if (this.player.getFacing() < 0) {
                let pos = this.player.getSprite().getLeftCenter()
                tile = this.findTileToInteract(pos.x - TILE_SIZE/2, this.player.getSprite().getBounds().centerY - TILE_SIZE/2, TILE_TYPE_SOFT | TILE_TYPE_HARD, 0, TILE_SIZE/2);
            } else if (this.player.getFacing() > 0) {
                let pos = this.player.getSprite().getRightCenter()
                tile = this.findTileToInteract(pos.x + TILE_SIZE/2, this.player.getSprite().getBounds().centerY - TILE_SIZE/2, TILE_TYPE_SOFT | TILE_TYPE_HARD, 0, TILE_SIZE/2);
            }
            if (tile) {
                this.breakTile(tile.x, tile.y)
                this.breakingTile = true;
            }
        } else if (!pressedBreak) {
            this.breakingTile = false;
        }
    }

    private handleCanvasResize() {
        const canvasWidth = this.sys.game.canvas.width
        const canvasHeight = this.sys.game.canvas.height

        const backgroundScale = canvasWidth / this.backgroundImage.width
        this.backgroundImage.setScale(backgroundScale * 1.1, 1).setScrollFactor(canvasWidth * 0.1 / this.worldWidth, 0);

        for (let i = 0; i < this.playerLiveImages.length; i++) {
            this.playerLiveImages[i].setPosition(canvasWidth - 20 - 30 * i, 20)
        }

        this.joystick.setPosition(90, canvasHeight - 90)    // 30 margin + 60 base radius
        this.jumpButtonCircle.setPosition(canvasWidth - 190, canvasHeight - 60)
        this.putButtonCircle.setPosition(canvasWidth - 130, canvasHeight - 100)
        this.putButtonImage.setPosition(canvasWidth - 130, canvasHeight - 100)
        this.breakButtonCircle.setPosition(canvasWidth - 60, canvasHeight - 110)    // 30 margin + 30 radius
        this.breakButtonImage.setPosition(canvasWidth - 60, canvasHeight - 110)
    }

    private spreadLava() {
        let tile: Phaser.Tilemaps.Tile
        let newLavaLocations: Phaser.Math.Vector2[] = []
        for (let i = 0; tile = this.terrainLayer.findByIndex(LAVA_INDEX, i); i++) {
            // if it is falling, don't spread horizontally
            if (this.canSpreadLavaTo(tile.x, tile.y + 1)) {
                newLavaLocations.push(new Phaser.Math.Vector2(tile.x, tile.y + 1))
            } else {
                // spread horizontally, but avoid spreading like firewall
                if (this.canSpreadLavaTo(tile.x - 1, tile.y)) {
                    newLavaLocations.push(new Phaser.Math.Vector2(tile.x - 1, tile.y))
                }
                if (this.canSpreadLavaTo(tile.x + 1, tile.y)) {
                    newLavaLocations.push(new Phaser.Math.Vector2(tile.x + 1, tile.y))
                }
            }
        }

        if (newLavaLocations.length > 0) {
            for (let location of newLavaLocations) {
                this.terrainLayer.putTileAt(LAVA_INDEX, location.x, location.y, false)
            }
            this.shouldSpreadLavaAfter = Date.now() + 1000
        } else {
            this.shouldSpreadLavaAfter = Infinity
        }
    }

    private canSpreadLavaTo(x: number, y: number) {
        if (x < 0 || x >= this.tilemap.width || y < 0 || y >= this.tilemap.height) {
            return false
        }

        let tile = this.terrainLayer.getTileAt(x, y)
        if (!tile) {
            return true
        }
        
        if (GRASS_INDICES.includes(tile.index)) {
            return true
        } else {
            return false
        }
    }

    private findTileToInteract(worldX: number, worldY: number, tileType: number, toleranceX: number, toleranceY: number): Phaser.Tilemaps.Tile {
        let tiles: Phaser.Tilemaps.Tile[] = []
        const x0 = Math.floor((worldX - toleranceX) / TILE_SIZE)
        const y0 = Math.floor((worldY - toleranceY) / TILE_SIZE)
        const x1 = Math.floor((worldX + toleranceX) / TILE_SIZE)
        const y1 = Math.floor((worldY + toleranceY) / TILE_SIZE)
        for (let i = x0; i <= x1; i++) {
            for (let j = y0; j <= y1; j++) {
                let tile = this.terrainLayer.getTileAt(i, j, true)
                if (this.testTileForType(tile, tileType)) {
                    tiles.push(tile)
                }
            }
        }
        let distances = tiles.map(tile => Math.abs(tile.getCenterX() - worldX) + Math.abs(tile.getCenterY() - worldY))
        let index = distances.indexOf(Math.min(...distances))
        return index != -1 ? tiles[index] : null
    }

    private testTileForType(tile: Phaser.Tilemaps.Tile, tileType: number) {
        if (tile == null || tile.index === -1) {
            if (tileType & TILE_TYPE_EMPTY) {
                if (this.testCollionWithImaginaryTile(tile)) {
                    return false
                }
                return true
            } else {
                return false
            }
        } else if (GRASS_INDICES.includes(tile.index)) {
            return tileType & TILE_TYPE_SOFT
        } else {
            return tileType & TILE_TYPE_HARD
        }
    }

    private testCollionWithImaginaryTile(tile: Phaser.Tilemaps.Tile): boolean {
        // this.physics.world.collideTiles with imaginary tile (index -1) doesn't work
        // this.physics.overlapTiles is too strict
        const bound = this.player.getSprite().getBounds()
        if (bound.bottom <= tile.y * TILE_SIZE || bound.top >= (tile.y + 1) * TILE_SIZE ||
            bound.centerX <= tile.x * TILE_SIZE || bound.centerX >= (tile.x + 1) * TILE_SIZE) {
            return false;
        }
        return true
    }

    private breakTile(x: number, y: number) {
        // remove with replaceWithNull false, so that getTileAt() can still be used later
        this.terrainLayer.removeTileAt(x, y, false)

        let upperTile = this.terrainLayer.getTileAt(x, y - 1)
        if (upperTile && GRASS_INDICES.includes(upperTile.index)) {
            this.terrainLayer.removeTileAt(upperTile.x, upperTile.y, false)
        }
        this.shouldSpreadLavaAfter = Math.min(Date.now() + 1000, this.shouldSpreadLavaAfter)
    }

    private touchTnt(spirit: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) {
        this.explosionEmitter.resume();
        this.explosionEmitter.explode(10, tile.getCenterX(), tile.getCenterY());
        this.breakTile(tile.x, tile.y)
        this.breakTile(tile.x - 1, tile.y)
        this.breakTile(tile.x + 1, tile.y)
        this.breakTile(tile.x, tile.y - 1)
        this.breakTile(tile.x, tile.y + 1)  
        Math.random() > 0.8 || this.breakTile(tile.x - 1, tile.y - 1)
        Math.random() > 0.8 || this.breakTile(tile.x - 1, tile.y + 1)
        Math.random() > 0.8 || this.breakTile(tile.x + 1, tile.y - 1)
        Math.random() > 0.8 || this.breakTile(tile.x + 1, tile.y + 1)
        Math.random() > 0.2 || this.breakTile(tile.x - 2, tile.y)
        Math.random() > 0.2 || this.breakTile(tile.x + 2, tile.y)
        Math.random() > 0.2 || this.breakTile(tile.x, tile.y - 2)
        Math.random() > 0.2 || this.breakTile(tile.x, tile.y + 2)
        let pos = this.player.getSprite().getCenter()
        let vx = Math.sign(pos.x - tile.getCenterX()) * 100;
        let vy = Math.sign(pos.y - tile.getCenterY()) * 100;
        this.player.passivePush(vx, vy)
        this.player.hurt()
    }

    private touchLava(spirit: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) {
        this.player.hurt()
    }

    private touchChest(spirit: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) {
        this.gotChest = true;
    }

}