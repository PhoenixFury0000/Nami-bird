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
const playerNameElement = document.getElementById("playerName");
const logoutBtn = document.getElementById("logoutBtn");

// Auth elements
const authModal = document.getElementById("authModal");
const gameContainer = document.getElementById("gameContainer");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const signupUsername = document.getElementById("signupUsername");
const signupPassword = document.getElementById("signupPassword");
const signupConfirmPassword = document.getElementById("signupConfirmPassword");
const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");
const loginMessage = document.getElementById("loginMessage");
const topPlayersList = document.getElementById("topPlayersList");

// Set canvas size
function resizeCanvas() {
  const maxWidth = 430;
  const maxHeight = 600;
  const ratio = maxWidth / maxHeight;
  
  let width = Math.min(window.innerWidth, maxWidth);
  let height = width / ratio;
  
  if (height > window.innerHeight * 0.9) {
    height = window.innerHeight * 0.9;
    width = height * ratio;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  if (gamePlaying) {
    flyHeight = Math.min(flyHeight, canvas.height - birdHeight);
  } else {
    flyHeight = canvas.height / 2 - birdHeight / 2;
  }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game settings
let gamePlaying = false;
let isCountdownActive = false;
const gravity = 0.5;
const speed = 6;
const jump = -11;
const pipeWidth = 80;
const pipeGap = canvas.height * 0.3;
const birdWidth = 50;
const birdHeight = 35;

// Game state
let index = 0;
let bestScore = 0;
let flight = 0;
let flyHeight = canvas.height / 2 - birdHeight / 2;
let currentScore = 0;
let pipes = [];
let animationFrameId = 0;
let countdownTimer = null;
let pipeColor = '#e94560';
let backgroundOffset = 0;

// User state
let currentUser = null;
let allUsers = JSON.parse(localStorage.getItem("flappyBirdUsers")) || [];

// Images
const birdImg = new Image();
birdImg.src = "https://i.imgur.com/QNbkV3q.png";

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

/* AUTHENTICATION FUNCTIONS */

function saveUsersToLocalStorage() {
  localStorage.setItem("flappyBirdUsers", JSON.stringify(allUsers));
}

function handleLogin(username, password) {
  loginError.textContent = "";
  loginMessage.textContent = "";

  if (!username || !password) {
    loginError.textContent = "Please enter both fields";
    return false;
  }

  const user = allUsers.find(u => u.username === username);

  if (!user) {
    loginMessage.textContent = "Username not found. Please sign up.";
    return false;
  }

  if (user.password !== password) {
    loginError.textContent = "Incorrect password";
    return false;
  }

  currentUser = user;
  bestScore = user.bestScore || 0;
  playerNameElement.textContent = user.username;

  authModal.style.display = "none";
  gameContainer.style.display = "block";
  setup();

  return true;
}

function handleSignup(username, password, confirmPassword) {
  signupError.textContent = "";

  if (!username || !password || !confirmPassword) {
    signupError.textContent = "Please fill all fields";
    return false;
  }

  if (password !== confirmPassword) {
    signupError.textContent = "Passwords don't match";
    return false;
  }

  if (username.length < 3) {
    signupError.textContent = "Username too short (min 3 chars)";
    return false;
  }

  if (password.length < 6) {
    signupError.textContent = "Password too short (min 6 chars)";
    return false;
  }

  if (allUsers.some(u => u.username === username)) {
    signupError.textContent = "Username already exists";
    return false;
  }

  const newUser = {
    username,
    password,
    bestScore: 0
  };

  allUsers.push(newUser);
  saveUsersToLocalStorage();
  currentUser = newUser;
  bestScore = 0;
  playerNameElement.textContent = newUser.username;
  updateLeaderboard();

  authModal.style.display = "none";
  gameContainer.style.display = "block";
  setup();

  return true;
}

function handleLogout() {
  currentUser = null;
  gamePlaying = false;
  playerNameElement.textContent = "Guest";
  authModal.style.display = "flex";
  gameContainer.style.display = "none";
  loginForm.reset();
  signupForm.reset();
  loginError.textContent = "";
  signupError.textContent = "";
  loginMessage.textContent = "";
}

function updateLeaderboard() {
  if (allUsers.length === 0) {
    topPlayersList.innerHTML = "<li>No scores yet!</li>";
    return;
  }

  const sortedUsers = [...allUsers].sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0)).slice(0, 5);
  topPlayersList.innerHTML = sortedUsers.map((user, index) => 
    `<li>${index + 1}. ${user.username}: ${user.bestScore || 0}</li>`
  ).join("");
}

/* GAME FUNCTIONS */

function setup() {
  currentScore = 0;
  flight = jump;
  flyHeight = canvas.height / 2 - birdHeight / 2;
  pipes = Array(3)
    .fill()
    .map((a, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);

  updateScoreDisplay();
}

function pipeLoc() {
  const minHeight = canvas.height * 0.1;
  const maxHeight = canvas.height * 0.6;
  return minHeight + Math.random() * (maxHeight - minHeight);
}

function updateScoreDisplay() {
  bestScoreElement.textContent = `Best: ${bestScore}`;
  currentScoreElement.textContent = `Score: ${currentScore}`;
}

function updatePipeColor() {
  const colors = ['#e94560', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
  const colorIndex = Math.floor(currentScore / 10) % colors.length;
  pipeColor = colors[colorIndex];
}

function drawBird(x, y) {
  ctx.save();
  const rotation = Math.min(Math.max(flight * 3, -25), 25);
  ctx.translate(x + birdWidth / 2, y + birdHeight / 2);
  ctx.rotate(rotation * Math.PI / 180);
  
  const wingFrame = Math.floor(index / 5) % 2;
  ctx.drawImage(
    birdImg,
    wingFrame * birdWidth, 0, birdWidth, birdHeight,
    -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight
  );
  
  ctx.restore();
}

function render() {
  index++;
  backgroundOffset = (backgroundOffset + speed / 3) % canvas.width;

  // Clear canvas
  ctx.fillStyle = "#4facfe";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#4facfe");
  skyGradient.addColorStop(1, "#00f2fe");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw clouds
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  for (let i = 0; i < 5; i++) {
    const x = (backgroundOffset + i * 200) % (canvas.width + 200) - 100;
    const y = canvas.height * 0.2 + Math.sin(index * 0.02 + i) * 20;
    drawCloud(x, y, 60, 30);
  }

  if (gamePlaying) {
    updatePipeColor();

    // Update and draw pipes
    pipes.forEach((pipe) => {
      pipe[0] -= speed;

      // Draw top pipe
      const topPipeGradient = ctx.createLinearGradient(pipe[0], 0, pipe[0] + pipeWidth, 0);
      topPipeGradient.addColorStop(0, pipeColor);
      topPipeGradient.addColorStop(1, lightenColor(pipeColor, 20));
      ctx.fillStyle = topPipeGradient;
      ctx.fillRect(pipe[0], 0, pipeWidth, pipe[1]);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe[0], 0, pipeWidth, pipe[1]);

      // Draw bottom pipe
      const bottomPipeGradient = ctx.createLinearGradient(pipe[0], pipe[1] + pipeGap, pipe[0] + pipeWidth, pipe[1] + pipeGap);
      bottomPipeGradient.addColorStop(0, pipeColor);
      bottomPipeGradient.addColorStop(1, lightenColor(pipeColor, 20));
      ctx.fillStyle = bottomPipeGradient;
      ctx.fillRect(pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] - pipeGap);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] - pipeGap);

      // Check if pipe passed
      if (pipe[0] <= -pipeWidth) {
        currentScore++;
        if (currentScore % 5 === 0) {
          sounds.score.currentTime = 0;
          sounds.score.play();
        }

        if (currentScore > bestScore) {
          bestScore = currentScore;
          if (currentUser) {
            currentUser.bestScore = bestScore;
            saveUsersToLocalStorage();
            updateLeaderboard();
          }
        }

        pipes = [
          ...pipes.slice(1),
          [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()]
        ];
      }

      // Collision detection
      const birdRight = canvas.width * 0.2 + birdWidth;
      const birdLeft = canvas.width * 0.2;
      const birdTop = flyHeight;
      const birdBottom = flyHeight + birdHeight;

      const pipeRight = pipe[0] + pipeWidth;
      const pipeLeft = pipe[0];
      const topPipeBottom = pipe[1];
      const bottomPipeTop = pipe[1] + pipeGap;

      if (
        birdRight > pipeLeft &&
        birdLeft < pipeRight &&
        (birdTop < topPipeBottom || birdBottom > bottomPipeTop)
      ) {
        gameOver();
      }
    });

    // Update bird position
    flight += gravity;
    flyHeight = Math.min(flyHeight + flight, canvas.height - birdHeight);

    // Draw bird
    drawBird(canvas.width * 0.2, flyHeight);

    // Bottom collision
    if (flyHeight >= canvas.height - birdHeight) {
      gameOver();
    }
  } else {
    // Draw idle bird
    flyHeight = canvas.height / 2 - birdHeight / 2;
    drawBird(canvas.width / 2 - birdWidth / 2, flyHeight + Math.sin(index * 0.05) * 5);

    // Draw start screen
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(canvas.width / 2 - 120, canvas.height / 2 - 60, 240, 120);
    
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 24px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText(`BEST: ${bestScore}`, canvas.width / 2, canvas.height / 2 - 15);
    
    ctx.fillStyle = "white";
    ctx.font = "bold 18px 'Press Start 2P'";
    ctx.fillText("TAP TO PLAY", canvas.width / 2, canvas.height / 2 + 30);
  }

  updateScoreDisplay();
  animationFrameId = window.requestAnimationFrame(render);
}

function drawCloud(x, y, width, height) {
  ctx.beginPath();
  ctx.arc(x, y, height / 2, 0, Math.PI * 2);
  ctx.arc(x + width * 0.3, y - height * 0.2, height * 0.6, 0, Math.PI * 2);
  ctx.arc(x + width * 0.6, y, height * 0.5, 0, Math.PI * 2);
  ctx.arc(x + width * 0.8, y + height * 0.1, height * 0.4, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)}`;
}

function gameOver() {
  if (!gamePlaying) return;

  gamePlaying = false;
  document.body.classList.remove("no-scroll");
  sounds.hit.play();

  finalScoreElement.textContent = `SCORE: ${currentScore}`;
  highScoreElement.textContent = `BEST: ${bestScore}`;
  gameOverElement.style.display = "block";

  restartBtn.disabled = true;
  restartBtn.classList.remove("active");
  isCountdownActive = true;
  let countdown = 3;
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

function startGame() {
  if (gamePlaying || isCountdownActive) return;

  gamePlaying = true;
  document.body.classList.add("no-scroll");
  gameOverElement.style.display = "none";
  setup();
  sounds.jump.play();
}

function handleInput(e) {
  if (e.type === 'touchstart' || (e.type === 'keydown' && e.code === 'Space')) {
    e.preventDefault();
  }

  if (isCountdownActive) return;

  if (gamePlaying) {
    flight = jump;
    sounds.jump.play();
  } else {
    startGame();
  }
}

/* EVENT LISTENERS */

function setupAuthEventListeners() {
  // Tab switching
  loginTab.addEventListener("click", (e) => {
    e.preventDefault();
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.style.display = "flex";
    signupForm.style.display = "none";
    loginError.textContent = "";
    loginMessage.textContent = "";
  });

  signupTab.addEventListener("click", (e) => {
    e.preventDefault();
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.style.display = "flex";
    loginForm.style.display = "none";
    signupError.textContent = "";
  });

  // Form submissions
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin(loginUsername.value, loginPassword.value);
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSignup(
      signupUsername.value, 
      signupPassword.value, 
      signupConfirmPassword.value
    );
  });

  logoutBtn.addEventListener("click", handleLogout);

  // Input focus handling
  [loginUsername, loginPassword, signupUsername, signupPassword, signupConfirmPassword].forEach(input => {
    input.addEventListener("focus", () => {
      gamePlaying = false;
    });
  });
}

function setupGameEventListeners() {
  // Mouse click
  canvas.addEventListener("click", handleInput);

  // Keyboard space
  document.addEventListener("keydown", (e) => {
    if ((e.code === "Space" || e.key === " ") && gameContainer.style.display === "block") {
      handleInput(e);
    }
  });

  // Touch controls
  canvas.addEventListener("touchstart", handleInput, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
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
}

// Initialize the game
function init() {
  loginForm.style.display = "flex";
  signupForm.style.display = "none";

  setupAuthEventListeners();
  setupGameEventListeners();
  updateLeaderboard();

  birdImg.onload = () => {
    setup();
    animationFrameId = window.requestAnimationFrame(render);
  };
  birdImg.onerror = () => console.error("Error loading bird image");
}

// Start the game
init();