import 'phaser'
import worldMapData from '../assets/terrain/world1.json';
import Textures from './textures';'./textures'

const TILE_SIZE = 32
const GRASS_INDICES = [90]

export default class ScrollScene extends Phaser.Scene {

    private tilemap: Phaser.Tilemaps.Tilemap
    private terrainLayer: Phaser.Tilemaps.TilemapLayer
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys
    private facing: number = 0
    private breakingTile: boolean = false

    preload() {
        this.load.image('sky', Textures.skyImage)
        this.load.spritesheet('dude', Textures.dudeSprite, { frameWidth: 32, frameHeight: 48 });
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

        this.player = this.physics.add.sprite(100, 300, 'dude');
    
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });
    
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.player.anims.play('right', true);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.collider(this.player, this.terrainLayer);

        this.add.bitmapText(8, 8, 'atari', '2D Craft').setOrigin(0).setScale(0.4).setScrollFactor(0);

        this.cameras.main.setBounds(0, 0, 3200, this.sys.game.canvas.height);
        this.cameras.main.startFollow(this.player);
    }
    
    update() {
        if (this.cursors.up.isDown && this.player.body.blocked.down) {
            this.player.setVelocityY(-300);   
        }

        if (this.cursors.left.isDown) {
            this.facing = -1
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.facing = +1
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } else if (this.player.body.blocked.down) {
            this.player.setVelocityX(0);
            this.player.anims.stop();
        }
        
        if (this.cursors.space.isDown && !this.breakingTile) {
            let tile;
            if (this.cursors.down.isDown) {
                let pos = this.player.getBottomCenter()
                tile = this.findTileToInteract(pos.x, pos.y, TILE_SIZE/2, 0);
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
        } else if (this.cursors.space.isUp) {
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