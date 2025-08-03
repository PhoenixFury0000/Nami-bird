// Game elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bestScoreElement = document.getElementById('bestScore');
const currentScoreElement = document.getElementById('currentScore');
const gameOverElement = document.querySelector('.game-over');
const finalScoreElement = document.getElementById('finalScore');
const highScoreElement = document.getElementById('highScore');
const restartBtn = document.querySelector('.restart-btn');

// Game settings
let gamePlaying = false;
const gravity = 0.5;
const speed = 6.2;
const size = [60, 60]; // Nami's size
const jump = -11.5;
const cTenth = canvas.width / 10;
const obstacleTypes = 4; // Number of different obstacle sprites

// Game state
let index = 0;
let bestScore = 0;
let flight = 0;
let flyHeight = 0;
let currentScore = 0;
let obstacles = [];
let animationFrameId = 0;

// Image settings
const imageSettings = {
  background: {
    zoom: 1.8,
    offsetY: -100,
    scrollSpeed: 0.7
  },
  character: {
    scale: 1.0
  }
};

// Images
const images = {
  background: new Image(),
  character: new Image(),
  ground: new Image(),
  obstacle1: new Image(), // ship1
  obstacle2: new Image(), // stone
  obstacle3: new Image(), // ship2
  obstacle4: new Image()  // ship3
};

// Set image sources
images.background.src = 'assets/background.jpg';
images.character.src = 'assets/character.png';
images.ground.src = 'assets/ground.png';
images.obstacle1.src = 'assets/ship1.png';
images.obstacle2.src = 'assets/stone.png';
images.obstacle3.src = 'assets/ship2.png';
images.obstacle4.src = 'assets/ship3.png';

// Sound effects
const sounds = {
  jump: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3'),
  score: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'),
  hit: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3')
};

// Set sound volume
Object.values(sounds).forEach(sound => {
  sound.volume = 0.3;
});

// Obstacle settings
const obstacleConfig = {
  width: 80,
  minGap: 250,  // Minimum vertical gap between obstacles
  maxGap: 350,  // Maximum vertical gap
  spacing: 300  // Horizontal spacing between obstacles
};

// Initialize game
function setup() {
  currentScore = 0;
  flight = jump;
  flyHeight = (canvas.height / 2) - (size[1] / 2);
  generateObstacles();
  updateScoreDisplay();
}

// Generate obstacles with clear pathways
function generateObstacles() {
  obstacles = [];
  const obstacleCount = 3; // Number of obstacles on screen
  
  for (let i = 0; i < obstacleCount; i++) {
    const type = Math.floor(Math.random() * obstacleTypes) + 1;
    const gap = obstacleConfig.minGap + Math.random() * (obstacleConfig.maxGap - obstacleConfig.minGap);
    const topHeight = Math.random() * (canvas.height - gap - 100);
    const bottomHeight = canvas.height - topHeight - gap;
    
    obstacles.push({
      x: canvas.width + (i * (obstacleConfig.spacing + obstacleConfig.width)),
      type: type,
      topHeight: topHeight,
      bottomHeight: bottomHeight,
      gap: gap,
      passed: false
    });
  }
}

// Update score display
function updateScoreDisplay() {
  bestScoreElement.textContent = `Best: ${bestScore}`;
  currentScoreElement.textContent = `Current: ${currentScore}`;
}

// Main game loop
function render() {
  index++;
  
  // Clear canvas
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw zoomed background
  const bg = imageSettings.background;
  const zoomedWidth = canvas.width * bg.zoom;
  const zoomedHeight = canvas.height * bg.zoom;
  const bgPos1 = -((index * (speed * bg.scrollSpeed)) % zoomedWidth) + zoomedWidth;
  const bgPos2 = -(index * (speed * bg.scrollSpeed)) % zoomedWidth;
  
  ctx.drawImage(
    images.background,
    0, 0, images.background.width, images.background.height,
    bgPos1 - (zoomedWidth - canvas.width)/2, 
    -(zoomedHeight - canvas.height)/2 + bg.offsetY,
    zoomedWidth, zoomedHeight
  );
  ctx.drawImage(
    images.background,
    0, 0, images.background.width, images.background.height,
    bgPos2 - (zoomedWidth - canvas.width)/2,
    -(zoomedHeight - canvas.height)/2 + bg.offsetY,
    zoomedWidth, zoomedHeight
  );
  
  // Draw ground
  ctx.drawImage(images.ground, 0, 0, canvas.width, 50, 0, canvas.height - 50, canvas.width, 50);
  
  if (gamePlaying) {
    // Update and draw obstacles
    obstacles.forEach(obstacle => {
      obstacle.x -= speed;
      
      // Get the correct obstacle image
      const obstacleImg = images[`obstacle${obstacle.type}`];
      
      // Draw top obstacle
      ctx.drawImage(
        obstacleImg,
        0, 0, obstacleImg.width, obstacleImg.height,
        obstacle.x, 0,
        obstacleConfig.width, obstacle.topHeight
      );
      
      // Draw bottom obstacle
      ctx.drawImage(
        obstacleImg,
        0, 0, obstacleImg.width, obstacleImg.height,
        obstacle.x, canvas.height - obstacle.bottomHeight,
        obstacleConfig.width, obstacle.bottomHeight
      );
      
      // Check if obstacle passed
      if (obstacle.x + obstacleConfig.width < cTenth && !obstacle.passed) {
        currentScore++;
        obstacle.passed = true;
        if (currentScore % 5 === 0) {
          sounds.score.currentTime = 0;
          sounds.score.play();
        }
        bestScore = Math.max(bestScore, currentScore);
      }
      
      // Collision detection
      if (
        obstacle.x < cTenth + size[0] && 
        obstacle.x + obstacleConfig.width > cTenth && 
        (flyHeight < obstacle.topHeight || 
         flyHeight + size[1] > canvas.height - obstacle.bottomHeight)
      ) {
        gameOver();
      }
    });
    
    // Remove off-screen obstacles and add new ones
    if (obstacles[0].x + obstacleConfig.width < 0) {
      obstacles.shift();
      addNewObstacle();
    }
    
    // Update and draw Nami
    flight += gravity;
    flyHeight = Math.min(flyHeight + flight, canvas.height - size[1] - 50);
    
    ctx.save();
    const rotation = Math.min(Math.max(flight * 3, -30), 30);
    ctx.translate(cTenth + size[0]/2, flyHeight + size[1]/2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(
      images.character,
      -size[0]*imageSettings.character.scale/2, 
      -size[1]*imageSettings.character.scale/2,
      size[0]*imageSettings.character.scale, 
      size[1]*imageSettings.character.scale
    );
    ctx.restore();
    
    // Ground collision
    if (flyHeight >= canvas.height - size[1] - 50) {
      gameOver();
    }
  } else {
    // Draw idle character
    ctx.drawImage(
      images.character,
      (canvas.width / 2) - (size[0]*imageSettings.character.scale)/2,
      flyHeight,
      size[0]*imageSettings.character.scale,
      size[1]*imageSettings.character.scale
    );
    
    // Draw start screen text
    ctx.fillStyle = 'white';
    ctx.font = "bold 30px 'Press Start 2P'";
    ctx.textAlign = 'center';
    ctx.fillText(`BEST: ${bestScore}`, canvas.width / 2, 245);
    
    ctx.fillStyle = '#ffd166';
    ctx.font = "bold 24px 'Press Start 2P'";
    ctx.fillText('TAP TO PLAY', canvas.width / 2, 535);
  }
  
  // Update score display
  updateScoreDisplay();
  
  // Continue animation loop
  animationFrameId = window.requestAnimationFrame(render);
}

// Add new obstacle at the end
function addNewObstacle() {
  const type = Math.floor(Math.random() * obstacleTypes) + 1;
  const gap = obstacleConfig.minGap + Math.random() * (obstacleConfig.maxGap - obstacleConfig.minGap);
  const topHeight = Math.random() * (canvas.height - gap - 100);
  const bottomHeight = canvas.height - topHeight - gap;
  
  obstacles.push({
    x: obstacles[obstacles.length-1].x + obstacleConfig.spacing + obstacleConfig.width,
    type: type,
    topHeight: topHeight,
    bottomHeight: bottomHeight,
    gap: gap,
    passed: false
  });
}

// Game over function
function gameOver() {
  if (!gamePlaying) return;
  
  gamePlaying = false;
  sounds.hit.play();
  
  finalScoreElement.textContent = `SCORE: ${currentScore}`;
  highScoreElement.textContent = `BEST: ${bestScore}`;
  gameOverElement.style.display = 'block';
}

// Start game function
function startGame() {
  if (gamePlaying) return;
  
  gamePlaying = true;
  gameOverElement.style.display = 'none';
  setup();
  sounds.jump.play();
}

// Input handler
function handleInput() {
  if (gamePlaying) {
    flight = jump;
    sounds.jump.play();
  } else {
    startGame();
  }
}

// Event listeners
function setupEventListeners() {
  document.addEventListener('click', handleInput);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      handleInput();
    }
  });
  document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
  }, { passive: false });
  restartBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('touchend', startGame);
}

// Initialize game
function init() {
  setup();
  setupEventListeners();
  animationFrameId = window.requestAnimationFrame(render);
}

// Start when images load
let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

Object.values(images).forEach(img => {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) init();
  };
  img.onerror = () => console.error('Error loading image:', img.src);
});