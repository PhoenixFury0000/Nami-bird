// Game elements
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bestScoreElement = document.getElementById("bestScore");
const currentScoreElement = document.getElementById("currentScore");
const gameOverElement = document.querySelector(".game-over");
const finalScoreElement = document.getElementById("finalScore");
const highScoreElement = document.getElementById("highScore");
const restartBtn = document.querySelector(".restart-btn");
const timerCountElement = document.querySelector(".timer-count");

// Game settings
let gamePlaying = false;
let isCountdownActive = false;
const gravity = 0.5;
const speed = 6.2;
const size = [60, 60]; // Character size
const jump = -11.5;
const cTenth = canvas.width / 10;
const pipeWidth = 78;
const pipeGap = 270;

// Game state
let index = 0;
let bestScore = 0;
let flight = 0;
let flyHeight = 0;
let currentScore = 0;
let pipes = [];
let animationFrameId = 0;
let countdownTimer = null;

// Background zoom settings
const backgroundZoom = 1.8;
let bgImageLoaded = false;

// Images
const images = {
  background: new Image(),
  character: new Image(),
  ground: new Image(),
  obstacleTop: new Image(),
  obstacleBottom: new Image()
};

images.background.src = "https://i.ibb.co/rG8CyMH2/image.jpg";
images.character.src = "https://i.ibb.co/JRfc3j4P/image.jpg";
images.ground.src = "https://i.ibb.co/Z6CwhrRN/image.jpg";
images.obstacleTop.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";
images.obstacleBottom.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";

// Sound effects
const sounds = {
  jump: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3"),
  score: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3"),
  hit: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3")
};

// Set sound volume
Object.values(sounds).forEach((sound) => {
  sound.volume = 0.3;
});

// Initialize game
function setup() {
  currentScore = 0;
  flight = jump;
  flyHeight = canvas.height / 2 - size[1] / 2;
  pipes = Array(3)
    .fill()
    .map((a, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);

  updateScoreDisplay();
}

// Calculate random pipe location
function pipeLoc() {
  return (
    Math.random() * (canvas.height - (pipeGap + pipeWidth) - pipeWidth) +
    pipeWidth
  );
}

// Update score display
function updateScoreDisplay() {
  bestScoreElement.textContent = `Best: ${bestScore}`;
  currentScoreElement.textContent = `Current: ${currentScore}`;
}

// Main game loop
function render(timestamp) {
  index++;

  // Clear canvas
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw zoomed background
  if (bgImageLoaded) {
    const zoomedWidth = canvas.width * backgroundZoom;
    const zoomedHeight = canvas.height * backgroundZoom;
    const offsetX = (zoomedWidth - canvas.width) / 2;
    const offsetY = (zoomedHeight - canvas.height) / 2;

    const bgPos1 = -((index * (speed / 3)) % zoomedWidth) + zoomedWidth;
    const bgPos2 = -(index * (speed / 3)) % zoomedWidth;

    ctx.drawImage(
      images.background,
      0, 0, images.background.width, images.background.height,
      bgPos1 - offsetX, -offsetY, zoomedWidth, zoomedHeight
    );

    ctx.drawImage(
      images.background,
      0, 0, images.background.width, images.background.height,
      bgPos2 - offsetX, -offsetY, zoomedWidth, zoomedHeight
    );
  }

  // Draw ground
  ctx.drawImage(
    images.ground,
    0, 0, canvas.width, 50,
    0, canvas.height - 50, canvas.width, 50
  );

  if (gamePlaying) {
    // Update and draw pipes
    pipes.forEach((pipe) => {
      pipe[0] -= speed;

      // Draw top pipe
      ctx.drawImage(
        images.obstacleTop,
        432, 588 - pipe[1], pipeWidth, pipe[1],
        pipe[0], 0, pipeWidth, pipe[1]
      );

      // Draw bottom pipe
      ctx.drawImage(
        images.obstacleBottom,
        432 + pipeWidth, 108, pipeWidth, canvas.height - pipe[1] + pipeGap,
        pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] + pipeGap
      );

      // Check if pipe passed
      if (pipe[0] <= -pipeWidth) {
        currentScore++;
        if (currentScore % 5 === 0) {
          sounds.score.currentTime = 0;
          sounds.score.play();
        }
        bestScore = Math.max(bestScore, currentScore);
        pipes = [
          ...pipes.slice(1),
          [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()]
        ];
      }

      // Collision detection
      if (
        pipe[0] <= cTenth + size[0] &&
        pipe[0] + pipeWidth >= cTenth &&
        (pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + size[1])
      ) {
        gameOver();
      }
    });

    // Update character position
    flight += gravity;
    flyHeight = Math.min(flyHeight + flight, canvas.height - size[1] - 50);

    // Draw character with rotation
    ctx.save();
    const rotation = Math.min(Math.max(flight * 3, -30), 30);
    ctx.translate(cTenth + size[0] / 2, flyHeight + size[1] / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      images.character,
      -size[0] / 2, -size[1] / 2, size[0], size[1]
    );
    ctx.restore();

    // Ground collision
    if (flyHeight >= canvas.height - size[1] - 50) {
      gameOver();
    }
  } else {
    // Draw idle character (center screen)
    ctx.drawImage(
      images.character,
      canvas.width / 2 - size[0] / 2, flyHeight,
      size[0], size[1]
    );

    // Draw start screen text with shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "white";
    ctx.font = "bold 30px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText(`BEST: ${bestScore}`, canvas.width / 2, 245);
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 24px 'Press Start 2P'";
    ctx.fillText("TAP TO PLAY", canvas.width / 2, 535);
    ctx.shadowColor = "transparent";
  }

  updateScoreDisplay();
  animationFrameId = window.requestAnimationFrame(render);
}

// Game over function
function gameOver() {
  if (!gamePlaying) return;

  gamePlaying = false;
  document.body.classList.remove("no-scroll");
  sounds.hit.play();

  // Show game over screen
  finalScoreElement.textContent = `SCORE: ${currentScore}`;
  highScoreElement.textContent = `BEST: ${bestScore}`;
  gameOverElement.style.display = "block";

  // Disable button and start countdown
  restartBtn.disabled = true;
  restartBtn.classList.remove("active");
  isCountdownActive = true;
  let countdown = 4;
  timerCountElement.textContent = countdown;
  
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdown--;
    timerCountElement.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(countdownTimer);
      restartBtn.disabled = false;
      restartBtn.classList.add("active");
      isCountdownActive = false;
      timerCountElement.textContent = "0";
    }
  }, 1000);
}

// Start game function
function startGame() {
  if (gamePlaying || isCountdownActive) return;

  gamePlaying = true;
  document.body.classList.add("no-scroll");
  gameOverElement.style.display = "none";
  setup();
  sounds.jump.play();
}

// Input handler
function handleInput(e) {
  // Prevent default behavior for touch events and spacebar
  if (e.type === 'touchstart' || (e.type === 'keydown' && e.code === 'Space')) {
    e.preventDefault();
  }

  // Block input during countdown
  if (isCountdownActive) return;
  
  if (gamePlaying) {
    flight = jump;
    sounds.jump.play();
  } else {
    startGame();
  }
}

// Event listeners
function setupEventListeners() {
  // Mouse click
  document.addEventListener("click", handleInput);
  
  // Keyboard space
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.key === " ") {
      handleInput(e);
    }
  });

  // Touch controls for mobile
  document.addEventListener("touchstart", handleInput, { passive: false });
  
  // Prevent touchmove from scrolling during gameplay
  document.addEventListener("touchmove", (e) => {
    if (gamePlaying || isCountdownActive) {
      e.preventDefault();
    }
  }, { passive: false });

  // Restart button
  restartBtn.addEventListener("click", () => {
    if (!restartBtn.disabled) {
      startGame();
    }
  });

  // Touch support for restart button
  restartBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (!restartBtn.disabled) {
      startGame();
    }
  });
}

// Initialize game when images load
function init() {
  let imagesLoaded = 0;
  const totalImages = Object.keys(images).length;

  Object.values(images).forEach((img) => {
    img.onload = () => {
      imagesLoaded++;
      if (img === images.background) {
        bgImageLoaded = true;
      }
      if (imagesLoaded === totalImages) {
        setup();
        setupEventListeners();
        animationFrameId = window.requestAnimationFrame(render);
      }
    };
    img.onerror = () => console.error("Error loading image:", img.src);
  });
}

// Start the game
init();