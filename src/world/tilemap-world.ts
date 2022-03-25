import Resources from '../scene/resources'
import worldMapData from '../assets/terrain/world1.json';
import { TileType } from './tile-type';
import TileFilter from './tile-filter';
import Character from '../character/character';

export default class TilemapWorld {
    private static readonly GRASS_INDICES = [TileType.GRASS_1]

    private scene: Phaser.Scene
    private tilemap: Phaser.Tilemaps.Tilemap
    private tileset: Phaser.Tilemaps.Tileset
    private worldWidth: number
    private worldHeight: number
    private terrainLayer: Phaser.Tilemaps.TilemapLayer
    private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private shouldSpreadLavaAfter: number
    private characters: Character[] = []

    constructor(scene: Phaser.Scene) {
        this.scene = scene
    }

    preload() {
        this.scene.load.tilemapTiledJSON('worldMap', worldMapData);
        this.scene.load.image('terrainTexture', Resources.terrainTexture)
    }

    init() {
        this.tilemap = this.scene.make.tilemap({ key: 'worldMap' });
        this.tileset = this.tilemap.addTilesetImage('terrain', 'terrainTexture');
        this.worldWidth = this.tilemap.width * this.tileset.tileWidth
        this.worldHeight = this.tilemap.height * this.tileset.tileHeight
        
        this.terrainLayer = this.tilemap.createLayer('World1', this.tileset, 0, 0).setScale(1).setCollisionByExclusion([-1, ...TilemapWorld.GRASS_INDICES, TileType.LAVA]);
        this.terrainLayer.setTileIndexCallback(TileType.TNT, this.touchTnt, this);
        this.terrainLayer.setTileIndexCallback(TileType.LAVA, this.touchLava, this);

        this.explosionEmitter = this.scene.add.particles('explosionEffectImage').createEmitter({
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0.0 },
            alpha: 0.1,
            blendMode: Phaser.BlendModes.ADD,
            active: false,
            lifespan: 500,
            gravityY: 200
        });;

        this.shouldSpreadLavaAfter = 0        
    }

    addCharacter(character: Character) {
        this.scene.physics.add.collider(character.getSprite(), this.terrainLayer);
        this.characters.push(character)
    }

    update() {
        if (Date.now() > this.shouldSpreadLavaAfter) {
            this.spreadLava();
        }
    }

    getWidth(): number {
        return this.worldWidth
    }

    getHeight(): number {
        return this.worldHeight
    }

    getTileSize(): number {
        return this.tileset.tileWidth
    }

    addObjectTouchedCallback(tileType: TileType, callback: () => void) {
        this.terrainLayer.setTileIndexCallback(tileType, callback, this);
    }

    findObjects(tileType: TileType): Phaser.Tilemaps.Tile[] {
        const tiles = []
        let tile
        for (let i = 0; tile = this.terrainLayer.findByIndex(tileType, i); i++) {
            tiles.push(tile)
        }
        return tiles
    }

    putObject(tileType: TileType, worldX: number, worldY: number, toleranceX: number, toleranceY: number): boolean {
        const tileFilter = {
            hardTile: false,
            softTile: true,
            emptyTile: true
        }
        const tile = this.findTileToInteract(worldX, worldY, tileFilter, toleranceX, toleranceY)
        if (tile) {
            this.terrainLayer.putTileAt(tileType, tile.x, tile.y)
            return true
        }
        return false
    }

    breakObject(worldX: number, worldY: number, toleranceX: number, toleranceY: number): boolean {
        const tileFilter = {
            hardTile: true,
            softTile: true,
            emptyTile: false
        }
        const tile = this.findTileToInteract(worldX, worldY, tileFilter, toleranceX, toleranceY)
        if (tile) {
            this.breakTile(tile.x, tile.y)
            return true
        }
        return false
    }
    
    getAccessibleRange(worldX: number, worldY: number, rangeLeft: number, rangeRight: number): [number, number] {
        let x = Math.floor(worldX / this.tileset.tileWidth)
        let y = Math.floor(worldY / this.tileset.tileHeight)
        
        const hardTileFilter = {
            hardTile: true,
            softTile: false,
            emptyTile: false
        }
        
        // find support or ground
        while (y < this.tilemap.height && !this.testTilePosForType(x, y, hardTileFilter)) {
            y++
        }

        // find lateral range
        const left = this.findAccessibleEnd(x, y, false, 1 + Math.floor(rangeLeft / this.tileset.tileWidth))
        const right = this.findAccessibleEnd(x, y, true, 1 + Math.floor(rangeRight / this.tileset.tileWidth))
        const leftWorldX = Math.max((left + 0.5) * this.tileset.tileWidth, worldX - rangeLeft)
        const rightWorldX = Math.min((right + 0.5) * this.tileset.tileWidth, worldX + rangeRight)
        return [leftWorldX , rightWorldX]
    }

    private findAccessibleEnd(startingX: number, startingY: number, rightSide: boolean, maxDistance: number) {
        const hardTile = {
            hardTile: true,
            softTile: false,
            emptyTile: false
        }
        const spaceTile = {
            hardTile: false,
            softTile: true,
            emptyTile: true
        }
        let x = startingX
        let y = startingY
        while (x > 0 && x < this.tilemap.width - 1 && x > startingX - maxDistance && x < startingX + maxDistance) {
            const newX = rightSide ? x + 1 : x - 1
            if ((y === this.tilemap.height || this.testTilePosForType(newX, y, hardTile)) &&
                this.testTilePosForType(newX, y - 1, spaceTile) &&
                this.testTilePosForType(newX, y - 2, spaceTile)) {
                // same level
            } else if (y > 2 &&
                this.testTilePosForType(newX, y - 1, hardTile) &&
                this.testTilePosForType(newX, y - 2, spaceTile) &&
                this.testTilePosForType(newX, y - 3, spaceTile)) {
                // up-stair
                y -= 1
            } else if (y < this.tilemap.height - 1 &&
                this.testTilePosForType(newX, y + 1, hardTile) &&
                this.testTilePosForType(newX, y, spaceTile) &&
                this.testTilePosForType(newX, y - 1, spaceTile)) {
                // down-stair
                y += 1
            } else {
                // dead-end
                break
            }
            x = newX
        }
        return x
    }

    private findTileToInteract(worldX: number, worldY: number, tileFilter: TileFilter, toleranceX: number, toleranceY: number): Phaser.Tilemaps.Tile {
        let tiles: Phaser.Tilemaps.Tile[] = []
        const x0 = Math.floor((worldX - toleranceX) / this.tileset.tileWidth)
        const y0 = Math.floor((worldY - toleranceY) / this.tileset.tileHeight)
        const x1 = Math.floor((worldX + toleranceX) / this.tileset.tileWidth)
        const y1 = Math.floor((worldY + toleranceY) / this.tileset.tileHeight)
        for (let i = x0; i <= x1; i++) {
            for (let j = y0; j <= y1; j++) {
                let tile = this.terrainLayer.getTileAt(i, j, true)
                if (this.testTileForType(tile, tileFilter)) {
                    tiles.push(tile)
                }
            }
        }
        let distances = tiles.map(tile => Math.abs(tile.getCenterX() - worldX) + Math.abs(tile.getCenterY() - worldY))
        let index = distances.indexOf(Math.min(...distances))
        return index != -1 ? tiles[index] : null
    }

    private testTileForType(tile: Phaser.Tilemaps.Tile, tileFilter: TileFilter) {
        if (tile == null || tile.index === -1) {
            if (tileFilter.emptyTile) {
                if (this.testCollionWithImaginaryTile(tile)) {
                    return false
                }
                return true
            } else {
                return false
            }
        } else if (TilemapWorld.GRASS_INDICES.includes(tile.index)) {
            return tileFilter.softTile
        } else {
            return tileFilter.hardTile
        }
    }

    private testTilePosForType(x: number, y: number, tileFilter: TileFilter) {
        let tile = this.terrainLayer.getTileAt(x, y, true)
        return this.testTileForType(tile, tileFilter)
    }

    private testCollionWithImaginaryTile(tile: Phaser.Tilemaps.Tile): boolean {
        // this.physics.world.collideTiles with imaginary tile (index -1) doesn't work
        // this.physics.overlapTiles is too strict
        for (const character of this.characters) {
            const bound = character.getSprite().getBounds()
            if (bound.bottom <= tile.y * this.tileset.tileHeight || bound.top >= (tile.y + 1) * this.tileset.tileHeight ||
                bound.centerX <= tile.x * this.tileset.tileWidth || bound.centerX >= (tile.x + 1) * this.tileset.tileWidth) {
                return false;
            }
        }
        return true
    }

    private spreadLava() {
        let tile: Phaser.Tilemaps.Tile
        let newLavaLocations: Phaser.Math.Vector2[] = []
        for (let i = 0; tile = this.terrainLayer.findByIndex(TileType.LAVA, i); i++) {
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
                this.terrainLayer.putTileAt(TileType.LAVA, location.x, location.y, false)
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
        
        if (TilemapWorld.GRASS_INDICES.includes(tile.index)) {
            return true
        } else {
            return false
        }
    }

    private breakTile(x: number, y: number) {
        // remove with replaceWithNull false, so that getTileAt() can still be used later
        this.terrainLayer.removeTileAt(x, y, false)

        let upperTile = this.terrainLayer.getTileAt(x, y - 1)
        if (upperTile && TilemapWorld.GRASS_INDICES.includes(upperTile.index)) {
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

        const character = this.characters.find(c => c.getSprite() == spirit)
        if (character) {
            let pos = character.getSprite().getCenter()
            let vx = Math.sign(pos.x - tile.getCenterX()) * 100;
            let vy = Math.sign(pos.y - tile.getCenterY()) * 100;
            character.passivePush(vx, vy)
            character.hurt()
        }
    }

    private touchLava(spirit: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) {
        const character = this.characters.find(c => c.getSprite() == spirit)
        if (character) {
            const body = character.getSprite().body
            if (body) { // may be falsy if sprite destroyed
                // correct for small error added by phaser in body position due to gravity
                if (tile.intersects(body.left, body.top - body.deltaY(), body.right, body.bottom - body.deltaY())) {
                    character.hurt()
                }
            }
        }
    }

}