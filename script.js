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

// Variáveis de configuração
const DESKTOP_BASE_SPEED = 150; // Velocidade base para desktop
const MOBILE_BASE_SPEED = 200;  // Velocidade base para mobile (mais lenta)

// Sons de gatos
const catSounds = [
  document.getElementById("catSound1"),
  document.getElementById("catSound2"),
  document.getElementById("catSound3"),
  document.getElementById("catSound4")
];

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
let normalSpeed = 150; // Velocidade base do jogo
let touchStartTime = null;
let touchHoldTimeout = null;
let currentTouchBtn = null;
let isMobileDevice = false;
let isPortraitMode = false;

// Detectar se o dispositivo é móvel
function detectMobileDevice() {
  isMobileDevice = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isMobileDevice;
}

// Ajustar a velocidade base de acordo com o tipo de dispositivo
function setAppropriateSpeed() {
  if (detectMobileDevice()) {
    speed = MOBILE_BASE_SPEED;
    normalSpeed = MOBILE_BASE_SPEED;
  } else {
    speed = DESKTOP_BASE_SPEED;
    normalSpeed = DESKTOP_BASE_SPEED;
  }
}

// Função para verificar e lidar com a orientação do dispositivo
function handleOrientation() {
  // Verificamos se é um dispositivo móvel
  if (isMobileDevice) {
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // Se o modal está aberto, verificamos orientação
    if (modalOverlay.style.display === "flex") {
      if (isPortrait && !isPortraitMode) {
        // Está em modo retrato/vertical, mostrar aviso
        isPortraitMode = true;
        showOrientationWarning();
        
        // Pausar o jogo se estiver rodando
        if (isRunning) {
          pauseGame();
        }
      } else if (!isPortrait && isPortraitMode) {
        // Mudou para paisagem/horizontal, esconder aviso
        isPortraitMode = false;
        hideOrientationWarning();
      }
    }
  }
  
  // Ajustar layout para a orientação atual
  resizeCanvas();
  adjustGamepadPosition();
}

// Função para mostrar o aviso de orientação
function showOrientationWarning() {
  if (orientationWarning) {
    orientationWarning.style.display = "flex";
    document.body.classList.add("portrait-mode");
  }
}

// Função para esconder o aviso de orientação
function hideOrientationWarning() {
  if (orientationWarning) {
    orientationWarning.style.display = "none";
    document.body.classList.remove("portrait-mode");
  }
}

// Adaptar canvas para o tamanho da tela
function resizeCanvas() {
  if (!modalContent) return;
  
  // Determinar se estamos em mobile ou desktop
  const isDesktop = window.innerWidth >= 1100;
  const isMediumScreen = window.innerWidth >= 769 && window.innerWidth < 1100;
  const isMobile = window.innerWidth < 769;
  
  if (isDesktop) {
    // Em desktop grande, manter exatamente 1000x400 pixels
    canvas.style.width = '1000px';
    canvas.style.height = '400px';
  } else if (isMediumScreen) {
    // Em telas médias, usar uma porcentagem da largura mas manter proporção
    const modalWidth = modalContent.clientWidth - 40;
    const newWidth = Math.min(modalWidth * 0.9, 1000);
    const aspectRatio = canvas.width / canvas.height;
    const newHeight = newWidth / aspectRatio;
    
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
  } else {
    // Em mobile, utilizar mais espaço da tela
    const modalWidth = modalContent.clientWidth - 16; // Padding menor
    const aspectRatio = canvas.width / canvas.height;
    const newWidth = modalWidth;
    const newHeight = newWidth / aspectRatio;
    
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
  }
}

// Função para ajustar o tamanho do modal
function adjustModalSize() {
  if (!modalContent) return;
  
  if (window.innerWidth >= 1100) {
    // Para desktop grande, definir largura fixa
    modalContent.style.width = '1080px';
  } else {
    // Para telas menores, usar porcentagem
    modalContent.style.width = '90%';
  }
}

// Função para ajustar posição do gamepad
function adjustGamepadPosition() {
  const gamepadContainer = document.querySelector('.gamepad-container');
  const controls = document.querySelector('.controls');
  
  if (!gamepadContainer || !controls) return;
  
  const isLandscape = window.innerWidth > window.innerHeight;
  
  if (isMobileDevice && isLandscape) {
    // Em paisagem em dispositivos móveis, posicionamento lateral
    gamepadContainer.style.position = 'absolute';
    gamepadContainer.style.left = '10px';
    gamepadContainer.style.bottom = '10px';
    
    controls.style.position = 'absolute';
    controls.style.right = '10px';
    controls.style.bottom = '10px';
    controls.style.display = 'grid';
  } else {
    // Configuração padrão
    gamepadContainer.style.position = '';
    gamepadContainer.style.left = '';
    gamepadContainer.style.bottom = '';
    
    controls.style.position = '';
    controls.style.right = '';
    controls.style.bottom = '';
  }
}

// Inicializar e ajustar controles de toque
function setupTouchControls() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice || window.innerWidth <= 768) {
    if (touchControls) touchControls.style.display = "block";
    adjustGamepadPosition();
  }
}

// Imagens dos blocos
const headImg = new Image();
headImg.src = "./assets/rosto_gato.png";
const bodyImg = new Image();
bodyImg.src = "./assets/espreguicando.png";
const tailImg = new Image();
tailImg.src = "./assets/pulando.png";
const foodImg = new Image();
foodImg.src = "./assets/peixe.png";

const milestones = {
  5: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  10: "https://images.pexels.com/photos/177809/pexels-photo-177809.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  15: "https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  20: "https://images.pexels.com/photos/617278/pexels-photo-617278.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  30: "https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
};

// Pré-carregar imagens dos marcos
function preloadImages() {
  for (const points in milestones) {
    const img = new Image();
    img.src = milestones[points];
  }
}
preloadImages();

// Função para tocar som de gato aleatório
function playCatSound() {
  catSounds.forEach(sound => sound.pause());
  const randomIndex = Math.floor(Math.random() * catSounds.length);
  const sound = catSounds[randomIndex];
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

// Audios
const bgMusic = document.getElementById("bgMusic");
const eatSound = document.getElementById("eatSound");
const dieSound = document.getElementById("dieSound");
const winMusic = document.getElementById("winMusic");

// Função para ajustar áudio em dispositivos móveis
function setupMobileAudio() {
  // iOS e alguns navegadores requerem uma interação do usuário antes de reproduzir áudio
  bgMusic.load();
  eatSound.load();
  dieSound.load();
  winMusic.load();
  
  // Carregar sons de gatos
  catSounds.forEach(sound => sound.load());
  
  // Definir volumes mais baixos para dispositivos móveis
  if (isMobileDevice) {
    bgMusic.volume = 0.5;
    eatSound.volume = 0.6;
    dieSound.volume = 0.7;
    winMusic.volume = 0.6;
    catSounds.forEach(sound => sound.volume = 0.7);
  }
}

// Função para alternar tela cheia
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    // Entrar em tela cheia
    if (modalContent.requestFullscreen) {
      modalContent.requestFullscreen();
    } else if (modalContent.mozRequestFullScreen) { // Firefox
      modalContent.mozRequestFullScreen();
    } else if (modalContent.webkitRequestFullscreen) { // Chrome, Safari, Opera
      modalContent.webkitRequestFullscreen();
    } else if (modalContent.msRequestFullscreen) { // IE/Edge
      modalContent.msRequestFullscreen();
    }
    modalContent.classList.add('fullscreen');
  } else {
    // Sair da tela cheia
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    modalContent.classList.remove('fullscreen');
  }
  
  // Ajustar tamanhos após mudar o modo de tela
  setTimeout(() => {
    resizeCanvas();
    adjustGamepadPosition();
  }, 100);
}

// Event listener para mudança de estado da tela cheia
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    modalContent.classList.remove('fullscreen');
  }
});

// Controle do modal
openGameBtn.addEventListener("click", () => {
  modalOverlay.style.display = "flex";
  
  // Verificar orientação ao abrir o modal
  setTimeout(() => {
    handleOrientation();
    adjustModalSize();
    resizeCanvas();
  }, 10);
});

closeModalBtn.addEventListener("click", () => {
  modalOverlay.style.display = "none";
  if (isRunning) {
    clearInterval(gameLoop);
    isRunning = false;
    bgMusic.pause();
  }
  // Parar música de vitória também
  winMusic.pause();
  winMusic.currentTime = 0;
  // Parar sons de gatos também
  catSounds.forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });
});

// Botão de tela cheia
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', toggleFullScreen);
}

// Adicionar tratamento de erro para as imagens
milestoneImg.onerror = function() {
  console.error("Erro ao carregar imagem:", this.src);
  // Caso a imagem falhe, mostrar uma mensagem no lugar
  showImageErrorMessage();
};

function showImageErrorMessage() {
  milestoneImg.style.display = "none";
  countdownEl.style.display = "block";
  countdownEl.innerText = "Erro ao carregar imagem";
}

function updateScore() {
  scoreEl.innerText = "Pontos: " + score;
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  direction = "right";
  score = 0;
  
  // Definir velocidade apropriada para o dispositivo
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
  
  // Parar sons de gatos
  catSounds.forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });
  
  // Limpar qualquer timeout pendente
  clearTimeout(keyHoldTimeout);
  clearTimeout(touchHoldTimeout);
  
  // Remover classe de boost dos botões
  if (currentTouchBtn) {
    currentTouchBtn.classList.remove('boosted');
    currentTouchBtn = null;
  }
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
  const boostFactor = isMobileDevice ? 1.2 : 1.3;
  const highBoostFactor = isMobileDevice ? 1.3 : 1.5;
  
  if (score === 10 || score === 20) {
    speed = Math.floor(speed / speedFactor);
    normalSpeed = speed;
    restartLoop();
  }
  if (score === 30 || score === 40) {
    speed = Math.floor(speed / boostFactor);
    normalSpeed = speed;
    restartLoop();
  }
  if (score === 60 || score === 70) {
    speed = Math.floor(speed / speedFactor);
    normalSpeed = speed;
    restartLoop();
  }
  if (score === 80) {
    speed = Math.floor(speed / speedFactor);
    normalSpeed = speed;
    restartLoop();
  }
  if (score === 90) {
    speed = Math.floor(speed / highBoostFactor);
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
  }
}

function resumeGame() {
  if (!isRunning && !gameEnded && score < 30) {
    gameLoop = setInterval(draw, speed);
    isRunning = true;
    bgMusic.play().catch(() => {});
  }
}

function showMilestoneImage(pontos) {
  console.log(`Mostrando imagem para ${pontos} pontos: ${milestones[pontos]}`);
  const imgSrc = milestones[pontos];
  if (!imgSrc) {
    console.log("Imagem não encontrada para este marco");
    return;
  }
  pauseGame();
  playCatSound(); // Tocar som de gato ao mostrar a imagem
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
      clearInterval(timer);
    }
  }, 1000);
}

function endGame() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
  winMusic.currentTime = 0;
  winMusic.play();
  pauseGame();
  gameEnded = true;
  milestoneImg.src = milestones[30]; // imagem para vitória
  milestoneImg.style.display = "block";
  milestoneOverlay.style.display = "block";
  restartBtn.style.display = "inline-block";
  
  // Tocar som de gato para a vitória também
  playCatSound();
  
  setTimeout(() => {
    alert("🎉 Parabéns! Você venceu com 30 pontos! 🎉");
  }, 100);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Desenha comida
  ctx.drawImage(foodImg, food.x * box, food.y * box, box, box);
  // Calcula nova posição da cabeça
  let head = { ...snake[0] };
  if (direction === "right") head.x++;
  if (direction === "left") head.x--;
  if (direction === "up") head.y--;
  if (direction === "down") head.y++;
  // Verifica colisões
  if (
    head.x < 0 || head.y < 0 ||
    head.x >= maxX || head.y >= maxY ||
    snake.some(s => s.x === head.x && s.y === head.y)
  ) {
    dieSound.currentTime = 0;
    dieSound.play();
    bgMusic.pause();
    bgMusic.currentTime = 0;
    clearInterval(gameLoop);
    setTimeout(() => {
      alert("Game Over! Pontuação: " + score);
      resetGame();
    }, 100);
    return;
  }
  snake.unshift(head);
  // Se comeu comida
  if (head.x === food.x && head.y === food.y) {
    eatSound.currentTime = 0;
    eatSound.play();
    score++;
    updateScore();
    placeFood();
    adjustSpeed();
    if (score === 30) {
      endGame();
    } else if ([5, 10, 15, 20].includes(score)) {
      showMilestoneImage(score);
    }
  } else {
    snake.pop(); // remove o último bloco se não comeu
  }
  // Desenha corpo (exceto cabeça e cauda)
  for (let i = 1; i < snake.length - 1; i++) {
    ctx.drawImage(bodyImg, snake[i].x * box, snake[i].y * box, box, box);
  }
  // Desenha cauda
  if (snake.length > 1) {
    const tail = snake[snake.length - 1];
    ctx.drawImage(tailImg, tail.x * box, tail.y * box, box, box);
  }
  // Desenha cabeça
  ctx.drawImage(headImg, snake[0].x * box, snake[0].y * box, box, box);
}

// Função para mudar direção
function changeDirection(newDir) {
  if (!isRunning) return false;
  
  if (newDir === "up" && direction !== "down") {
    direction = "up";
    return true;
  }
  else if (newDir === "down" && direction !== "up") {
    direction = "down";
    return true;
  }
  else if (newDir === "left" && direction !== "right") {
    direction = "left";
    return true;
  }
  else if (newDir === "right" && direction !== "left") {
    direction = "right";
    return true;
  }
  
  return false;
}

// Função para aplicar o boost
function applyBoost() {
  if (isRunning && !isBoosted) {
    isBoosted = true;
    normalSpeed = speed;
    
    // Boost menos intenso em dispositivo móvel
    const boostFactor = isMobileDevice ? 1.5 : 2;
    speed = Math.floor(speed / boostFactor);
    
    restartLoop();
    console.log("Velocidade aumentada: " + speed);
  }
}

// Função para remover o boost
function removeBoost() {
  if (isBoosted) {
    isBoosted = false;
    speed = normalSpeed;
    restartLoop();
    console.log("Velocidade restaurada: " + speed);
  }
}

// Controle de direção com WASD e teclas de seta, com boost de velocidade
document.addEventListener("keydown", (e) => {
  if (!isRunning) return;
  const key = e.key.toLowerCase();
  
  // Verificar direção
  let newDirection = direction;
  if (key === "w" || key === "arrowup") newDirection = "up";
  else if (key === "s" || key === "arrowdown") newDirection = "down";
  else if (key === "a" || key === "arrowleft") newDirection = "left";
  else if (key === "d" || key === "arrowright") newDirection = "right";
  else return; // Se não for uma tecla de direção, sair
  
  // Se a direção mudou com sucesso
  if (changeDirection(newDirection)) {
    clearTimeout(keyHoldTimeout);
    keyPressStart = Date.now();
    
    // Definir timeout para verificar se o botão está sendo mantido pressionado
    keyHoldTimeout = setTimeout(() => {
      applyBoost();
    }, 2000); // 2 segundos
  }
});

// Event listener para keyup
document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    clearTimeout(keyHoldTimeout);
    removeBoost();
  }
});

// Controles de toque para dispositivos móveis
// Up button
upBtn.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevenir comportamentos padrão de scroll
  e.stopPropagation();
  
  if (!isRunning) return;
  
  if (changeDirection("up")) {
    currentTouchBtn = upBtn;
    clearTimeout(touchHoldTimeout);
    touchStartTime = Date.now();
    
    touchHoldTimeout = setTimeout(() => {
      if (currentTouchBtn === upBtn) {
        upBtn.classList.add('boosted');
        applyBoost();
      }
    }, 2000);
  }
});

upBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (currentTouchBtn === upBtn) {
    upBtn.classList.remove('boosted');
    clearTimeout(touchHoldTimeout);
    removeBoost();
    currentTouchBtn = null;
  }
});

// Down button
downBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!isRunning) return;
  
  if (changeDirection("down")) {
    currentTouchBtn = downBtn;
    clearTimeout(touchHoldTimeout);
    touchStartTime = Date.now();
    
    touchHoldTimeout = setTimeout(() => {
      if (currentTouchBtn === downBtn) {
        downBtn.classList.add('boosted');
        applyBoost();
      }
    }, 2000);
  }
});

downBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (currentTouchBtn === downBtn) {
    downBtn.classList.remove('boosted');
    clearTimeout(touchHoldTimeout);
    removeBoost();
    currentTouchBtn = null;
  }
});

// Left button
leftBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!isRunning) return;
  
  if (changeDirection("left")) {
    currentTouchBtn = leftBtn;
    clearTimeout(touchHoldTimeout);
    touchStartTime = Date.now();
    
    touchHoldTimeout = setTimeout(() => {
      if (currentTouchBtn === leftBtn) {
        leftBtn.classList.add('boosted');
        applyBoost();
      }
    }, 2000);
  }
});

leftBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (currentTouchBtn === leftBtn) {
    leftBtn.classList.remove('boosted');
    clearTimeout(touchHoldTimeout);
    removeBoost();
    currentTouchBtn = null;
  }
});

// Right button
rightBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!isRunning) return;
  
  if (changeDirection("right")) {
    currentTouchBtn = rightBtn;
    clearTimeout(touchHoldTimeout);
    touchStartTime = Date.now();
    
    touchHoldTimeout = setTimeout(() => {
      if (currentTouchBtn === rightBtn) {
        rightBtn.classList.add('boosted');
        applyBoost();
      }
    }, 2000);
  }
});

rightBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (currentTouchBtn === rightBtn) {
    rightBtn.classList.remove('boosted');
    clearTimeout(touchHoldTimeout);
    removeBoost();
    currentTouchBtn = null;
  }
});

// Também adicionar suporte a clique para mouse
upBtn.addEventListener("mousedown", () => {
  if (!isRunning) return;
  
  if (changeDirection("up")) {
    currentTouchBtn = upBtn;
    clearTimeout(touchHoldTimeout);
    
    touchHoldTimeout = setTimeout(() => {
      upBtn.classList.add('boosted');
      applyBoost();
    }, 2000);
  }
});

downBtn.addEventListener("mousedown", () => {
  if (!isRunning) return;
  
  if (changeDirection("down")) {
    currentTouchBtn = downBtn;
    clearTimeout(touchHoldTimeout);
    
    touchHoldTimeout = setTimeout(() => {
      downBtn.classList.add('boosted');
      applyBoost();
    }, 2000);
  }
});

leftBtn.addEventListener("mousedown", () => {
  if (!isRunning) return;
  
  if (changeDirection("left")) {
    currentTouchBtn = leftBtn;
    clearTimeout(touchHoldTimeout);
    
    touchHoldTimeout = setTimeout(() => {
      leftBtn.classList.add('boosted');
      applyBoost();
    }, 2000);
  }
});

rightBtn.addEventListener("mousedown", () => {
  if (!isRunning) return;
  
  if (changeDirection("right")) {
    currentTouchBtn = rightBtn;
    clearTimeout(touchHoldTimeout);
    
    touchHoldTimeout = setTimeout(() => {
      rightBtn.classList.add('boosted');
      applyBoost();
    }, 2000);
  }
});

document.addEventListener("mouseup", () => {
  if (currentTouchBtn) {
    currentTouchBtn.classList.remove('boosted');
    clearTimeout(touchHoldTimeout);
    removeBoost();
    currentTouchBtn = null;
  }
});

startBtn.addEventListener("click", () => {
  if (gameLoop) clearInterval(gameLoop);
  resetGame();
  bgMusic.currentTime = 0;
  bgMusic.play().catch(error => {
    console.log("Erro ao reproduzir áudio:", error);
    // Muitos navegadores bloqueiam a reprodução automática
    alert("Clique na tela para habilitar o som!");
  });
  gameLoop = setInterval(draw, speed);
  isRunning = true;
});

pauseBtn.addEventListener("click", () => {
  if (isRunning) {
    clearInterval(gameLoop);
    isRunning = false;
    bgMusic.pause();
  }
});

resumeBtn.addEventListener("click", () => {
  if (!isRunning && !gameEnded && score < 30) {
    gameLoop = setInterval(draw, speed);
    isRunning = true;
    bgMusic.play().catch(() => {});
  } else {
    // Se o jogo terminou, pausar música de vitória ao clicar em continuar
    winMusic.pause();
    winMusic.currentTime = 0;
    // Também pausar sons de gatos
    catSounds.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
  startBtn.click(); // Inicia automaticamente
  milestoneImg.style.display = "none";
  milestoneOverlay.style.display = "none";
  restartBtn.style.display = "none";
});

// Inicialização
window.addEventListener('load', function() {
  // Detectar dispositivo e ajustar configurações
  detectMobileDevice();
  setAppropriateSpeed();
  setupMobileAudio();
  
  // Configurar controles de toque
  setupTouchControls();
  
  // Verificar orientação inicial
  handleOrientation();
  
  // Ajustar tamanhos
  adjustModalSize();
  resizeCanvas();
});

// Atualizar quando redimensionar
window.addEventListener('resize', function() {
  detectMobileDevice();
  handleOrientation();
  adjustModalSize();
  resizeCanvas();
  
  // Se o jogo estiver em execução, ajustar velocidade conforme necessário
  if (isRunning && !isBoosted) {
    setAppropriateSpeed();
    restartLoop();
  }
});

// Event listener para orientação
window.addEventListener('orientationchange', function() {
  // Aguardar orientação completar a mudança
  setTimeout(() => {
    handleOrientation();
  }, 300);
});

// Prevenir o "bounce" em dispositivos iOS
document.body.addEventListener('touchmove', function(e) {
  if (modalOverlay.style.display === 'flex') {
    e.preventDefault();
  }
}, { passive: false });
