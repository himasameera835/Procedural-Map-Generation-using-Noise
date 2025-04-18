// Main Game Setup
const config = {
    type: Phaser.AUTO,
    width: 640,  // 20 tiles * 32px
    height: 480, // 15 tiles * 32px
    pixelArt: true, // Important for crisp pixel art
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Constants and variables
const TILE_SIZE = 64;
const MAP_HEIGHT = game.config.height / TILE_SIZE;
const MAP_WIDTH = game.config.width / TILE_SIZE;

// Terrain types and their tile indices (adjust based on your tilesheet)
const TERRAIN = {
    WATER_DEEP: 203,
    WATER: 203,
    SAND: 18,
    GRASS: 23,
    FOREST: 28
};

let map;
let tileset;
let layer;
let noiseGenerator;
let seed = Math.random() * 10000;
let noiseScale = 0.1; // Starting noise scale
let infoText;

// New variables
let player;
let cursors;
let messageText;
let placeNameTexts = [];

// Preload assets
function preload() {
    this.load.setPath('./assests/tilesets/');
    this.load.image('tilesheet', 'tilesheet.png');
    this.load.image('player', 'player.png'); // Add your avatar sprite here
}

// Create the map and initialize perlin noise
function create() {
    // Create tilemap
    map = this.make.tilemap({
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        width: MAP_WIDTH,
        height: MAP_HEIGHT
    });

    // Add tileset
    tileset = map.addTilesetImage('terrain', 'tilesheet');

    // Create layer
    layer = map.createBlankLayer('terrain', tileset);

    // Generate map
    generateMap.call(this);

    // Set up keyboard interaction
    this.input.keyboard.on('keydown-R', regenerateMap, this);
    this.input.keyboard.on('keydown-COMMA', decreaseNoiseScale, this);  // Comma key
    this.input.keyboard.on('keydown-PERIOD', increaseNoiseScale, this); // Period key
    this.input.keyboard.on('keydown-LESS_THAN', decreaseNoiseScale, this);  // < key
    this.input.keyboard.on('keydown-GREATER_THAN', increaseNoiseScale, this); // > key

    // Add UI text to show current settings
    infoText = this.add.text(10, 10, '', {
        font: '16px Arial',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
    });
    updateInfoText();

    // Add player
    player = this.add.sprite(TILE_SIZE, TILE_SIZE, 'player');
    player.setScale(0.5);
    cursors = this.input.keyboard.createCursorKeys();

    // Add movement message text
    messageText = this.add.text(10, 50, '', {
        font: '14px Arial',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
    });
}

// Generate the map based on noise
function generateMap() {
    placeNameTexts.forEach(text => text.destroy());
    placeNameTexts = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let value = noise.perlin2(x * noiseScale, y * noiseScale);
            value = (value + 1) / 2;

            let tileIndex;
            if (value < 0.3) {
                tileIndex = TERRAIN.WATER_DEEP;
            } else if (value < 0.4) {
                tileIndex = TERRAIN.WATER;
            } else if (value < 0.5) {
                tileIndex = TERRAIN.SAND;
            } else if (value < 0.7) {
                tileIndex = TERRAIN.GRASS;
            } else {
                tileIndex = TERRAIN.FOREST;
            }

            layer.putTileAt(tileIndex, x, y);

            // Procedural place names
            if (Math.random() < 0.01) {
                let name = generatePlaceName(tileIndex);
                if (name) {
                    let text = this.add.text(
                        x * TILE_SIZE + 5,
                        y * TILE_SIZE + 5,
                        name,
                        {
                            font: '14px Arial',
                            fill: '#ffeb3b',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            padding: { x: 2, y: 2 }
                        }
                    );
                    placeNameTexts.push(text);
                }
            }
        }
    }
}

// Generate a procedural place name
function generatePlaceName(tileIndex) {
    const waterNames = ["Azure Bay", "Red Sea", "Crystal Lake", "Silent Depths"];
    const sandNames = ["Golden Dunes", "Sandy Hollow", "Sunburn Flats"];
    const grassNames = ["Greenfield", "Mossy Plain", "Emerald Expanse"];
    const forestNames = ["Whispering Woods", "Oakshade", "Darkroot Forest"];

    if (tileIndex === TERRAIN.WATER || tileIndex === TERRAIN.WATER_DEEP) {
        return randomFromArray(waterNames);
    } else if (tileIndex === TERRAIN.SAND) {
        return randomFromArray(sandNames);
    } else if (tileIndex === TERRAIN.GRASS) {
        return randomFromArray(grassNames);
    } else if (tileIndex === TERRAIN.FOREST) {
        return randomFromArray(forestNames);
    }
    return null;
}

function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Regenerate the map with a new seed
function regenerateMap() {
    seed = Math.random() * 10000;
    noise.seed(seed);
    generateMap.call(this);
    updateInfoText();
}

// Shrink the sample window (increase noise detail)
function decreaseNoiseScale() {
    noiseScale = Math.max(0.01, noiseScale - 0.02);
    generateMap.call(this);
    updateInfoText();
}

// Grow the sample window (decrease noise detail)
function increaseNoiseScale() {
    noiseScale += 0.02;
    generateMap.call(this);
    updateInfoText();
}

// Update the information text
function updateInfoText() {
    infoText.setText(
        `Seed: ${Math.floor(seed)} | Scale: ${noiseScale.toFixed(3)}\n` +
        `R: New seed | ,/< or ./> : Adjust scale`
    );
}

// Update function
function update() {
    let dx = 0, dy = 0;

    if (Phaser.Input.Keyboard.JustDown(cursors.left)) dx = -1;
    if (Phaser.Input.Keyboard.JustDown(cursors.right)) dx = 1;
    if (Phaser.Input.Keyboard.JustDown(cursors.up)) dy = -1;
    if (Phaser.Input.Keyboard.JustDown(cursors.down)) dy = 1;

    if (dx !== 0 || dy !== 0) {
        let newX = player.x + dx * TILE_SIZE;
        let newY = player.y + dy * TILE_SIZE;
        let tileX = Math.floor(newX / TILE_SIZE);
        let tileY = Math.floor(newY / TILE_SIZE);

        let tile = layer.getTileAt(tileX, tileY);

        if (tile && tile.index !== TERRAIN.WATER && tile.index !== TERRAIN.WATER_DEEP) {
            player.x = newX;
            player.y = newY;
            showTileMessage(tile.index);
        } else {
            showTileMessage('WATER');
        }
    }
}

// Show movement-based tile message
function showTileMessage(tileIndex) {
    let message = '';

    switch (tileIndex) {
        case TERRAIN.GRASS:
            message = 'Walking through grasslands.';
            break;
        case TERRAIN.SAND:
            message = 'Crunchy sand under your feet.';
            break;
        case TERRAIN.FOREST:
            message = 'Treading through thick forest…';
            break;
        case TERRAIN.WATER:
        case TERRAIN.WATER_DEEP:
        case 'WATER':
            message = 'Can’t swim here!';
            break;
        default:
            message = 'Wandering the unknown.';
    }

    messageText.setText(message);
}