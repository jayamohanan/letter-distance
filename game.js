// Configuration - Adjust distancePerLetter here to tweak letter change sensitivity
const config = {
    distancePerLetter: 50, // Change this value: higher = need more distance to change letter
    tileSize: 42, // Reduced by 30% from 60px
    anchorRadius: 10.5 // Half of tile size
};

// Game state
const gameState = {
    letterTile: null,
    anchors: [],
    isDragging: false,
    currentAnchor: null,
    dragOffset: { x: 0, y: 0 },
    originalPosition: { x: 0, y: 0 },
    anchorPosition: { x: 0, y: 0 },
    startLetter: 'A',
    currentLetter: 'A',
    anchoredLetters: []
};

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

function resizeCanvas() {
    canvas.width = gameContainer.offsetWidth;
    canvas.height = gameContainer.offsetHeight;
}

resizeCanvas();

// Letter utilities
function getLetterFromDistance(startLetter, distance) {
    const startCode = startLetter.charCodeAt(0) - 65; // 0-25 for A-Z
    const steps = Math.floor(distance / config.distancePerLetter);
    const newCode = (startCode + steps) % 26;
    return String.fromCharCode(65 + newCode);
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Create letter tile
function createLetterTile(x, y, letter) {
    const tile = document.createElement('div');
    tile.className = 'letter-tile';
    tile.textContent = letter;
    tile.style.left = (x - config.tileSize / 2) + 'px';
    tile.style.top = (y - config.tileSize / 2) + 'px';
    
    // Mouse events
    tile.addEventListener('mousedown', startDrag);
    
    // Touch events
    tile.addEventListener('touchstart', startDrag);
    
    gameContainer.appendChild(tile);
    return tile;
}

// Create anchor point
function createAnchor(x, y) {
    const anchor = document.createElement('div');
    anchor.className = 'anchor-point';
    anchor.style.left = x + 'px';
    anchor.style.top = y + 'px';
    gameContainer.appendChild(anchor);
    
    return { x, y, element: anchor, used: false };
}

// Initialize game
function initGame() {
    const containerWidth = gameContainer.offsetWidth;
    const containerHeight = gameContainer.offsetHeight;
    
    // Create letter tile at center top
    const startX = containerWidth / 2;
    const startY = 150;
    gameState.letterTile = createLetterTile(startX, startY, 'A');
    gameState.originalPosition = { x: startX, y: startY };
    gameState.anchorPosition = { x: startX, y: startY };
    
    // Create anchor points at various positions (portrait layout)
    gameState.anchors.push(createAnchor(containerWidth / 2, containerHeight / 3));
    gameState.anchors.push(createAnchor(containerWidth / 2, containerHeight / 2));
    gameState.anchors.push(createAnchor(containerWidth / 3, containerHeight * 2 / 3));
    gameState.anchors.push(createAnchor(containerWidth * 2 / 3, containerHeight * 2 / 3));
    gameState.anchors.push(createAnchor(containerWidth / 2, containerHeight - 120));
}

// Drawing functions
function drawLine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState.isDragging) {
        const tileRect = gameState.letterTile.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();
        
        const tileCenterX = tileRect.left - containerRect.left + tileRect.width / 2;
        const tileCenterY = tileRect.top - containerRect.top + tileRect.height / 2;
        
        ctx.beginPath();
        ctx.moveTo(gameState.anchorPosition.x, gameState.anchorPosition.y);
        ctx.lineTo(tileCenterX, tileCenterY);
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Drag handlers
function startDrag(e) {
    e.preventDefault();
    gameState.isDragging = true;
    gameState.letterTile.classList.add('dragging');
    gameState.letterTile.classList.remove('returning');
    
    const rect = gameState.letterTile.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    gameState.dragOffset.x = clientX - rect.left;
    gameState.dragOffset.y = clientY - rect.top;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', endDrag);
}

function drag(e) {
    if (!gameState.isDragging) return;
    
    e.preventDefault();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    const containerRect = gameContainer.getBoundingClientRect();
    const newX = clientX - containerRect.left - gameState.dragOffset.x;
    const newY = clientY - containerRect.top - gameState.dragOffset.y;
    
    gameState.letterTile.style.left = newX + 'px';
    gameState.letterTile.style.top = newY + 'px';
    
    // Calculate distance from anchor point
    const tileCenterX = newX + config.tileSize / 2;
    const tileCenterY = newY + config.tileSize / 2;
    const distance = calculateDistance(
        gameState.anchorPosition.x,
        gameState.anchorPosition.y,
        tileCenterX,
        tileCenterY
    );
    
    // Update letter based on distance
    gameState.currentLetter = getLetterFromDistance(gameState.startLetter, distance);
    gameState.letterTile.textContent = gameState.currentLetter;
    document.getElementById('currentLetterDisplay').textContent = gameState.currentLetter;
    
    // Check if near any anchor point and provide visual feedback
    let nearAnchor = null;
    for (const anchor of gameState.anchors) {
        const distToAnchor = calculateDistance(tileCenterX, tileCenterY, anchor.x, anchor.y);
        if (distToAnchor < config.anchorRadius + config.tileSize / 2) {
            nearAnchor = anchor;
            break;
        }
    }
    
    // Update visual feedback
    if (nearAnchor) {
        gameState.letterTile.classList.add('near-anchor');
        nearAnchor.element.classList.add('highlight');
        // Remove highlight from other anchors
        gameState.anchors.forEach(a => {
            if (a !== nearAnchor) {
                a.element.classList.remove('highlight');
            }
        });
    } else {
        gameState.letterTile.classList.remove('near-anchor');
        gameState.anchors.forEach(a => a.element.classList.remove('highlight'));
    }
    
    // Draw line
    drawLine();
}

function endDrag(e) {
    if (!gameState.isDragging) return;
    
    gameState.isDragging = false;
    gameState.letterTile.classList.remove('dragging');
    gameState.letterTile.classList.remove('near-anchor');
    
    const rect = gameState.letterTile.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const tileCenterX = rect.left - containerRect.left + rect.width / 2;
    const tileCenterY = rect.top - containerRect.top + rect.height / 2;
    
    // Check if near any anchor point
    let nearAnchor = null;
    for (const anchor of gameState.anchors) {
        const distance = calculateDistance(tileCenterX, tileCenterY, anchor.x, anchor.y);
        if (distance < config.anchorRadius + config.tileSize / 2) {
            nearAnchor = anchor;
            break;
        }
    }
    
    // Remove all highlight classes
    gameState.anchors.forEach(a => a.element.classList.remove('highlight'));
    
    if (nearAnchor) {
        // Anchor the letter
        snapToAnchor(nearAnchor);
    } else {
        // Return to original position
        returnToOriginal();
    }
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', endDrag);
}

function snapToAnchor(anchor) {
    // Mark anchor as used
    if (!anchor.used) {
        anchor.used = true;
        anchor.element.classList.add('active');
        
        // Store the anchored letter
        gameState.anchoredLetters.push({
            letter: gameState.currentLetter,
            position: { x: anchor.x, y: anchor.y }
        });
    }
    
    // Update anchor position
    gameState.anchorPosition = { x: anchor.x, y: anchor.y };
    gameState.startLetter = gameState.currentLetter;
    
    // Position tile at anchor
    gameState.letterTile.style.left = (anchor.x - config.tileSize / 2) + 'px';
    gameState.letterTile.style.top = (anchor.y - config.tileSize / 2) + 'px';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function returnToOriginal() {
    gameState.letterTile.classList.add('returning');
    
    // Return to anchor position (not original if anchored)
    gameState.letterTile.style.left = (gameState.anchorPosition.x - config.tileSize / 2) + 'px';
    gameState.letterTile.style.top = (gameState.anchorPosition.y - config.tileSize / 2) + 'px';
    
    // Reset letter to start letter
    gameState.currentLetter = gameState.startLetter;
    gameState.letterTile.textContent = gameState.currentLetter;
    document.getElementById('currentLetterDisplay').textContent = gameState.currentLetter;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    setTimeout(() => {
        gameState.letterTile.classList.remove('returning');
    }, 300);
}

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
});

// Initialize the game
initGame();
