const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let leftPressed = false
let rightPressed = false
let ball = {
  r: 10, // radius
  x: canvas.width/2, // center x
  y: canvas.height-30, // center y
  dx: 2,
  dy: -2
}

let paddle = {
  w: 80, // width
  h: 15, // height
  x: canvas.width/2 - 80/2, // top left x
  y: canvas.height - 15 - 5, // top left y
  dx: 4,
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
  drawPaddle()
  drawBall();
  updateBall();
  updatePaddle();
}

function updateBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;
  screenCollission()
  paddleCollission()
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
    ball.dx = 2
    ball.dy = -2
    ball.x = paddle.x + paddle.w/2
    ball.y = paddle.y - ball.r
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
    ball.dx = ball.dx/ball.dx * diff*3
    ball.dy = -diff*3

  } else if ( // Side paddle collission
    ball.y + ball.r > paddle.y+tolerance && 
    ball.x + ball.r >= paddle.x && 
    ball.x - ball.r <= paddle.x + paddle.w) {
    ball.dx *= -1
  }
}

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
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
