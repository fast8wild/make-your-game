const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let leftPressed = false
let rightPressed = false
let startState = true // Start of the game, press enter to launch the ball
let endState = false // Game over state
let lives = 3

let paddle = {
  w: 80, // width
  h: 15, // height
  x: canvas.width/2 - 80/2, // top left x
  y: canvas.height - 15 - 5, // top left y
  dx: 4,
}

let ball = {
  r: 10, // radius
  x: paddle.x + paddle.w/2, // center x
  y: paddle.y - 10, // center y
  dx: 2,
  dy: -2
}

let tolerance = 10 // margin of error of hitting paddle

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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (endState) {
    let text = "GAME OVER"
    ctx.font = "50px Arial";
    ctx.fillStyle = "Red"
    ctx.textAlign = "Center"
    ctx.textBaseLine = "Middle"
    ctx.fillText(text,canvas.width/2-ctx.measureText(text).width/2, canvas.height/2)
    text = "Press Enter to retry"
    ctx.fillText(text,canvas.width/2-ctx.measureText(text).width/2, canvas.height/2+50)
    return;
  }

  if (startState) {
    let text = "Press Enter"
    ctx.font = "30px Arial";
    ctx.fillStyle = "Blue"
    ctx.textAlign = "Center"
    ctx.textBaseLine = "Middle"
    ctx.fillText(text,canvas.width/2-ctx.measureText(text).width/2, canvas.height/2)
  }

  ctx.font = "20px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.fillText("Lives: "+lives,1,20)
  drawPaddle()
  drawBall();
  updatePaddle();
  updateBall();
}

function updateBall() {
  if (startState) {
    ball.x = paddle.x + paddle.w/2
    ball.y = paddle.y - 10
  } else {
    ball.x += ball.dx;
    ball.y += ball.dy;
    screenCollission()
    paddleCollission()
  }
}

function updatePaddle() {
  if (leftPressed) {
    paddle.x = Math.max(0,paddle.x-paddle.dx)
  }
  if (rightPressed) {
    paddle.x = Math.min(canvas.width-paddle.w,paddle.x+paddle.dx)
  }
}

function screenCollission() {
  if (ball.x >= canvas.width - ball.r) { // Right screen collision
    ball.dx *= -1
    ball.x = 2*(canvas.width - ball.r) - ball.x
  } else if (ball.x <= ball.r) { // Left screen collision
    ball.dx *= -1
    ball.x = 2*ball.r-ball.x
  }
  if (ball.y <= ball.r) { // Top screen collision
    ball.dy *= -1
    ball.y = 2*ball.r-ball.y
  } else if (ball.y >= canvas.height + ball.r) { //Bottom screen collision
    // lives should subtract, game should reset
    lives--
    if (lives > 0) {
      startState = true
      ball.dx = 2
      ball.dy = -2
      ball.x = paddle.x + paddle.w/2
      ball.y = paddle.y - ball.r
    } else {
      endState = true
    }
  }
}

function paddleCollission() {
  if ( //Bottom paddle collision
    ball.dy > 0 && 
    ball.y + ball.r >= paddle.y && 
    ball.y + ball.r <= paddle.y+tolerance && 
    ball.x + ball.r >= paddle.x && 
    ball.x - ball.r <= paddle.x + paddle.w) {
    ball.dy *= -1
    // speed multiplyer on edge hits: 
    let diff = Math.max(0.7,Math.abs(ball.x - paddle.x - paddle.w/2)/(paddle.w/2)) // How far away it is from the center from 0 to 1
    ball.dx > 0 ? ball.dx = diff*3 : ball.dx = -diff*3;
    ball.dy = -diff*3

  } else if ( // Side paddle collission
    ball.y + ball.r > paddle.y+tolerance && 
    ball.x + ball.r >= paddle.x && 
    ball.x - ball.r <= paddle.x + paddle.w) {
    ball.dx *= -1
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
      if (endState) {
        lives = 3
        startState = true
        endState = false
      } else {
        startState = false
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
  const interval = setInterval(draw, 10);
}

document.getElementById("runButton").addEventListener("click", function () {
  startGame();
  this.disabled = true;
});
