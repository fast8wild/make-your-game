const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let leftPressed = false
let rightPressed = false
let gameState = 1; //-1: Game Over 0: In-Play, 1: Serve, 2: Win]

let startTime = new Date().getTime(); // Start of serve time
let prevTime = 0 // Add to the time counter on retries

const ui = {
  time: "00:00",
  lives: 3,
  score: 0,
  level: 1,
}

const paddle = {
  w: 80, // width
  h: 15, // height
  x: canvas.width / 2 - 80 / 2, // top left x
  y: canvas.height - 15 - 5, // top left y
  dx: 4,
}

const ball = {
  r: 10, // radius
  x: paddle.x + paddle.w / 2, // center x
  y: paddle.y - 10, // center y
  dx: 2,
  dy: -2
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

let tolerance = 10 // margin of error of hitting paddle

function initializeBricks() {
  for (let c = 0; c < brickSettings.colCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickSettings.rowCount; r++) {
      const brickX = c * (brickSettings.w + brickSettings.padding) + brickSettings.offsetLeft;
      const brickY = r * (brickSettings.h + brickSettings.padding) + brickSettings.offsetTop;
      bricks[c][r] = { x: brickX, y: brickY, health: Math.min(3,Math.floor(Math.random()*(ui.level+1))) };
      console.log(bricks[c][r].health)
    }
  }
}

initializeBricks();

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h)
  ctx.fillStyle = "#8895DD";
  ctx.fill();
}

function drawBricks() {
  for (let c = 0; c < brickSettings.colCount; c++) {
    for (let r = 0; r < brickSettings.rowCount; r++) {
      const brick = bricks[c][r]
      if (brick.health > 0) {
        ctx.beginPath();
        ctx.rect(brick.x, brick.y, brickSettings.w, brickSettings.h);
        switch (brick.health) {
          case 3:
            ctx.fillStyle = "#DD0095";
            break;
          case 2:
            ctx.fillStyle = "#95DD00";
            break;
          default:
            ctx.fillStyle = "#0095DD";
            break;
        }
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawGameOver() {
  let text = "GAME OVER"
  ctx.font = "50px Arial";
  ctx.fillStyle = "Red"
  ctx.textAlign = "Center"
  ctx.textBaseLine = "Middle"
  ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2)
  text = "Press Enter to retry"
  ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2 + 50)
}

function drawWin() {
  let text = "YOU WIN!"
  ctx.font = "50px Arial";
  ctx.fillStyle = "Green"
  ctx.textAlign = "Center"
  ctx.textBaseLine = "Middle"
  ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2)
  text = "Press Enter for the next level"
  ctx.font = "30px Arial";
  ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2 + 50)
}

function drawStartMessage() {
  let text = "Press Enter"
  ctx.font = "30px Arial";
  ctx.fillStyle = "Blue"
  ctx.textAlign = "Center"
  ctx.textBaseLine = "Middle"
  ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2)
}

function drawUI() {
  if (gameState == 0) { // Calcilate time only when the ball is in-play
    let dt = (new Date().getTime() - startTime) / 1000 + prevTime
    var sec = Math.floor(dt % 60);
    var min = Math.floor(dt / 60);
    ui.time = (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
  }
  ctx.font = "20px Arial";
  ctx.fillStyle = "#9995DD";
  ctx.lineWidth = 0.1
  ctx.strokeStyle = "white"
  // Time
  ctx.fillText("Time: " + ui.time, 1, 20)
  ctx.strokeText("Time: " + ui.time, 1, 20)
  // Lives
  ctx.fillText("Lives: " + ui.lives, 1, 40)
  ctx.strokeText("Lives: " + ui.lives, 1, 40)
  // Level
  ctx.fillText("Level: " + ui.level, 1, 60)
  ctx.strokeText("Level: " + ui.level, 1, 60)
  // Score
  ctx.fillText("Score: " + ui.score, 1, 80)
  ctx.strokeText("Score: " + ui.score, 1, 80)
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  switch (gameState) {
    case -1: // Game Over
      drawGameOver();
      break;
    case 1: // Serve
      drawStartMessage();
    case 0: //In-play
      drawPaddle()
      drawBall();
      drawBricks();
      drawUI();
      updatePaddle();
      updateBall();
      break;
    case 2:
      drawWin()
      break;
  }

  requestAnimationFrame(draw);
}

function drawActiveGame() {
}

function updateBall() {
  if (gameState == 1) { // Stick the ball to the paddle on serve
    ball.x = paddle.x + paddle.w / 2
    ball.y = paddle.y - 10
  } else {
    ball.x += ball.dx;
    ball.y += ball.dy;
    screenCollission()
    paddleCollission()
    brickCollission()
  }
}

function updatePaddle() {
  if (leftPressed) {
    paddle.x = Math.max(0, paddle.x - paddle.dx)
  }
  if (rightPressed) {
    paddle.x = Math.min(canvas.width - paddle.w, paddle.x + paddle.dx)
  }
}

function screenCollission() {
  if (ball.x >= canvas.width - ball.r) { // Right screen collision
    ball.dx *= -1
    ball.x = 2 * (canvas.width - ball.r) - ball.x
  } else if (ball.x <= ball.r) { // Left screen collision
    ball.dx *= -1
    ball.x = 2 * ball.r - ball.x
  }
  if (ball.y <= ball.r) { // Top screen collision
    ball.dy *= -1
    ball.y = 2 * ball.r - ball.y
  } else if (ball.y >= canvas.height + ball.r) { //Bottom screen collision
    // lives should subtract, game should reset
    ui.lives--
    if (ui.lives > 0) {
      prevTime += (new Date().getTime() - startTime) / 1000
      gameState = 1
      ball.dx = 2
      ball.dy = -2
      ball.x = paddle.x + paddle.w / 2
      ball.y = paddle.y - ball.r
    } else {
      gameState = -1
    }
  }
}

function paddleCollission() {
  if ( //Bottom paddle collision
    ball.dy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y + ball.r <= paddle.y + tolerance &&
    ball.x + ball.r >= paddle.x &&
    ball.x - ball.r <= paddle.x + paddle.w) {
    ball.dy *= -1
    // speed multiplyer on edge hits: 
    let diff = Math.max(0.7, Math.abs(ball.x - paddle.x - paddle.w / 2) / (paddle.w / 2)) // How far away it is from the center from 0 to 1
    ball.dx > 0 ? ball.dx = diff * 3 : ball.dx = -diff * 3;
    ball.dy = -diff * 3

  } else if ( // Side paddle collission
    ball.y + ball.r > paddle.y + tolerance &&
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
        if (
          ball.x >= brick.x &&
          ball.x <= brick.x + brickSettings.w &&
          ball.y >= brick.y &&
          ball.y <= brick.y + brickSettings.h
        ) {
          ui.score += 10 * brick.health * ui.level
          ball.dy *= -1;
          brick.health--;
        } else {
          levelClear = false
        }
      }
    }
  }
  if (levelClear) {
    prevTime += (new Date().getTime() - startTime) / 1000
    gameState = 2
  }
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
      switch (gameState) {
        case -1: // Reset from game over
          initializeBricks();
          gameState = 1;
          ui.lives = 3
          ui.score = 0
          ui.time = "0:00"
          ui.level = 1
          prevTime = 0
          break;
        case 2: // Win state, reset the board and go back to serve
          initializeBricks();
          gameState = 1;
          ui.level++
          break;
        case 1: // Serve the ball
          gameState = 0
          startTime = new Date().getTime()
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

function startGame() {
  draw();
}

document.getElementById("runButton").addEventListener("click", function () {
  startGame();
  this.disabled = true;
});

