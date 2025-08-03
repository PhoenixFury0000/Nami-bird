@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #1a1a2e;
  font-family: 'Press Start 2P', cursive;
  user-select: none;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

header {
  width: 100%;
  max-width: 431px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px 10px 0 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: -5px;
  z-index: 10;
}

h1 {
  padding: 1.2rem 0;
  margin: 0;
  color: #e94560;
  text-align: center;
  text-shadow: 2px 2px 0 #ffd166;
  letter-spacing: 2px;
  font-size: 1.5rem;
}

.score-container {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  background: #0f3460;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

#bestScore, #currentScore {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  font-size: 0.7rem;
}

#canvas {
  width: 100%;
  max-width: 431px;
  height: auto;
  aspect-ratio: 431/768;
  display: block;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.game-over {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  display: none;
  border: 4px solid #e94560;
  z-index: 100;
  width: 80%;
  max-width: 350px;
}

.game-over h2 {
  color: #ffd166;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.restart-btn {
  background: #e94560;
  border: none;
  padding: 12px 24px;
  font-family: 'Press Start 2P', cursive;
  font-size: 0.9rem;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  width: 100%;
}

.restart-btn:active {
  background: #ff7b9c;
  transform: scale(0.98);
}

.instructions {
  position: fixed;
  bottom: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
  text-align: center;
  width: 100%;
  padding: 0 1rem;
}

@media (max-width: 500px) {
  h1 {
    font-size: 1.2rem;
    padding: 0.8rem 0;
  }
  
  .game-over {
    padding: 1.5rem;
  }
  
  .game-over h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  
  .restart-btn {
    padding: 10px 20px;
    font-size: 0.8rem;
  }
}