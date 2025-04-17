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

// Preload assets
function preload() {
    this.load.setPath('./assests/tilesets/')
    this.load.image('tilesheet', 'tilesheet.png');
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
}

// Generate the map based on noise
function generateMap() {
    // Generate map based on current seed and noise scale
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Generate noise value
            let value = noise.perlin2(x * noiseScale, y * noiseScale);
            
            // Normalize noise value from -1..1 to 0..1
            value = (value + 1) / 2;
            
            // Determine terrain type based on noise value
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
            
            // Place the tile
            layer.putTileAt(tileIndex, x, y);
        }
    }
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
    // No continuous updates needed for this application
}