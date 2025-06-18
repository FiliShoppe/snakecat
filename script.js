// Sons de gato
const catSounds = [
  document.getElementById("catSound1"),
  document.getElementById("catSound2"),
  document.getElementById("catSound3"),
  document.getElementById("catSound4")
];
function playCatSound() {
  catSounds.forEach(sound => sound.pause());
  const randomIndex = Math.floor(Math.random() * catSounds.length);
  const sound = catSounds[randomIndex];
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

// Elementos DOM
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const box = 20;
let maxX = canvas.width / box;
let maxY = canvas.height / box;
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreEl = document.getElementById("score");
const milestoneImg = document.getElementById("milestone-img");
const countdownEl = document.getElementById("countdown-warning");
const openGameBtn = document.getElementById("openGameBtn");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const milestoneOverlay = document.getElementById("milestone-overlay");
const touchControls = document.getElementById("touchControls");
const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Variáveis do jogo
let snake = [];
let food = {};
let direction = "right";
let gameLoop;
let score = 0;
let speed = 150;
let isRunning = false;
let gameEnded = false;
let keyPressStart = null;
let keyHoldTimeout = null;
let isBoosted = false;
let normalSpeed = 150;
let touchStartTime = null;
let touchHoldTimeout = null;
let currentTouchBtn = null;

// Configuração de velocidade por dispositivo
const DESKTOP_BASE_SPEED = 150;
const MOBILE_BASE_SPEED = 300;
let isMobileDevice = false;

// Imagens dos blocos
const headImg = new Image();
headImg.src = "./assets/rosto_gato.png";
const bodyImg = new Image();
bodyImg.src = "./assets/espreguicando.png";
const tailImg = new Image();
tailImg.src = "./assets/pulando.png";
const foodImg = new Image();
foodImg.src = "./assets/peixe.png";

// Imagens dos marcos
const milestones = {
  5: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  10: "https://images.pexels.com/photos/177809/pexels-photo-177809.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  15: "https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  20: "https://images.pexels.com/photos/617278/pexels-photo-617278.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  30: "https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
};

// Pré-carregar imagens dos marcos
function preloadImages() {
  Object.values(milestones).forEach(src => {
    const img = new Image();
    img.src = src;
  });
}
preloadImages();

// Áudios
const bgMusic = document.getElementById("bgMusic");
const eatSound = document.getElementById("eatSound");
const dieSound = document.getElementById("dieSound");
const winMusic = document.getElementById("winMusic");

// Modal
openGameBtn.addEventListener("click", () => {
  modalOverlay.style.display = "flex";
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});
});
closeModalBtn.addEventListener("click", () => {
  modalOverlay.style.display = "none";
  bgMusic.pause();
  endGame();
});

// Tratamento de erro para imagens de marco
milestoneImg.onerror = function() {
  milestoneImg.style.display = "none";
  showImageErrorMessage();
};
function showImageErrorMessage() {
  milestoneImg.style.display = "block";
  milestoneImg.alt = "Erro ao carregar imagem do gatinho";
  milestoneImg.src = "";
  milestoneImg.style.background = "#fff";
  milestoneImg.style.border = "2px solid red";
}

// Atualiza a pontuação
function updateScore() {
  scoreEl.textContent = `Pontos: ${score}`;
}

// Detecta dispositivo móvel
function detectMobileDevice() {
  isMobileDevice = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isMobileDevice;
}

// Ajusta velocidade base
function setAppropriateSpeed() {
  if (detectMobileDevice()) {
    speed = MOBILE_BASE_SPEED;
    normalSpeed = MOBILE_BASE_SPEED;
  } else {
    speed = DESKTOP_BASE_SPEED;
    normalSpeed = DESKTOP_BASE_SPEED;
  }
}

// Reinicia o jogo
function resetGame() {
  snake = [{ x: 5, y: 5 }];
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
  bgMusic.pause();
  bgMusic.currentTime = 0;
  winMusic.pause();
  winMusic.currentTime = 0;
  catSounds.forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });
  clearTimeout(keyHoldTimeout);
  clearTimeout(touchHoldTimeout);
  if (currentTouchBtn) {
    currentTouchBtn.classList.remove('boosted');
    currentTouchBtn = null;
  }
  clearInterval(gameLoop);
  draw();
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
}

// Posiciona a comida
function placeFood() {
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * maxX),
      y: Math.floor(Math.random() * maxY)
    };
    valid = !snake.some(seg => seg.x === food.x && seg.y === food.y);
  }
}

// Reinicia o loop do jogo
function restartLoop() {
  clearInterval(gameLoop);
  if (isRunning) {
    gameLoop = setInterval(draw, speed);
  }
}

// Pausa o jogo
function pauseGame() {
  isRunning = false;
  clearInterval(gameLoop);
  bgMusic.pause();
  pauseBtn.disabled = true;
  resumeBtn.disabled = false;
}

// Continua o jogo
function resumeGame() {
  if (!gameEnded) {
    isRunning = true;
    restartLoop();
    bgMusic.play().catch(() => {});
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  }
}

// Mostra imagem de marco
function showMilestoneImage(pontos) {
  milestoneOverlay.style.display = "block";
  milestoneImg.src = milestones[pontos];
  milestoneImg.style.display = "block";
  playCatSound();
  let countdown = 5;
  countdownEl.textContent = `O jogo voltará em ${countdown}...`;
  countdownEl.style.display = "block";
  let interval = setInterval(() => {
    countdown--;
    countdownEl.textContent = `O jogo voltará em ${countdown}...`;
    if (countdown <= 0) {
      clearInterval(interval);
      milestoneOverlay.style.display = "none";
      milestoneImg.style.display = "none";
      countdownEl.style.display = "none";
      resumeGame();
    }
  }, 1000);
  pauseGame();
}

// Finaliza o jogo
function endGame() {
  isRunning = false;
  clearInterval(gameLoop);
  gameEnded = true;
  bgMusic.pause();
  dieSound.play().catch(() => {});
  restartBtn.style.display = "inline-block";
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
}

// Desenha o jogo
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenha a comida
  ctx.drawImage(foodImg, food.x * box, food.y * box, box, box);

  // Desenha a cobra
  for (let i = 0; i < snake.length; i++) {
    let img = bodyImg;
    if (i === 0) img = headImg;
    else if (i === snake.length - 1) img = tailImg;
    ctx.drawImage(img, snake[i].x * box, snake[i].y * box, box, box);
  }

  // Move a cobra
  let head = { ...snake[0] };
  if (direction === "right") head.x++;
  if (direction === "left") head.x--;
  if (direction === "up") head.y--;
  if (direction === "down") head.y++;

  // Colisão com parede ou corpo
  if (
    head.x < 0 || head.x >= maxX ||
    head.y < 0 || head.y >= maxY ||
    snake.some(seg => seg.x === head.x && seg.y === head.y)
  ) {
    endGame();
    return;
  }

  snake.unshift(head);

  // Comer comida
  if (head.x === food.x && head.y === food.y) {
    score++;
    updateScore();
    eatSound.currentTime = 0;
    eatSound.play().catch(() => {});
    placeFood();

    // Marco de pontos
    if (milestones[score]) {
      showMilestoneImage(score);
    }
    // Vitória
    if (score === 30) {
      winMusic.play().catch(() => {});
      endGame();
      alert("Parabéns! Você venceu!");
      return;
    }
  } else {
    snake.pop();
  }
}

// Controle de direção com teclado e boost
document.addEventListener("keydown", (e) => {
  if (!isRunning) return;
  const key = e.key.toLowerCase();
  let newDirection = direction;
  if ((key === "arrowup" || key === "w") && direction !== "down") newDirection = "up";
  else if ((key === "arrowdown" || key === "s") && direction !== "up") newDirection = "down";
  else if ((key === "arrowleft" || key === "a") && direction !== "right") newDirection = "left";
  else if ((key === "arrowright" || key === "d") && direction !== "left") newDirection = "right";
  else return;

  if (direction !== newDirection) {
    direction = newDirection;
    clearTimeout(keyHoldTimeout);
    keyPressStart = Date.now();
    keyHoldTimeout = setTimeout(() => {
      if (isRunning && !isBoosted) {
        isBoosted = true;
        normalSpeed = speed;
        speed = Math.floor(speed / (isMobileDevice ? 1.5 : 2));
        restartLoop();
        canvas.classList.add("boosted");
      }
    }, 2000);
  }
});
document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    clearTimeout(keyHoldTimeout);
    if (isBoosted) {
      isBoosted = false;
      speed = normalSpeed;
      restartLoop();
      canvas.classList.remove("boosted");
    }
  }
});

// Suporte a toque (mobile)
function handleTouchStart(btn, dir) {
  return function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isRunning) return;
    if (direction !== dir) {
      direction = dir;
      clearTimeout(touchHoldTimeout);
      touchStartTime = Date.now();
      currentTouchBtn = btn;
      touchHoldTimeout = setTimeout(() => {
        if (isRunning && !isBoosted && currentTouchBtn === btn) {
          isBoosted = true;
          normalSpeed = speed;
          speed = Math.floor(speed / (isMobileDevice ? 1.5 : 2));
          restartLoop();
          btn.classList.add("boosted");
        }
      }, 2000);
    }
  };
}
function handleTouchEnd(btn) {
  return function (e) {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(touchHoldTimeout);
    if (isBoosted && currentTouchBtn === btn) {
      isBoosted = false;
      speed = normalSpeed;
      restartLoop();
      btn.classList.remove("boosted");
      currentTouchBtn = null;
    }
  };
}
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  touchControls.style.display = "block";
  upBtn.addEventListener("touchstart", handleTouchStart(upBtn, "up"));
  downBtn.addEventListener("touchstart", handleTouchStart(downBtn, "down"));
  leftBtn.addEventListener("touchstart", handleTouchStart(leftBtn, "left"));
  rightBtn.addEventListener("touchstart", handleTouchStart(rightBtn, "right"));
  upBtn.addEventListener("touchend", handleTouchEnd(upBtn));
  downBtn.addEventListener("touchend", handleTouchEnd(downBtn));
  leftBtn.addEventListener("touchend", handleTouchEnd(leftBtn));
  rightBtn.addEventListener("touchend", handleTouchEnd(rightBtn));
}

// Adapta o canvas ao tamanho da tela (única versão)
function resizeCanvas() {
  const modalContent = document.getElementById("modalContent");
  if (!modalContent) return;
  const isMobile = window.innerWidth < 768;
  const modalWidth = modalContent.clientWidth - (isMobile ? 20 : 40);
  const aspectRatio = 1000 / 400;
  let newWidth = isMobile ? modalWidth : Math.min(modalWidth, 1100);
  let newHeight = newWidth / aspectRatio;
  canvas.width = newWidth;
  canvas.height = newHeight;
  maxX = Math.floor(canvas.width / box);
  maxY = Math.floor(canvas.height / box);
  draw();
  if (isMobile && touchControls) {
    touchControls.style.marginTop = '5px';
  } else if (touchControls) {
    touchControls.style.marginTop = '15px';
  }
}
window.addEventListener('load', () => {
  detectMobileDevice();
  setAppropriateSpeed();
  resizeCanvas();
  if (isMobileDevice && touchControls) touchControls.style.display = "block";
});
window.addEventListener('resize', () => {
  detectMobileDevice();
  resizeCanvas();
  if (isRunning && !isBoosted) {
    setAppropriateSpeed();
    restartLoop();
  }
});

// Botões de controle
startBtn.addEventListener("click", () => {
  resetGame();
  isRunning = true;
  restartLoop();
  bgMusic.play().catch(() => {});
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
});
pauseBtn.addEventListener("click", pauseGame);
resumeBtn.addEventListener("click", resumeGame);
restartBtn.addEventListener("click", () => {
  resetGame();
  isRunning = true;
  restartLoop();
  bgMusic.play().catch(() => {});
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
});

// Inicialização
resetGame();
