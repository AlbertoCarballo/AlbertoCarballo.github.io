let paddle, blocks = [], level = 1;
let cols = 8;
let rows = 4;
let score = 0;
let lives = 3;
let gameStarted = false;
let hitSound;

let transitioning = false;
let transitionTimer = 0;
let transitionDuration = 60;
let paused = false;

let powerUps = [];
let balls = [];

function preload() {
  hitSound = loadSound('./sounds/hit.wav');
  powerUpSound = loadSound('./sounds/powerup.mp3');
  bgMusic = loadSound('./sounds/background_music.mp3'); 
}

function setup() {
  createCanvas(600, 400);
  paddle = new Paddle();
  balls = [new Ball()];
  createBlocks();
  bgMusic.setLoop(true);
  bgMusic.setVolume(0.3);
  bgMusic.play();
}

function draw() {
  if (paused) {
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("PAUSADO", width / 2, height / 2);
    return;
  }

  background(0, 0, 0);

  if (transitioning) {
    fill(255);
    textSize(28);
    textAlign(CENTER, CENTER);
    text(`Nivel ${level}`, width / 2, height / 2);
    transitionTimer--;
    if (transitionTimer <= 0) {
      transitioning = false;
      balls.forEach(b => b.speedUp());
      balls = [new Ball()];
    }
    return;
  }

  paddle.display();
  paddle.move();

  if (gameStarted) {
    for (let b of balls) b.move();
  }

  for (let b of balls) {
    b.display();
    b.checkEdges(paddle);
  }

  for (let i = blocks.length - 1; i >= 0; i--) {
    let block = blocks[i];
    block.display();

    for (let b of balls) {
      if (!block.removing && b.hits(block)) {
        let overlapLeft = b.x + b.r - block.x;
        let overlapRight = block.x + block.w - (b.x - b.r);
        let overlapTop = b.y + b.r - block.y;
        let overlapBottom = block.y + block.h - (b.y - b.r);
        let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
          b.yspeed *= -1;
        } else {
          b.xspeed *= -1;
        }

        if (hitSound && hitSound.isLoaded()) {
          hitSound.setVolume(random(0.5, 0.8));
          hitSound.play();
        }

        if (block.hit()) {
          block.removing = true;

          if (random() < 0.15) {
            let type = random() < 0.5 ? 'life' : 'multi';
            powerUps.push(new PowerUp(block.x + block.w / 2, block.y + block.h / 2, type));
          }
        }
      }
    }

    if (block.removing) {
      block.removeProgress += 5;
      block.y -= 2;
      if (block.removeProgress > 60) {
        blocks.splice(i, 1);
        score++;
      }
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    let p = powerUps[i];
    p.update();
    p.display();

    if (p.hitsPaddle(paddle)) {
      if (p.type === 'life') {
        lives++;
      } else if (p.type === 'multi') {
        let newBalls = [];
        for (let b of balls) {
          let newBall = new Ball();
          newBall.x = b.x;
          newBall.y = b.y;
          newBall.xspeed = -b.xspeed;
          newBall.yspeed = b.yspeed;
          newBalls.push(newBall);
        }
        balls.push(...newBalls);
      }
      powerUpSound.play();
      powerUps.splice(i, 1);
    } else if (p.offScreen()) {
      powerUps.splice(i, 1);
    }
  }

  displayUI();

  if (blocks.length === 0 && !transitioning) nextLevel();

  for (let i = balls.length - 1; i >= 0; i--) {
    if (balls[i].offScreen()) {
      balls.splice(i, 1);
    }
  }

  if (balls.length === 0) {
    lives--;
    gameStarted = false;
    if (lives < 0) {
      background(0);
      fill(255, 0, 0);
      textAlign(CENTER, CENTER);
      textSize(32);
      text("Game Over", width / 2, height / 2);
      textSize(16);
      text("Presiona R para reiniciar", width / 2, height / 2 + 40);
      noLoop();
    } else {
      balls = [new Ball()];
    }
  }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) paddle.setDir(-1);
  else if (keyCode === RIGHT_ARROW) paddle.setDir(1);
  else if (key === ' ' && !gameStarted && !transitioning) gameStarted = true;
  else if (key === 'p' || key === 'P') togglePause();
  else if (key === 'r' || key === 'R') restartGame();
}

function keyReleased() {
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) paddle.setDir(0);
}

function togglePause() {
  paused = !paused;

  if (paused) {
    bgMusic.pause();
  } else {
    bgMusic.play();
  }
}

function restartGame() {
  if (lives < 0) {
    lives = 3;
    score = 0;
    level = 1;
    transitioning = false;
    transitionTimer = 0;
    createBlocks();
    balls = [new Ball()];
    loop();
  }
}

function displayUI() {
  select('#Puntos').html(`Puntuación: ${score}`);
  select('#Vidas').html(`Vidas: ${lives}`);
  select('#Nivel').html(`Nivel: ${level}`);

  if (!gameStarted && !transitioning && !paused) {
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text("Presiona ESPACIO para lanzar la pelota", width / 2, height / 2);
  }
}

function createBlocks() {
  blocks = [];
  let totalRows = rows + level - 1;
  let hitsPerLevel = level;

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < cols; c++) {
      let x = c * 70 + 35;
      let y = r * 30 + 30;
      let hits = hitsPerLevel;

      if (level === 3 && r === 1 && c === 3) hits = -1; // Bloque indestructible en el centro del tercer nivel

      blocks.push(new Block(x, y, hits));
    }
  }
}

function nextLevel() {
  if (level < 3) {
    level++;
    transitioning = true;
    transitionTimer = transitionDuration;
    gameStarted = false;
    createBlocks();
  } else {
    // Verificar si solo queda el bloque indestructible para ganar
    let remainingIndestructible = blocks.filter(block => block.hits === -1);
    if (remainingIndestructible.length === 1) {
      fill(0, 255, 0);
      textAlign(CENTER, CENTER);
      textSize(32);
      text("¡Ganaste!", width / 2, height / 2);
      noLoop();
    }
  }
}

class Paddle {
  constructor() {
    this.w = 100;
    this.h = 15;
    this.x = width / 2 - this.w / 2;
    this.y = height - 30;
    this.dir = 0;
  }

  display() {
    fill(255);
    rect(this.x, this.y, this.w, this.h);
  }

  move() {
    this.x += this.dir * 7;
    this.x = constrain(this.x, 0, width - this.w);
  }

  setDir(dir) {
    this.dir = dir;
  }
}

class Ball {
  constructor() {
    this.r = 10;
    this.reset();
  }

  reset() {
    this.speed = 3 + level;
    this.x = paddle.x + paddle.w / 2;
    this.y = paddle.y - this.r;
    this.xspeed = random([-1, 1]) * this.speed;
    this.yspeed = -this.speed;
  }

  move() {
    this.x += this.xspeed;
    this.y += this.yspeed;
  }

  display() {
    fill(255);
    ellipse(this.x, this.y, this.r * 2);
  }

  checkEdges(paddle) {
    if (this.x < this.r || this.x > width - this.r) this.xspeed *= -1;
    if (this.y < this.r) this.yspeed *= -1;

    if (
      this.y + this.r > paddle.y &&
      this.x > paddle.x &&
      this.x < paddle.x + paddle.w
    ) {
      let hitPoint = (this.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      let angle = hitPoint * PI / 3;
      this.speed = sqrt(this.xspeed ** 2 + this.yspeed ** 2);
      this.xspeed = this.speed * sin(angle);
      this.yspeed = -abs(this.speed * cos(angle));
      this.y = paddle.y - this.r;
    }
  }

  hits(block) {
    return (
      this.x > block.x &&
      this.x < block.x + block.w &&
      this.y - this.r < block.y + block.h &&
      this.y + this.r > block.y
    );
  }

  offScreen() {
    return this.y > height;
  }

  speedUp() {
    this.speed += 1;
    this.xspeed = this.speed * Math.sign(this.xspeed);
    this.yspeed = -this.speed;
  }
}

class Block {
  constructor(x, y, hits) {
    this.x = x;
    this.y = y;
    this.w = 60;
    this.h = 20;
    this.hits = hits;
    this.totalHits = hits;
    this.removing = false;
    this.removeProgress = 0;
  }

  display() {
    if (this.removing && this.removeProgress > 30) {
      fill(255, 255, 255, 200 - this.removeProgress * 3);
    } else if (this.hits === -1) {
      fill(150);
    } else {
      if (this.hits === 3) fill(255, 0, 0);
      else if (this.hits === 2) fill(255, 165, 0);
      else if (this.hits === 1) fill(0, 255, 0);
    }
    rect(this.x, this.y, this.w, this.h);
  }

  hit() {
    if (this.hits === -1) return false;
    this.hits--;
    return this.hits <= 0;
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 20;
  }

  update() {
    this.y += 2;
  }

  display() {
    fill(this.type === 'life' ? color(255, 0, 0) : color(0, 0, 255));
    ellipse(this.x, this.y, this.size);
  }

  hitsPaddle(paddle) {
    return (
      this.y + this.size / 2 > paddle.y &&
      this.y - this.size / 2 < paddle.y + paddle.h &&
      this.x > paddle.x &&
      this.x < paddle.x + paddle.w
    );
  }

  offScreen() {
    return this.y > height;
  }
}
