import 'phaser'
import worldMapData from '../assets/terrain/world1.json';
import Textures from './textures';'./textures'
import { SceneNames } from './scene-names';

const TILE_SIZE = 32
const GRASS_INDICES = [90]
const TNT_INDEX = 9
const LAVA_INDEX = 238
const CHEST_INDEX = 28
const STONE_INDEX = 2
const MAX_LIVES = 3
const INIT_LIVES = 3
const WORLD_WIDTH = 3200
const WORLD_HEIGHT = 600

export default class ScrollScene extends Phaser.Scene {

    private tilemap: Phaser.Tilemaps.Tilemap
    private terrainLayer: Phaser.Tilemaps.TilemapLayer
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    private playerLives: number
    private playerLiveImages: Phaser.GameObjects.Image[]
    private playerDisabledUntil: number
    private playerInvincibleUntil: number
    private playerPassiveVelocity: Phaser.Math.Vector2
    private shouldSpreadLavaAfter: number
    private gotChest: boolean
    private keyUp: Phaser.Input.Keyboard.Key
    private keyLeft: Phaser.Input.Keyboard.Key
    private keyDown: Phaser.Input.Keyboard.Key
    private keyRight: Phaser.Input.Keyboard.Key
    private keyJump: Phaser.Input.Keyboard.Key
    private keyPut: Phaser.Input.Keyboard.Key
    private keyBreak: Phaser.Input.Keyboard.Key
    private facing: number
    private puttingTile: boolean
    private breakingTile: boolean
    private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
        super(SceneNames.SCROLL_GAME)
    }

    preload() {
        this.load.image('sky', Textures.skyImage)
        this.load.spritesheet('player', Textures.alexSprite, { frameWidth: 200, frameHeight: 288 });
        this.load.tilemapTiledJSON('worldMap', worldMapData);
        this.load.image('terrainTexture', Textures.terrainTexture);
        this.load.image('explosionEffectImage', Textures.explosionEffectImage);
        this.load.image('heartImage', Textures.heartImage);
        this.load.bitmapFont('atari', Textures.fontAtariImage, Textures.fontAtariMetadata);
    }
    
    create() {
        this.playerLives = INIT_LIVES
        this.playerDisabledUntil = 0
        this.playerInvincibleUntil = 0
        this.playerPassiveVelocity = new Phaser.Math.Vector2(0,0)
        this.shouldSpreadLavaAfter = 0
        this.gotChest = false
        this.facing = +1
        this.puttingTile = false
        this.breakingTile = false

        this.cameras.main.setBackgroundColor('#adc8ff')
        this.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0.02, 0);
    
        this.tilemap = this.make.tilemap({ key: 'worldMap' });
        const tileset1 = this.tilemap.addTilesetImage('terrain', 'terrainTexture');
        this.terrainLayer = this.tilemap.createLayer('World1', tileset1, 0, 0).setScale(1).setCollisionByExclusion([-1, ...GRASS_INDICES, LAVA_INDEX]);

        this.player = this.physics.add.sprite(100, 300, 'player').setSize(90, 260).setScale(0.2);
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
        this.player.setCollideWorldBounds(true);
    
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.anims.create({
            key: 'left-up',
            frames: [ { key: 'player', frame: 8 } ]
        });

        this.anims.create({
            key: 'left-down',
            frames: [ { key: 'player', frame: 9 } ]
        });

        this.anims.create({
            key: 'right-up',
            frames: [ { key: 'player', frame: 10 } ]
        });

        this.anims.create({
            key: 'right-down',
            frames: [ { key: 'player', frame: 11 } ]
        });
    
        this.player.anims.play('right', true);

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
        for (let i = MAX_LIVES; i > 0; i--) {
            let image = this.add.image(this.sys.game.canvas.width + 10 - 30 * i, 20, 'heartImage').setScale(0.1).setScrollFactor(0);
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

        this.physics.add.collider(this.player, this.terrainLayer);
        this.terrainLayer.setTileIndexCallback(TNT_INDEX, this.touchTnt, this);
        this.terrainLayer.setTileIndexCallback(LAVA_INDEX, this.touchLava, this);
        this.terrainLayer.setTileIndexCallback(CHEST_INDEX, this.touchChest, this);

        this.add.bitmapText(8, 8, 'atari', '2D Craft').setOrigin(0).setScale(0.4).setScrollFactor(0);

        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.startFollow(this.player);
    }
    
    update() {
        if (this.gotChest) {
            this.scene.pause();
            this.scene.run(SceneNames.WINNING);
        } else if (this.playerLives === 0) {
            // let animations run for a while
            this.time.delayedCall(200, () => {
                this.scene.pause();
                this.scene.run(SceneNames.GAMEOVER);
            })
        }

        for (let i = 0; i < this.playerLiveImages.length; i++) {
            this.playerLiveImages[i].setAlpha(i >= this.playerLives ? 0.2 : 1)
        }
        if (Date.now() < this.playerDisabledUntil) {
            if (this.playerPassiveVelocity.x !== 0 || this.playerPassiveVelocity.y !== 0) {
                this.player.setVelocity(this.playerPassiveVelocity.x, this.playerPassiveVelocity.y)
                this.playerPassiveVelocity = new Phaser.Math.Vector2(0, 0)
            }
            return;
        }

        if (Date.now() > this.shouldSpreadLavaAfter) {
            this.spreadLava();
        }

        if (this.keyJump.isDown && this.player.body.blocked.down) {
            this.player.setVelocityY(-280);   
        }

        if (this.keyLeft.isDown) {
            this.facing = -1
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.keyRight.isDown) {
            this.facing = +1
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            if (this.keyUp.isDown) {
                this.player.anims.play(`${this.facing < 0 ? 'left' : 'right'}-up`, true);
            } else if (this.keyDown.isDown) {
                this.player.anims.play(`${this.facing < 0 ? 'left' : 'right'}-down`, true);
            } else if (this.player.body.blocked.down) {
                this.player.anims.play(this.facing < 0 ? 'left' : 'right', true);
                this.player.anims.stop();
            }
        } 
        
        if (this.keyPut.isDown && !this.puttingTile) {
            if (this.facing === -1) {
                let pos = this.player.getLeftCenter()
                pos.x -= TILE_SIZE/2
                let x = Math.floor(pos.x / TILE_SIZE)
                let y = Math.floor(pos.y / TILE_SIZE)
                let tile = this.terrainLayer.getTileAt(x, y)
                if (!tile || GRASS_INDICES.includes(tile.index)) {
                    this.terrainLayer.putTileAt(STONE_INDEX, x, y)
                }
            } else if (this.facing === 1) {
                let pos = this.player.getRightCenter()
                pos.x += TILE_SIZE/2
                let x = Math.floor(pos.x / TILE_SIZE)
                let y = Math.floor(pos.y / TILE_SIZE)
                let tile = this.terrainLayer.getTileAt(x, y)
                if (!tile || GRASS_INDICES.includes(tile.index)) {
                    this.terrainLayer.putTileAt(STONE_INDEX, x, y)
                }
            }
            this.puttingTile = true
        } else if (this.keyPut.isUp) {
            this.puttingTile = false
        }

        if (this.keyBreak.isDown && !this.breakingTile) {
            let tile;
            if (this.keyDown.isDown) {
                let pos = this.player.getBottomCenter()
                tile = this.findTileToInteract(pos.x, pos.y, TILE_SIZE/2, 0);
            } else if (this.keyUp.isDown) {
                let pos = this.player.getTopCenter()
                tile = this.findTileToInteract(pos.x, pos.y - TILE_SIZE/2, TILE_SIZE, TILE_SIZE/2);
            } else if (this.facing === -1) {
                let pos = this.player.getLeftCenter()
                tile = this.findTileToInteract(pos.x - TILE_SIZE/2, this.player.getBounds().centerY - TILE_SIZE/4, 0, TILE_SIZE/2);
            } else if (this.facing === 1) {
                let pos = this.player.getRightCenter()
                tile = this.findTileToInteract(pos.x + TILE_SIZE/2, this.player.getBounds().centerY - TILE_SIZE/4, 0, TILE_SIZE/2);
            }

            if (tile) {
                this.breakTile(tile.x, tile.y)
                this.breakingTile = true;
            }
        } else if (this.keyBreak.isUp) {
            this.breakingTile = false;
        }
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

    private findTileToInteract(worldX: number, worldY: number, toleranceX: number, toleranceY: number): Phaser.Tilemaps.Tile {
        let tiles: Phaser.Tilemaps.Tile[] = []
        for (let i = worldX - toleranceX; i <= worldX + toleranceX + 0.1; i += TILE_SIZE) {
            for (let j = worldY - toleranceY; j <= worldY + toleranceY + 0.1; j += TILE_SIZE) {
                let tile = this.terrainLayer.getTileAtWorldXY(i, j)
                if (tile) {
                    tiles.push(tile)
                }
            }
        }
        let distances = tiles.map(tile => Math.abs(tile.getCenterX() - worldX) + Math.abs(tile.getCenterY() - worldY))
        let index = distances.indexOf(Math.min(...distances))
        return index != -1 ? tiles[index] : null
    }

    private breakTile(x: number, y: number) {
        this.terrainLayer.removeTileAt(x, y)

        let upperTile = this.terrainLayer.getTileAt(x, y - 1)
        if (upperTile && GRASS_INDICES.includes(upperTile.index)) {
            this.terrainLayer.removeTileAt(upperTile.x, upperTile.y)
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
        let pos = this.player.getCenter()
        let vx = Math.sign(pos.x - tile.getCenterX()) * 100;
        let vy = Math.sign(pos.y - tile.getCenterY()) * 100;
        this.playerPassiveVelocity = new Phaser.Math.Vector2(vx, vy)
        this.playerDisabledUntil = Date.now() + 400;
        this.hurtPlayer()
    }

    private touchLava(spirit: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) {
        this.hurtPlayer()
    }

    private touchChest(spirit: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) {
        this.gotChest = true;
    }

    private hurtPlayer() {
        if (Date.now() > this.playerInvincibleUntil) {
            this.playerInvincibleUntil = Date.now() + 1000;
            if (this.playerLives > 0) {
                this.playerLives--
            }

            this.tweens.add({
                targets: this.player,
                alpha: 0,
                duration: 100,
                yoyo: true,
                repeat: 5,
            })
        }
    }
}