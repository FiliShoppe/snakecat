// --- Elementos DOM ---
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const box = 20;
const maxX = canvas.width / box;
const maxY = canvas.height / box;
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreEl = document.getElementById("score");
const milestoneImg = document.getElementById("milestone-img");
const countdownEl = document.getElementById("countdown-warning");
const openGameBtn = document.getElementById("openGameBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModalBtn");
const milestoneOverlay = document.getElementById("milestone-overlay");
const touchControls = document.getElementById("touchControls");
const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const orientationWarning = document.getElementById('orientationWarning');

// --- Sons ---
const catSounds = [
  document.getElementById("catSound1"),
  document.getElementById("catSound2"),
  document.getElementById("catSound3"),
  document.getElementById("catSound4")
];
const bgMusic = document.getElementById("bgMusic");
const eatSound = document.getElementById("eatSound");
const dieSound = document.getElementById("dieSound");
const winMusic = document.getElementById("winMusic");

// --- Imagens dos blocos ---
const headImg = new Image(); headImg.src = "./assets/rosto_gato.png";
const bodyImg = new Image(); bodyImg.src = "./assets/espreguicando.png";
const tailImg = new Image(); tailImg.src = "./assets/pulando.png";
const foodImg = new Image(); foodImg.src = "./assets/peixe.png";

// --- Marcos ---
const milestones = {
  5: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  10: "https://images.pexels.com/photos/177809/pexels-photo-177809.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  15: "https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  20: "https://images.pexels.com/photos/617278/pexels-photo-617278.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  30: "https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
};

// --- Variáveis do jogo ---
let snake = [];
let food = {};
let direction = "right";
let gameLoop;
let score = 0;
let speed = 150;
let isRunning = false;
let gameEnded = false;
let keyHoldTimeout = null;
let isBoosted = false;
let normalSpeed = 150;
let touchHoldTimeout = null;
let currentTouchBtn = null;
let isMobileDevice = false;
let isPortraitMode = false;

// Invencibilidade
let isInvincible = false;
let invincibleTimer = null;
let invincibleEndTime = 0;
let invincibleFlashInterval = null;

// --- Configuração de velocidade ---
const DESKTOP_BASE_SPEED = 150;
const MOBILE_BASE_SPEED = 200;

// --- Utilitários ---
function playCatSound() {
  catSounds.forEach(sound => sound.pause());
  const randomIndex = Math.floor(Math.random() * catSounds.length);
  const sound = catSounds[randomIndex];
  sound.currentTime = 0;
  sound.play().catch(() => {});
}
function updateScore() {
  scoreEl.innerText = "Pontos: " + score;
}
function detectMobileDevice() {
  isMobileDevice = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isMobileDevice;
}
function setAppropriateSpeed() {
  if (detectMobileDevice()) {
    speed = MOBILE_BASE_SPEED;
    normalSpeed = MOBILE_BASE_SPEED;
  } else {
    speed = DESKTOP_BASE_SPEED;
    normalSpeed = DESKTOP_BASE_SPEED;
  }
}
function preloadImages() {
  for (const points in milestones) {
    const img = new Image();
    img.src = milestones[points];
  }
}
preloadImages();

// --- Invencibilidade ---
function applyInvincibility(seconds) {
  isInvincible = true;
  invincibleEndTime = Date.now() + (seconds * 1000);
  if (invincibleTimer) clearTimeout(invincibleTimer);
  if (invincibleFlashInterval) clearInterval(invincibleFlashInterval);
  let flashState = true;
  invincibleFlashInterval = setInterval(() => {
    if (!isInvincible) {
      clearInterval(invincibleFlashInterval);
      canvas.style.opacity = "1";
      return;
    }
    flashState = !flashState;
    canvas.style.opacity = flashState ? "1" : "0.7";
  }, 200);
  invincibleTimer = setTimeout(() => {
    isInvincible = false;
    canvas.style.opacity = "1";
    clearInterval(invincibleFlashInterval);
  }, seconds * 1000);
}

// --- Funções principais ---
function resetGame() {
  if (gameLoop) clearInterval(gameLoop);
  snake = [{ x: 10, y: 10 }];
  direction = "right";
  score = 0;
  setAppropriateSpeed();
  isBoosted = false;
  isRunning = false;
  gameEnded = false;
  updateScore();
  placeFood();
  milestoneImg.style.display = "none";
  countdownEl.style.display = "none";
  milestoneOverlay.style.display = "none";
  restartBtn.style.display = "none";
  bgMusic.pause(); bgMusic.currentTime = 0;
  winMusic.pause(); winMusic.currentTime = 0;
  catSounds.forEach(sound => { sound.pause(); sound.currentTime = 0; });
  clearTimeout(keyHoldTimeout);
  clearTimeout(touchHoldTimeout);
  if (currentTouchBtn) {
    currentTouchBtn.classList.remove('boosted');
    currentTouchBtn = null;
  }
  // Limpar invencibilidade
  isInvincible = false;
  if (invincibleTimer) clearTimeout(invincibleTimer);
  if (invincibleFlashInterval) clearInterval(invincibleFlashInterval);
  canvas.style.opacity = "1";
  
  // Não precisa chamar clearInterval(gameLoop) novamente
  draw(); // Desenhar estado inicial
}
function placeFood() {
  food = {
    x: Math.floor(Math.random() * maxX),
    y: Math.floor(Math.random() * maxY)
  };
}
function adjustSpeed() {
  // Fator de velocidade depende do dispositivo
  const speedFactor = isMobileDevice ? 1.1 : 1.2;
  if ([10, 20, 30, 40, 60, 70, 80, 90].includes(score)) {
    speed = Math.floor(speed / speedFactor);
    normalSpeed = speed;
    restartLoop();
  }
}
function restartLoop() {
  clearInterval(gameLoop);
  gameLoop = setInterval(draw, speed);
}
function pauseGame() {
  if (isRunning) {
    clearInterval(gameLoop);
    isRunning = false;
    bgMusic.pause();
    // Pausar invencibilidade
    if (isInvincible) {
      invincibleEndTime = Math.max(0, invincibleEndTime - Date.now());
      clearInterval(invincibleFlashInterval);
      canvas.style.opacity = "1";
    }
  }
}
function resumeGame() {
  if (!isRunning && !gameEnded && score < 30) {
    gameLoop = setInterval(draw, speed);
    isRunning = true;
    bgMusic.play().catch(() => {});
    // Retomar invencibilidade
    if (isInvincible && invincibleEndTime > 0) {
      invincibleEndTime = Date.now() + invincibleEndTime;
      let flashState = true;
      invincibleFlashInterval = setInterval(() => {
        if (!isInvincible) {
          clearInterval(invincibleFlashInterval);
          canvas.style.opacity = "1";
          return;
        }
        flashState = !flashState;
        canvas.style.opacity = flashState ? "1" : "0.7";
      }, 200);
      const remainingTime = Math.max(0, invincibleEndTime - Date.now());
      invincibleTimer = setTimeout(() => {
        isInvincible = false;
        canvas.style.opacity = "1";
        clearInterval(invincibleFlashInterval);
      }, remainingTime);
    }
  }
}
function showMilestoneImage(pontos) {
  const imgSrc = milestones[pontos];
  if (!imgSrc) return;
  pauseGame();
  playCatSound();
  milestoneImg.src = imgSrc;
  milestoneImg.style.display = "block";
  milestoneOverlay.style.display = "block";
  let counter = 10;
  countdownEl.style.display = "none";
  const timer = setInterval(() => {
    counter--;
    if (counter <= 5) {
      countdownEl.style.display = "block";
      countdownEl.innerText = `O jogo voltará em ${counter}...`;
    }
    if (counter === 0) {
      countdownEl.style.display = "none";
      milestoneImg.style.display = "none";
      milestoneOverlay.style.display = "none";
      resumeGame();
      applyInvincibility(3);
      clearInterval(timer);
    }
  }, 1000);
}
function endGame() {
  bgMusic.pause(); bgMusic.currentTime = 0;
  winMusic.currentTime = 0; winMusic.play();
  pauseGame();
  gameEnded = true;
  milestoneImg.src = milestones[30];
  milestoneImg.style.display = "block";
  milestoneOverlay.style.display = "block";
  restartBtn.style.display = "inline-block";
  playCatSound();
  setTimeout(() => {
    alert("🎉 Parabéns! Você venceu com 30 pontos! 🎉");
  }, 100);
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(foodImg, food.x * box, food.y * box, box, box);
  let head = { ...snake[0] };
  if (direction === "right") head.x++;
  if (direction === "left") head.x--;
  if (direction === "up") head.y--;
  if (direction === "down") head.y++;
  // Colisão
  if (!isInvincible && (
    head.x < 0 || head.y < 0 ||
    head.x >= maxX || head.y >= maxY ||
    snake.some(s => s.x === head.x && s.y === head.y)
  )) {
    dieSound.currentTime = 0;
    dieSound.play();
    bgMusic.pause(); bgMusic.currentTime = 0;
    clearInterval(gameLoop);
    setTimeout(() => {
      alert("Game Over! Pontuação: " + score);
      resetGame();
    }, 100);
    return;
  }
  // Invencível: atravessa paredes
  if (isInvincible) {
    if (head.x < 0) head.x = maxX - 1;
    if (head.y < 0) head.y = maxY - 1;
    if (head.x >= maxX) head.x = 0;
    if (head.y >= maxY) head.y = 0;
    // Indicador visual
    const remainingInvincibleTime = Math.max(0, Math.floor((invincibleEndTime - Date.now()) / 1000));
    if (remainingInvincibleTime > 0) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,0,0.3)";
      ctx.fillRect(0, 0, canvas.width, 30);
      ctx.fillStyle = "black";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Invencível: ${remainingInvincibleTime}s`, canvas.width / 2, 22);
      ctx.restore();
    }
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    eatSound.currentTime = 0; eatSound.play();
    score++; updateScore(); placeFood(); adjustSpeed();
    if (score === 30) endGame();
    else if ([5, 10, 15, 20].includes(score)) showMilestoneImage(score);
  } else {
    snake.pop();
  }
  for (let i = 1; i < snake.length - 1; i++) {
    ctx.drawImage(bodyImg, snake[i].x * box, snake[i].y * box, box, box);
  }
  if (snake.length > 1) {
    const tail = snake[snake.length - 1];
    ctx.drawImage(tailImg, tail.x * box, tail.y * box, box, box);
  }
  ctx.drawImage(headImg, snake[0].x * box, snake[0].y * box, box, box);
}

// --- Boost ---
function applyBoost() {
  if (isRunning && !isBoosted) {
    isBoosted = true;
    normalSpeed = speed;
    const boostFactor = isMobileDevice ? 1.5 : 2;
    speed = Math.floor(speed / boostFactor);
    restartLoop();
  }
}
function removeBoost() {
  if (isBoosted) {
    isBoosted = false;
    speed = normalSpeed;
    restartLoop();
  }
}

// --- Direção ---
function changeDirection(newDir) {
  if (!isRunning) return false;
  if (newDir === "up" && direction !== "down") { direction = "up"; return true; }
  if (newDir === "down" && direction !== "up") { direction = "down"; return true; }
  if (newDir === "left" && direction !== "right") { direction = "left"; return true; }
  if (newDir === "right" && direction !== "left") { direction = "right"; return true; }
  return false;
}

// --- Listeners teclado ---
document.addEventListener("keydown", (e) => {
  if (!isRunning) return;
  const key = e.key.toLowerCase();
  let newDirection = direction;
  if (key === "w" || key === "arrowup") newDirection = "up";
  else if (key === "s" || key === "arrowdown") newDirection = "down";
  else if (key === "a" || key === "arrowleft") newDirection = "left";
  else if (key === "d" || key === "arrowright") newDirection = "right";
  else return;
  if (changeDirection(newDirection)) {
    clearTimeout(keyHoldTimeout);
    keyHoldTimeout = setTimeout(() => { applyBoost(); }, 2000);
  }
});
document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    clearTimeout(keyHoldTimeout);
    removeBoost();
  }
});

// --- Listeners toque e mouse nos botões ---
["up", "down", "left", "right"].forEach(dir => {
  const btn = { up: upBtn, down: downBtn, left: leftBtn, right: rightBtn }[dir];
  btn.addEventListener("touchstart", e => {
    e.preventDefault(); e.stopPropagation();
    if (!isRunning) return;
    if (changeDirection(dir)) {
      currentTouchBtn = btn;
      clearTimeout(touchHoldTimeout);
      touchHoldTimeout = setTimeout(() => {
        if (currentTouchBtn === btn) {
          btn.classList.add('boosted');
          applyBoost();
        }
      }, 2000);
    }
  });
  btn.addEventListener("touchend", e => {
    e.preventDefault(); e.stopPropagation();
    if (currentTouchBtn === btn) {
      btn.classList.remove('boosted');
      clearTimeout(touchHoldTimeout);
      removeBoost();
      currentTouchBtn = null;
    }
  });
  btn.addEventListener("mousedown", () => {
    if (!isRunning) return;
    if (changeDirection(dir)) {
      currentTouchBtn = btn;
      clearTimeout(touchHoldTimeout);
      touchHoldTimeout = setTimeout(() => {
        btn.classList.add('boosted');
        applyBoost();
      }, 2000);
    }
  });
});
document.addEventListener("mouseup", () => {
  if (currentTouchBtn) {
    currentTouchBtn.classList.remove('boosted');
    clearTimeout(touchHoldTimeout);
    removeBoost();
    currentTouchBtn = null;
  }
});

// --- Modal e tela cheia ---
openGameBtn.addEventListener("click", () => {
  modalOverlay.style.display = "flex";
  setTimeout(() => { handleOrientation(); adjustModalSize(); resizeCanvas(); }, 10);
});
closeModalBtn.addEventListener("click", () => {
  modalOverlay.style.display = "none";
  if (isRunning) { clearInterval(gameLoop); isRunning = false; bgMusic.pause(); }
  winMusic.pause(); winMusic.currentTime = 0;
  catSounds.forEach(sound => { sound.pause(); sound.currentTime = 0; });
});
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', toggleFullScreen);
}
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    if (modalContent.requestFullscreen) modalContent.requestFullscreen();
    else if (modalContent.webkitRequestFullscreen) modalContent.webkitRequestFullscreen();
    modalContent.classList.add('fullscreen');
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    modalContent.classList.remove('fullscreen');
  }
  setTimeout(() => { resizeCanvas(); adjustGamepadPosition(); }, 100);
}
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) modalContent.classList.remove('fullscreen');
});

// --- Responsividade e orientação ---
function handleOrientation() {
  if (isMobileDevice) {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (modalOverlay.style.display === "flex") {
      if (isPortrait && !isPortraitMode) {
        isPortraitMode = true;
        if (orientationWarning) {
          orientationWarning.style.display = "flex";
          document.body.classList.add("portrait-mode");
        }
        if (isRunning) pauseGame();
      } else if (!isPortrait && isPortraitMode) {
        isPortraitMode = false;
        if (orientationWarning) {
          orientationWarning.style.display = "none";
          document.body.classList.remove("portrait-mode");
        }
      }
    }
  }
  resizeCanvas();
  adjustGamepadPosition();
}
function resizeCanvas() {
  if (!modalContent) return;
  const isDesktop = window.innerWidth >= 1100;
  const isMediumScreen = window.innerWidth >= 769 && window.innerWidth < 1100;
  const isMobile = window.innerWidth < 769;
  if (isDesktop) {
    canvas.style.width = '1000px';
    canvas.style.height = '400px';
  } else if (isMediumScreen) {
    const modalWidth = modalContent.clientWidth - 40;
    const newWidth = Math.min(modalWidth * 0.9, 1000);
    const aspectRatio = canvas.width / canvas.height;
    const newHeight = newWidth / aspectRatio;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
  } else {
    const modalWidth = modalContent.clientWidth - 16;
    const aspectRatio = canvas.width / canvas.height;
    const newWidth = modalWidth;
    const newHeight = newWidth / aspectRatio;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
  }
 
}
function adjustModalSize() {
  if (!modalContent) return;
  if (window.innerWidth >= 1100) modalContent.style.width = '1080px';
  else modalContent.style.width = '90%';
}
function adjustGamepadPosition() {
  const gamepadContainer = document.querySelector('.gamepad-container');
  const controls = document.querySelector('.controls');
  if (!gamepadContainer || !controls) return;
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isMobileDevice && isLandscape) {
    gamepadContainer.style.position = 'absolute';
    gamepadContainer.style.left = '10px';
    gamepadContainer.style.bottom = '10px';
    controls.style.position = 'absolute';
    controls.style.right = '10px';
    controls.style.bottom = '10px';
    controls.style.display = 'grid';
  } else {
    gamepadContainer.style.position = '';
    gamepadContainer.style.left = '';
    gamepadContainer.style.bottom = '';
    controls.style.position = '';
    controls.style.right = '';
    controls.style.bottom = '';
  }
}

// --- Inicialização ---
window.addEventListener('load', function() {
  detectMobileDevice();
  setAppropriateSpeed();
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    if (touchControls) touchControls.style.display = "block";
    adjustGamepadPosition();
  }
  handleOrientation();
  adjustModalSize();
  resizeCanvas();
  resetGame();
});
window.addEventListener('resize', function() {
  detectMobileDevice();
  handleOrientation();
  adjustModalSize();
  resizeCanvas();
  if (isRunning && !isBoosted) {
    setAppropriateSpeed();
    restartLoop();
  }
});
window.addEventListener('orientationchange', function() {
  setTimeout(() => { handleOrientation(); }, 300);
});
document.body.addEventListener('touchmove', function(e) {
  if (modalOverlay.style.display === 'flex') e.preventDefault();
}, { passive: false });

startBtn.addEventListener("click", () => {
  if (gameLoop) clearInterval(gameLoop);
  resetGame();
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});
  gameLoop = setInterval(draw, speed);
  isRunning = true;
});
pauseBtn.addEventListener("click", pauseGame);
resumeBtn.addEventListener("click", resumeGame);
restartBtn.addEventListener("click", () => {
  resetGame();
  startBtn.click();
  milestoneImg.style.display = "none";
  milestoneOverlay.style.display = "none";
  restartBtn.style.display = "none";
});
