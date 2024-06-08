const gameWindow = document.getElementById("gameWindow");
let leftPressed = false
let rightPressed = false
let gameState = -2; //-2 Title, -1: Game Over 0: In-Play, 1: Serve, 2: Win, 3: Pause

let lastCalledTime = Date.now();
var delta;

const ui = {
  time: 0,
  lives: 3,
  score: 0,
  level: 1,
  html: {
    bigText: document.getElementById("bigText"),
    subText: document.getElementById("subText"),
    hud: document.getElementById("hud"),
    ms: document.getElementById("ms")
  }
}

const paddle = {
  w: 80, // width
  h: 15, // height
  x: gameWindow.offsetWidth / 2 - 80 / 2, // top left x
  y: gameWindow.offsetHeight - 15 - 5, // top left y
  dx: 4,
  tolerance: 10, // margin of error of hitting paddle
  html: null,
}

const ball = {
  r: 10, // radius
  x: paddle.x + paddle.w / 2, // center x
  y: paddle.y - 10, // center y
  dx: 2,
  dy: -2,
  html: null,
}

const brickSettings = {
  rowCount: 3,
  colCount: 5,
  w: 75,
  h: 20,
  padding: 10,
  offsetTop: 30,
  offsetLeft: 30,
}

const bricks = [];

// --- BRICKS ---

function spawnBricks() {
  for (let c = 0; c < brickSettings.colCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickSettings.rowCount; r++) {
      const health = Math.min(3, Math.floor(Math.random() * (ui.level + 1)))
      const brickX = c * (brickSettings.w + brickSettings.padding) + brickSettings.offsetLeft;
      const brickY = r * (brickSettings.h + brickSettings.padding) + brickSettings.offsetTop;
      const brick = document.createElement("span")
      brick.classList.add("brick")
      brick.setAttribute("health", health)
      brick.style.left = brickX + "px"
      brick.style.top = brickY + "px"
      brick.style.width = brickSettings.w + "px"
      brick.style.height = brickSettings.h + "px"
      gameWindow.append(brick)
      bricks[c][r] = { x: brickX, y: brickY, health: health, html: brick };
    }
  }
}

function killBricks() {
  for (let c = 0; c < brickSettings.colCount; c++) {
    for (let r = 0; r < brickSettings.rowCount; r++) {
      bricks[c][r].html.remove()
    }
  }
}

// --- BALL ---

function spawnBall() {
  ball.x = paddle.x + paddle.w / 2
  ball.y = paddle.y - 10
  ball.html = document.createElement("span")
  ball.html.id = "ball"
  ball.html.style.left = (ball.x - ball.r) + "px"
  ball.html.style.top = (ball.y - ball.r) + "px"
  ball.html.style.height = 2 * ball.r + "px"
  ball.html.style.width = 2 * ball.r + "px"
  ball.html.style.display = "block"
  gameWindow.append(ball.html)
}

function moveBall() {
  ball.html.style.left = (ball.x - ball.r) + "px"
  ball.html.style.top = (ball.y - ball.r) + "px"
}

function killBall() {
  ball.html.remove()
  ball.html = null
}

// --- PADDLE ---

function spawnPaddle() {
  paddle.x = gameWindow.offsetWidth / 2 - paddle.w / 2, // top left x
    paddle.y = gameWindow.offsetHeight - 15 - 5, // top left y
    paddle.html = document.createElement("span")
  paddle.html.id = "paddle"
  paddle.html.style.left = paddle.x + "px"
  paddle.html.style.top = paddle.y + "px"
  paddle.html.style.height = paddle.h + "px"
  paddle.html.style.width = paddle.w + "px"
  gameWindow.append(paddle.html)
}

function movePaddle() {
  paddle.html.style.left = paddle.x + "px"
  paddle.html.style.top = paddle.y + "px"
}

function killPaddle() {
  paddle.html.remove()
  paddle.html = null
}

// -- MOVEMENT AND COLLISION ---

function screenCollission() {
  if (ball.x >= gameWindow.offsetWidth - ball.r) { // Right screen collision
    ball.dx *= -1
    ball.x = 2 * (gameWindow.offsetWidth - ball.r) - ball.x
  } else if (ball.x <= ball.r) { // Left screen collision
    ball.dx *= -1
    ball.x = 2 * ball.r - ball.x
  }
  if (ball.y <= ball.r) { // Top screen collision
    ball.dy *= -1
    ball.y = 2 * ball.r - ball.y
  } else if (ball.y >= gameWindow.offsetHeight + ball.r) { //Bottom screen collision
    ui.lives--
    if (ui.lives > 0) {
      gameState = 1;
      drawServeMessage();
      ball.dx = 2
      ball.dy = -2
      ball.x = paddle.x + paddle.w / 2
      ball.y = paddle.y - ball.r
    } else {
      gameState = -1;
      clearUI();
      killBall()
      killPaddle()
      killBricks()
      drawGameOver();
    }
  }
}

function paddleCollission() {
  if ( //Bottom paddle collision
    ball.dy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y + ball.r <= paddle.y + paddle.tolerance &&
    ball.x + ball.r >= paddle.x &&
    ball.x - ball.r <= paddle.x + paddle.w) {
    ball.dy *= -1
    // speed multiplyer on edge hits: 
    let diff = Math.max(0.7, Math.abs(ball.x - paddle.x - paddle.w / 2) / (paddle.w / 2)) // How far away it is from the center from 0 to 1
    ball.dx > 0 ? ball.dx = diff * 3 : ball.dx = -diff * 3;
    ball.dy = -diff * 3

  } else if ( // Side paddle collission
    ball.y + ball.r > paddle.y + paddle.tolerance &&
    ball.x + ball.r >= paddle.x &&
    ball.x - ball.r <= paddle.x + paddle.w) {
    ball.dx *= -1
  }
}

function brickCollission() {
  let levelClear = true
  for (let c = 0; c < brickSettings.colCount; c++) {
    for (let r = 0; r < brickSettings.rowCount; r++) {
      const brick = bricks[c][r];
      if (brick.health > 0) {
        // Check if ball is within the dimensions of the brick
        if (
          ball.x + ball.r >= brick.x &&
          ball.x - ball.r <= brick.x + brickSettings.w &&
          ball.y + ball.r >= brick.y &&
          ball.y - ball.r <= brick.y + brickSettings.h
        ) {
          // Update score and leath
          ui.score += 10 * brick.health * ui.level
          brick.health--;
          brick.html.setAttribute("health", brick.health)
          if (brick.health > 0) {
            levelClear = false
          }
          // Vary the x and y directions based on the ball's center position relative to the brick
          if (
            (ball.x < brick.x && ball.dx >  0) ||
            (ball.x > brick.x+brickSettings.w && ball.dx < 0)
          ) {
            ball.dx *=-1
          }
          if (
            (ball.y < brick.y && ball.dy > 0) ||
            (ball.y > brick.y + brickSettings.h && ball.dy < 0)
          ) {
            ball.dy *=-1
          }
        } else {
          levelClear = false
        }
      }
    }
  }

  if (levelClear) {
    killBall()
    killPaddle()
    killBricks()
    gameState = 2
    clearUI()
    drawWin()
  }
}


function updateBall() {
  if (gameState == 1) { // Stick the ball to the paddle on serve
    ball.x = paddle.x + paddle.w / 2
    ball.y = paddle.y - 10
  } else {
    ball.x += ball.dx;
    ball.y += ball.dy;
    brickCollission();
    paddleCollission();
    screenCollission();
  }
}

function updatePaddle() {
  if (leftPressed) {
    paddle.x = Math.max(0, paddle.x - paddle.dx)
  }
  if (rightPressed) {
    paddle.x = Math.min(gameWindow.offsetWidth - paddle.w, paddle.x + paddle.dx)
  }
}

// --- UI ELEMENTS ---

function drawHUD() {
  ui.html.hud.style.display = "block"
  updateHUD();
}

function updateHUD() {
  gameState == 0 ? ui.time += delta : null ;
  var sec = Math.floor(ui.time % 60);
  var min = Math.floor(ui.time / 60);
  ui.html.hud.innerHTML = "Time: " + (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec) + "\nLives: " + ui.lives + "\nLevel: " + ui.level +  "\nScore: " + ui.score
}

function drawGameOver() {
  ui.html.bigText.style.display = "block"
  ui.html.bigText.innerHTML = "GAME OVER"
  ui.html.bigText.setAttribute("state", "gameOver")
  ui.html.subText.style.display = "block"
  ui.html.subText.innerHTML = "Final Score: " + ui.score + "<br>Press Enter to retry"
  ui.html.subText.setAttribute("state", "gameOver")
}

function drawWin() {
  ui.html.bigText.style.display = "block"
  ui.html.bigText.innerHTML = "YOU WIN!"
  ui.html.bigText.setAttribute("state", "win")
  ui.html.subText.style.display = "block"
  ui.html.subText.innerHTML = "Press Enter for the next level"
  ui.html.subText.setAttribute("state", "win")
}

function drawServeMessage() {
  ui.html.subText.style.display = "block"
  ui.html.subText.innerHTML = "Press Enter to serve"
  ui.html.subText.setAttribute("state", "serve")
}

function drawTitleScreen() {
  ui.html.bigText.style.display = "block"
  ui.html.bigText.innerHTML = "Breakout!"
  ui.html.bigText.setAttribute("state", "serve")
  ui.html.subText.style.display = "block"
  ui.html.subText.innerHTML = "Press Enter"
  ui.html.subText.setAttribute("state", "serve")
}

function clearUI() {
  ui.html.hud.style.display = "none"
  ui.html.bigText.style.display = "none"
  ui.html.subText.style.display = "none"
}

function keyDownHandler(e) {
  switch (e.key) {
    case "Right", "ArrowRight":
      rightPressed = true;
      break;
    case "Left", "ArrowLeft":
      leftPressed = true;
      break;
    case "Enter":
      clearUI();
      switch (gameState) {
        case -2: // start new game
        case -1: // Reset from game over
          spawnBricks();
          spawnPaddle();
          spawnBall();
          drawServeMessage();
          drawHUD();
          gameState = 1;
          ui.lives = 3
          ui.score = 0
          ui.time = 0
          ui.level = 1
          break;
        case 2: // Win state, reset the board and go back to serve
          spawnBricks();
          spawnPaddle();
          spawnBall();
          drawServeMessage();
          drawHUD();
          gameState = 1;
          ui.level++
          break;
        case 1: // Serve the ball
          drawHUD();
          gameState = 0
          break;
        case 0: // Pause
          drawHUD();
          gameState = 3
          break;
        case 3: // Unpause
          drawHUD();
          gameState = 0
          break;
      }
      break;
  }
}

function keyUpHandler(e) {
  switch (e.key) {
    case "Right", "ArrowRight":
      rightPressed = false;
      break;
    case "Left", "ArrowLeft":
      leftPressed = false;
      break;
  }
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);


function main() {
  delta = (Date.now() - lastCalledTime) / 1000;
  lastCalledTime = Date.now();
  ui.html.ms.innerHTML = "ms: " + delta

  switch (gameState) {
    case 0: //In-play
    case 1: // Serve
      movePaddle()
      moveBall();
      updateHUD();
      updatePaddle();
      updateBall();
      break;
  }
  requestAnimationFrame(main);
}


drawTitleScreen();
main();