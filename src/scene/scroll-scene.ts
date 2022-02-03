import 'phaser'
import worldMapData from '../assets/terrain/world1.json';
import Textures from './textures';'./textures'

const TILE_SIZE = 32
const GRASS_INDICES = [90]

export default class ScrollScene extends Phaser.Scene {

    private tilemap: Phaser.Tilemaps.Tilemap
    private terrainLayer: Phaser.Tilemaps.TilemapLayer
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    private keyUp: Phaser.Input.Keyboard.Key
    private keyLeft: Phaser.Input.Keyboard.Key
    private keyDown: Phaser.Input.Keyboard.Key
    private keyRight: Phaser.Input.Keyboard.Key
    private keyJump: Phaser.Input.Keyboard.Key
    private keyBreak: Phaser.Input.Keyboard.Key
    private facing: number = 0
    private breakingTile: boolean = false

    preload() {
        this.load.image('sky', Textures.skyImage)
        this.load.spritesheet('player', Textures.alexSprite, { frameWidth: 200, frameHeight: 288 });
        this.load.tilemapTiledJSON('worldMap', worldMapData);
        this.load.image('terrainTexture', Textures.terrainTexture);
        this.load.bitmapFont('atari', Textures.fontAtariImage, Textures.fontAtariMetadata);
    }
    
    create() {
        this.cameras.main.setBackgroundColor('#adc8ff')
        this.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0.02, 0);
    
        this.tilemap = this.make.tilemap({ key: 'worldMap' });
        const tileset1 = this.tilemap.addTilesetImage('terrain', 'terrainTexture');
        this.terrainLayer = this.tilemap.createLayer('World1', tileset1, 0, 0).setScale(1).setCollisionByExclusion([-1, ...GRASS_INDICES]);

        this.player = this.physics.add.sprite(100, 300, 'player').setSize(90, 260).setScale(0.2);
    
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

        // this.cursors = this.input.keyboard.createCursorKeys();
        this.keyUp = this.input.keyboard.addKey('w')
        this.keyLeft = this.input.keyboard.addKey('a')
        this.keyDown = this.input.keyboard.addKey('s')
        this.keyRight = this.input.keyboard.addKey('d')
        this.keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        this.keyBreak = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD)

        this.physics.add.collider(this.player, this.terrainLayer);

        this.add.bitmapText(8, 8, 'atari', '2D Craft').setOrigin(0).setScale(0.4).setScrollFactor(0);

        this.cameras.main.setBounds(0, 0, 3200, this.sys.game.canvas.height);
        this.cameras.main.startFollow(this.player);
    }
    
    update() {
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
        
        if (this.keyBreak.isDown && !this.breakingTile) {
            let tile;
            if (this.keyDown.isDown) {
                let pos = this.player.getBottomCenter()
                tile = this.findTileToInteract(pos.x, pos.y, TILE_SIZE/2, 0);
            } else if (this.keyUp.isDown) {
                let pos = this.player.getTopCenter()
                tile = this.findTileToInteract(pos.x + this.facing * TILE_SIZE/2, pos.y - TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);
            } else if (this.facing === -1) {
                let pos = this.player.getLeftCenter()
                tile = this.findTileToInteract(pos.x - TILE_SIZE/2, pos.y, 0, TILE_SIZE/2);
            } else if (this.facing === 1) {
                let pos = this.player.getRightCenter()
                tile = this.findTileToInteract(pos.x + TILE_SIZE/2, pos.y, 0, TILE_SIZE/2);
            }

            if (tile) {
                this.breakTile(tile.x, tile.y)
                this.breakingTile = true;
            }
        } else if (this.keyBreak.isUp) {
            this.breakingTile = false;
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
    }
}