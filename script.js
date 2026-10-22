
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const speedElement = document.getElementById("speed");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

const lanes = [100, 200, 300];

let player;
let enemies = [];
let score = 0;
let speed = 4;
let roadOffset = 0;
let spawnTimer = 0;
let running = false;
let animationId = null;
let lastTime = 0;

function makeCar(x, y, color, isPlayer = false) {
  return { x, y, width: 44, height: 76, color, isPlayer };
}

function resetGame() {
  player = makeCar(178, 490, "#00f5ff", true);
  enemies = [];
  score = 0;
  speed = 4;
  roadOffset = 0;
  spawnTimer = 0;

  scoreElement.textContent = "0";
  speedElement.textContent = "1";
}

function drawRoad() {
  // Grass beside the road
  ctx.fillStyle = "#176b35";
  ctx.fillRect(0, 0, 400, 600);

  // Asphalt
  ctx.fillStyle = "#333840";
  ctx.fillRect(45, 0, 310, 600);

  // Road edges
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(45, 0, 5, 600);
  ctx.fillRect(350, 0, 5, 600);

  // Moving lane markings
  ctx.fillStyle = "#ffffff";

  for (let y = -50; y < 650; y += 100) {
    const lineY = y + roadOffset;

    ctx.fillRect(146, lineY, 5, 48);
    ctx.fillRect(246, lineY, 5, 48);
  }

  roadOffset = (roadOffset + speed) % 100;
}

function drawCar(car) {
  const { x, y, width, height, color } = car;

  // Wheels
  ctx.fillStyle = "#101010";
  ctx.fillRect(x - 5, y + 12, 8, 18);
  ctx.fillRect(x + width - 3, y + 12, 8, 18);
  ctx.fillRect(x - 5, y + 49, 8, 18);
  ctx.fillRect(x + width - 3, y + 49, 8, 18);

  // Car body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 9);
  ctx.fill();

  // Windshield
  ctx.fillStyle = "#b9edff";
  ctx.beginPath();
  ctx.roundRect(x + 7, y + 13, width - 14, 19, 5);
  ctx.fill();

  // Rear window
  ctx.fillStyle = "#24465b";
  ctx.fillRect(x + 8, y + 43, width - 16, 12);

  // Headlights or tail lights
  ctx.fillStyle = car.isPlayer ? "#fff8b0" : "#ff4141";

  if (car.isPlayer) {
    ctx.fillRect(x + 5, y + 2, 9, 5);
    ctx.fillRect(x + width - 14, y + 2, 9, 5);
  } else {
    ctx.fillRect(x + 5, y + height - 6, 9, 4);
    ctx.fillRect(x + width - 14, y + height - 6, 9, 4);
  }
}

function spawnEnemy() {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const colors = ["#ff3b5c", "#ffb52e", "#a56bff", "#eeeeee"];

  enemies.push(
    makeCar(
      lane - 22,
      -85,
      colors[Math.floor(Math.random() * colors.length)]
    )
  );
}

function isColliding(a, b) {
  const margin = 8;

  return (
    a.x + margin < b.x + b.width - margin &&
    a.x + a.width - margin > b.x + margin &&
    a.y + margin < b.y + b.height - margin &&
    a.y + a.height - margin > b.y + margin
  );
}

function movePlayer(direction) {
  if (!running) return;

  player.x += direction * 50;
  player.x = Math.max(55, Math.min(301, player.x));
}

function update(delta) {
  const step = Math.min(delta / 16.67, 2.5);

  // Gradually increase difficulty
  speed = Math.min(11, 4 + score / 150);
  speedElement.textContent = (speed / 4).toFixed(1);

  spawnTimer += delta;

  if (spawnTimer > Math.max(420, 1050 - score * 2)) {
    spawnEnemy();
    spawnTimer = 0;
  }

  for (const enemy of enemies) {
    enemy.y += speed * step;

    if (isColliding(player, enemy)) {
      endGame();
      return;
    }
  }

  const passed = enemies.filter(
    enemy => enemy.y > canvas.height
  ).length;

  score += passed * 10;
  scoreElement.textContent = score;

  enemies = enemies.filter(
    enemy => enemy.y < canvas.height + 100
  );
}

function draw() {
  drawRoad();
  enemies.forEach(drawCar);
  drawCar(player);
}

function gameLoop(time) {
  if (!running) return;

  const delta = lastTime ? Math.min(time - lastTime, 50) : 16.67;
  lastTime = time;

  update(delta);
  draw();

  if (running) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  resetGame();
  message.style.display = "none";
  running = true;
  lastTime = 0;
  animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  running = false;

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  message.innerHTML = `
    <h2>🏁 GAME OVER!</h2>
    <p>Your score: <strong>${score}</strong></p>
    <button id="restartBtn">RACE AGAIN</button>
  `;

  message.style.display = "flex";
  document.getElementById("restartBtn").addEventListener(
    "click",
    startGame
  );
}

// Keyboard controls
document.addEventListener("keydown", event => {
  if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
  }

  if (event.repeat) return;

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    movePlayer(-1);
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    movePlayer(1);
  }
});

// On-screen controls
document.getElementById("leftBtn").addEventListener(
  "click", () => movePlayer(-1)
);

document.getElementById("rightBtn").addEventListener(
  "click", () => movePlayer(1)
);

startBtn.addEventListener("click", startGame);

// Draw the road and car before the game begins
resetGame();
draw();
