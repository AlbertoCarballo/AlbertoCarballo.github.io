const PLAYER_WIDTH = 40, PLAYER_HEIGHT = 20, PLAYER_SPEED = 5, PLAYER_SHOOT_INTERVAL = 300, MAX_PLAYER_BULLETS = 2,
  PLAYER_INVULNERABILITY_DURATION = 2000, BULLET_RADIUS = 4, PLAYER_BULLET_SPEED = 8, ENEMY_BULLET_RADIUS = 4,
  ENEMY_BULLET_SPEED = 3.5, ENEMY_DEFAULT_SIZE = 28, ENEMY_RESISTANT_SIZE_INCREASE = 4, ENEMY_BOSS_SIZE = 60,
  INITIAL_LIVES = 3, INITIAL_ENEMY_SPEED = 0.5, ENEMY_DIVE_SPEED_MULTIPLIER = 2.5, ENEMY_ENTER_SPEED_MULTIPLIER = 3,
  LEVEL_TRANSITION_TIME = 2000, SCORE_PER_ENEMY_NORMAL = 50, SCORE_PER_ENEMY_DIVING_NORMAL = 100,
  SCORE_PER_ENEMY_RESISTANT_FORMATION = 150, SCORE_PER_ENEMY_RESISTANT_DIVING = 400, SCORE_PER_ENEMY_BOSS = 800,
  DIVE_ATTACK_INTERVAL_MIN = 2000, DIVE_ATTACK_INTERVAL_MAX = 4000, MAX_SIMULTANEOUS_DIVERS = 2,
  EnemyState = { IDLE: 0, ENTERING_FORMATION: 1, IN_FORMATION: 2, WAITING_TO_DIVE: 3, DIVING: 4 };

let player, bullets = [], enemyBullets = [], enemies = [], formationSlots = [],
  score = 0, lives = INITIAL_LIVES, level = 1, enemySpeed = INITIAL_ENEMY_SPEED,
  gameStarted = false, gameOver = false, shooting = false, lastPlayerShotTime = 0,
  transitioningToNextLevel = false, levelTransitionTimer = 0,
  playerInvulnerable = false, playerInvulnerableTimer = 0, nextDiveAttackTime = 0;

// === Setup y Loop ===
function setup() {
  createCanvas(600, 480);
  player = new Player();
  initSlots();
  loop();
}
function draw() {
  background(0);
  if (gameOver) return gameOverScreen();
  if (!gameStarted) return startScreen();
  if (transitioningToNextLevel) return transitionScreen();
  playerLogic(); bulletLogic(); enemyLogic(); diveLogic(); collisions(); drawHUD();
  if (!transitioningToNextLevel && enemies.every(e => e.state === EnemyState.IDLE || e.markedForRemoval)) nextLevel();
}

// === Inicialización ===
const initSlots = () => {
  formationSlots = [];
  let rows = 5, cols = 8, h = 40, v = 35,
    startX = (width - (cols - 1) * h) / 2, startY = 60;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      formationSlots.push({ x: startX + c * h, y: startY + r * v, isOccupied: false, enemyType: null, id: `slot_${r}_${c}` });
};

const startGame = () => {
  Object.assign(window, {
    gameStarted: true, gameOver: false, score: 0, lives: INITIAL_LIVES, level: 1,
    enemySpeed: INITIAL_ENEMY_SPEED, bullets: [], enemyBullets: [], enemies: []
  });
  player.reset(); initSlots(); spawnEnemies(level);
  nextDiveAttackTime = millis() + random(DIVE_ATTACK_INTERVAL_MIN, DIVE_ATTACK_INTERVAL_MAX); loop();
};

const resetGame = () => startGame();

// === Lógica principal ===
const playerLogic = () => {
  player.show(); player.move(); let now = millis();
  if (playerInvulnerable && now - playerInvulnerableTimer > PLAYER_INVULNERABILITY_DURATION) playerInvulnerable = false;
  if (shooting && now - lastPlayerShotTime > PLAYER_SHOOT_INTERVAL && bullets.length < MAX_PLAYER_BULLETS)
    bullets.push(new Bullet(player.x + player.w / 2, player.y)), lastPlayerShotTime = now;
};

const bulletLogic = () => {
  [bullets, enemyBullets].forEach(list => {
    for (let i = list.length - 1; i >= 0; i--) list[i].update(), list[i].show(), list[i].isOffScreen() && list.splice(i, 1);
  });
};

const enemyLogic = () => {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.update(player); e.show();
    if (e.markedForRemoval) {
      let s = formationSlots.find(s => s.id === e.formationSlotId); if (s) s.isOccupied = false;
      enemies.splice(i, 1);
    }
  }
};

const diveLogic = () => {
  let now = millis();
  if (now > nextDiveAttackTime && enemies.filter(e => e.state === EnemyState.DIVING).length < MAX_SIMULTANEOUS_DIVERS) {
    let c = enemies.filter(e => e.state === EnemyState.IN_FORMATION && e.canDive);
    if (c.length) random(c).startDive(player);
    nextDiveAttackTime = now + random(DIVE_ATTACK_INTERVAL_MIN, DIVE_ATTACK_INTERVAL_MAX);
  }
};

const nextLevel = () => {
  level++; transitioningToNextLevel = true; levelTransitionTimer = millis();
  bullets = []; enemyBullets = []; enemies = []; initSlots();
};

const collisions = () => {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (b.hits(e)) {
        bullets.splice(i, 1);
        if (e.takeDamage()) {
          score += getEnemyScore(e);
          e.markedForRemoval = true;
        }
        break;
      }
    }
  }
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (!playerInvulnerable && b.hitsPlayer(player)) {
      enemyBullets.splice(i, 1);
      loseLife();
    }
  }
  for (let e of enemies) {
    if (!playerInvulnerable && e.hitsPlayer(player)) {
      e.markedForRemoval = true;
      loseLife();
    }
  }
};

const loseLife = () => {
  lives--;
  playerInvulnerable = true;
  playerInvulnerableTimer = millis();
  player.resetPosition();
  if (lives <= 0) {
    storeScore(score);
    gameOver = true;
  }
};

const spawnEnemies = (level) => {
  let slots = [...formationSlots];
  shuffle(slots, true);
  let total = min(slots.length, 10 + level * 2);
  for (let i = 0; i < total; i++) {
    let slot = slots[i];
    if (!slot) break;
    let enemy;
    if (level % 5 === 0 && i === 0) {
      enemy = new BossEnemy(width / 2, -ENEMY_BOSS_SIZE);
      enemies.push(enemy);
      continue;
    }
    if (level >= 4 && random() < 0.2) {
      enemy = new ResistantEnemy(slot.x, -30);
    } else if (level >= 3 && random() < 0.2) {
      enemy = new FastZigZagEnemy(slot.x, -30);
    } else if (random() < 0.3) {
      enemy = new BasicEnemy(slot.x, -30);
    } else {
      enemy = new Enemy(slot.x, -30);
    }
    enemy.assignFormationSlot(slot.x, slot.y, slot.id);
    slot.isOccupied = true;
    enemies.push(enemy);
  }
};

const getEnemyScore = (e) => {
  if (e instanceof BossEnemy) return SCORE_PER_ENEMY_BOSS;
  if (e instanceof ResistantEnemy)
    return e.state === EnemyState.DIVING ? SCORE_PER_ENEMY_RESISTANT_DIVING : SCORE_PER_ENEMY_RESISTANT_FORMATION;
  if (e instanceof BasicEnemy)
    return e.state === EnemyState.DIVING ? SCORE_PER_ENEMY_DIVING_NORMAL : SCORE_PER_ENEMY_NORMAL;
  return SCORE_PER_ENEMY_NORMAL;
};

// === HUD y Pantallas ===
const drawHUD = () => {
  fill(255); textSize(14); textAlign(LEFT, TOP);
  text(`PUNTOS: ${score}`, 10, 10); text(`NIVEL: ${level}`, width - 70, 10);
  for (let i = 0; i < lives; i++) rect(10 + i * (PLAYER_WIDTH * 0.7 + 5), height - PLAYER_HEIGHT * 0.7 - 5, PLAYER_WIDTH * 0.7, PLAYER_HEIGHT * 0.7, 3);
  let hi = JSON.parse(localStorage.getItem('galagaHighScore')) || 0;
  textAlign(CENTER, TOP); text(`MAX: ${Math.max(score, hi)}`, width / 2, 10);
};

const startScreen = () => {
  let hi = JSON.parse(localStorage.getItem('galagaHighScore')) || 0, y = height / 2 + 80;
  fill(255); textAlign(CENTER, CENTER); textSize(20); text("1 JUGADOR", width / 2, height / 2 - 60);
  textSize(14); text(`MAX PUNTUACIÓN: ${hi}`, width / 2, height / 2 - 20);
  textSize(18); fill(0, 200, 255); text("PRESIONA ESPACIO PARA INICIAR", width / 2, height / 2 + 30);
  textSize(12); textAlign(LEFT, CENTER);
  [[150, 0, 255, "= 50 PTS"], [255, 0, 0, "= 80 PTS"], [255, 165, 0, "= 150 PTS"]].forEach(([r, g, b, t], i) => { fill(r, g, b); rect(width / 2 - 100, y + i * 20, 15, 10); text(t, width / 2 - 80, y + 5 + i * 20) });
  fill(255, 0, 0); rect(width / 2 + 20, y, 15, 10); text("PICANDO = DOBLE", width / 2 + 40, y + 5);
};

const gameOverScreen = () => {
  fill(255, 0, 0); textAlign(CENTER, CENTER); textSize(38);
  text("GAME OVER", width / 2, height / 2 - 20);
  fill(255); textSize(18); text("Presiona 'R' para reiniciar", width / 2, height / 2 + 30);
};

const transitionScreen = () => {
  background(0); fill(255); textAlign(CENTER, CENTER); textSize(28);
  text(`NIVEL ${level}`, width / 2, height / 2);
  if (millis() - levelTransitionTimer > LEVEL_TRANSITION_TIME) {
    transitioningToNextLevel = false;
    spawnEnemies(level);
    nextDiveAttackTime = millis() + random(DIVE_ATTACK_INTERVAL_MIN, DIVE_ATTACK_INTERVAL_MAX);
  }
};

// === Entrada y Puntaje ===
function keyPressed() {
  console.log(`Tecla presionada: ${key}`);
  if (gameOver) return (key === 'r' || key === 'R') && resetGame();
  if (key === ' ') return !gameStarted ? startGame() : shooting = true;
  if (keyCode === LEFT_ARROW) player.setDir(-1);
  else if (keyCode === RIGHT_ARROW) player.setDir(1);
}

function keyReleased() {
  if (key === ' ') shooting = false;
  if ((keyCode === LEFT_ARROW && player.dir === -1) || (keyCode === RIGHT_ARROW && player.dir === 1)) player.setDir(0);
}

const storeScore = s => {
  let hi = JSON.parse(localStorage.getItem('galagaHighScore')) || 0;
  if (s > hi) localStorage.setItem('galagaHighScore', JSON.stringify(s));
};

class Player {
  constructor() { this.w = PLAYER_WIDTH; this.h = PLAYER_HEIGHT; this.dir = 0; this.resetPosition(); }
  resetPosition() { this.x = width / 2 - this.w / 2; this.y = height - this.h - 15; }
  reset() { this.resetPosition(); this.dir = 0; }
  setDir(d) { this.dir = d; }
  move() { this.x = constrain(this.x + this.dir * PLAYER_SPEED, 0, width - this.w); }
  show() {
    if (playerInvulnerable && frameCount % 10 < 5) return;
    fill(200); rect(this.x + this.w * 0.2, this.y, this.w * 0.6, this.h);
    fill(255, 0, 0);
    triangle(this.x, this.y + this.h, this.x + this.w * 0.2, this.y + this.h, this.x + this.w * 0.2, this.y + this.h * 0.5);
    triangle(this.x + this.w, this.y + this.h, this.x + this.w * 0.8, this.y + this.h, this.x + this.w * 0.8, this.y + this.h * 0.5);
    fill(0, 0, 200); ellipse(this.x + this.w / 2, this.y + this.h * 0.3, this.w * 0.3, this.h * 0.4);
  }
}

class Bullet {
  constructor(x, y) { Object.assign(this, { x, y, r: BULLET_RADIUS, speed: PLAYER_BULLET_SPEED, color: color(255) }); }
  update() { this.y -= this.speed; }
  show() { fill(this.color); noStroke(); ellipse(this.x, this.y, this.r, this.r * 2.5); }
  isOffScreen() { return this.y < -this.r * 2; }
  hits(e) { return e && !e.markedForRemoval && dist(this.x, this.y, e.x, e.y) < this.r + e.getHitboxRadius(); }
}

class EnemyBullet extends Bullet {
  constructor(x, y) { super(x, y); this.speed = ENEMY_BULLET_SPEED + random(-0.5, 0.5); this.color = color(255, 0, 255); }
  update() { this.y += this.speed; }
  isOffScreen() { return this.y > height + this.r * 2; }
  hitsPlayer(p) { return this.y + this.r > p.y && this.y - this.r < p.y + p.h && this.x > p.x && this.x < p.x + p.w; }
}

class EnemyBase {
  constructor(x, y, size = ENEMY_DEFAULT_SIZE) {
    Object.assign(this, {
      x, y, size, state: EnemyState.ENTERING_FORMATION, markedForRemoval: false,
      startX: x, startY: y, canShoot: true, canDive: true, formationSlotId: null, isFormationMember: false,
      shootCooldown: random(1000, 3000), lastShotTime: millis(), diveProgress: 0, diveDuration: random(2500, 4000)
    });
  }
  assignFormationSlot(x, y, id) { Object.assign(this, { targetFormationX: x, targetFormationY: y, formationSlotId: id, state: EnemyState.ENTERING_FORMATION, isFormationMember: true }); }
  getHitboxRadius() { return this.size * 0.4; }
  update(player) {
    if (this.state === EnemyState.ENTERING_FORMATION) this.moveToFormation();
    else if (this.state === EnemyState.DIVING) this.performDive(player);
    if (this.y > height + this.size * 2 && this.state === EnemyState.DIVING) this.markedForRemoval = true;
  }
  moveToFormation() {
    let dx = this.targetFormationX - this.x, dy = this.targetFormationY - this.y,
      d = sqrt(dx * dx + dy * dy), speed = enemySpeed * ENEMY_ENTER_SPEED_MULTIPLIER;
    if (d < speed) Object.assign(this, { x: this.targetFormationX, y: this.targetFormationY, state: EnemyState.IN_FORMATION, lastShotTime: millis() + random(500, 1500) });
    else this.x += dx / d * speed, this.y += dy / d * speed;
  }
  startDive(p) {
    if (this.state !== EnemyState.IN_FORMATION) return;
    Object.assign(this, {
      state: EnemyState.DIVING, diveProgress: 0, timeDiveStarted: millis(),
      diveTargetX: p.x + p.w / 2 + random(-width / 4, width / 4), diveTargetY: height + this.size * 2,
      diveControlX1: this.x + random(-width / 3, width / 3), diveControlY1: this.y + random(height * 0.3, height * 0.5),
      diveControlX2: this.diveTargetX + random(-width / 4, width / 4), diveControlY2: this.diveTargetY - random(height * 0.2, height * 0.4),
      lastShotTime: millis() + random(100, 500)
    });
  }
  performDive(p) {
    this.diveProgress = min(1, (millis() - this.timeDiveStarted) / this.diveDuration);
    let t = this.diveProgress, omt = 1 - t;
    this.x = omt ** 3 * this.startX + 3 * omt ** 2 * t * this.diveControlX1 + 3 * omt * t ** 2 * this.diveControlX2 + t ** 3 * this.diveTargetX;
    this.y = omt ** 3 * this.startY + 3 * omt ** 2 * t * this.diveControlY1 + 3 * omt * t ** 2 * this.diveControlY2 + t ** 3 * this.diveTargetY;
    if (this.canShoot && millis() > this.lastShotTime && this.y < p.y) {
      enemyBullets.push(new EnemyBullet(this.x, this.y));
      this.lastShotTime = millis() + this.shootCooldown * 0.5;
    }
    if (t === 1) this.markedForRemoval = true;
  }
  hitsPlayer(p) {
    let r = this.getHitboxRadius();
    return this.x + r > p.x && this.x - r < p.x + p.w && this.y + r > p.y && this.y - r < p.y + p.h;
  }
  show() { }
  takeDamage() { return true; }
}

class BasicEnemy extends EnemyBase {
  constructor(x, y) { super(x, y, ENEMY_DEFAULT_SIZE - 4); this.color = color(180, 100, 255); this.canShoot = false; this.shootCooldown = 2000; }
  show() {
    if (this.markedForRemoval) return;
    fill(this.color); stroke(255); strokeWeight(1);
    beginShape(); vertex(this.x, this.y - this.size * 0.4); vertex(this.x + this.size * 0.5, this.y + this.size * 0.4);
    vertex(this.x, this.y + this.size * 0.1); vertex(this.x - this.size * 0.5, this.y + this.size * 0.4); endShape(CLOSE);
  }
  performDive(p) {
    super.performDive(p);
    if (this.state === EnemyState.DIVING && random() < 0.005 && this.y < p.y && millis() > this.lastShotTime) {
      enemyBullets.push(new EnemyBullet(this.x, this.y));
      this.lastShotTime = millis() + this.shootCooldown * 2;
    }
  }
}

class Enemy extends EnemyBase {
  constructor(x, y) { super(x, y); this.color = color(255, 50, 50); this.canShoot = true; this.shootCooldown = random(1500, 2500); }
  show() {
    if (this.markedForRemoval) return;
    fill(this.color); stroke(0); strokeWeight(1);
    ellipse(this.x - this.size * 0.25, this.y, this.size * 0.6, this.size * 0.8);
    ellipse(this.x + this.size * 0.25, this.y, this.size * 0.6, this.size * 0.8);
    fill(255, 255, 0); ellipse(this.x, this.y, this.size * 0.3, this.size * 0.3);
  }
}

class ResistantEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, ENEMY_DEFAULT_SIZE + ENEMY_RESISTANT_SIZE_INCREASE);
    Object.assign(this, {
      baseColor: color(50, 200, 50), wingColor: color(0, 100, 200), hp: 2,
      hitColor: color(255), lastHitDisplayTime: 0, canShoot: true,
      shootCooldown: random(1200, 2200)
    });
  }
  takeDamage() {
    this.hp--; this.lastHitDisplayTime = millis();
    return this.hp <= 0;
  }
  show() {
    if (this.markedForRemoval) return;
    let c = (millis() - this.lastHitDisplayTime < 100 && this.hp > 0) ? this.hitColor : this.baseColor;
    fill(c); stroke(0); strokeWeight(1); rectMode(CENTER);
    rect(this.x, this.y, this.size * 0.6, this.size * 0.8);
    fill(this.wingColor);
    triangle(this.x - this.size * 0.3, this.y - this.size * 0.4, this.x - this.size * 0.3, this.y + this.size * 0.4, this.x - this.size * 0.7, this.y);
    triangle(this.x + this.size * 0.3, this.y - this.size * 0.4, this.x + this.size * 0.3, this.y + this.size * 0.4, this.x + this.size * 0.7, this.y);
    rectMode(CORNER);
  }
}


class FastZigZagEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y);
    Object.assign(this, {
      color: color(0, 200, 255), canShoot: true,
      shootCooldown: random(800, 1500), zigZagAngle: random(TWO_PI),
      zigZagAmplitude: this.size * 0.1, zigZagFrequency: 0.1
    });
  }
  performDive(p) {
    super.performDive(p);
    if (this.state === EnemyState.DIVING) {
      this.x += sin(this.zigZagAngle) * this.zigZagAmplitude;
      this.zigZagAngle += this.zigZagFrequency;
    }
  }
  show() {
    if (this.markedForRemoval) return;
    fill(this.color); stroke(255); strokeWeight(1);
    ellipse(this.x, this.y, this.size, this.size * 0.7);
    fill(0); ellipse(this.x, this.y, this.size * 0.2, this.size * 0.2);
  }
}

class BossEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, ENEMY_BOSS_SIZE);
    Object.assign(this, {
      state: EnemyState.DIVING, isFormationMember: false,
      baseColor: color(255, 69, 0), hp: 5 + level * 2,
      hitColor: color(255), lastHitDisplayTime: 0,
      canShoot: true, shootCooldown: random(500, 1000),
      timeDiveStarted: millis(), diveDuration: 10000
    });
  }
  takeDamage() { this.hp--; this.lastHitDisplayTime = millis(); return this.hp <= 0; }
  update() {
    this.y = min(this.y + enemySpeed * 0.3, height * 0.4);
    this.x = width / 2 + sin(millis() * 0.001 * (level + 1)) * (width / 3);
    if (this.canShoot && millis() > this.lastShotTime) {
      [-1, 0, 1].forEach(i => enemyBullets.push(new EnemyBullet(this.x + i * 20, this.y + this.getHitboxRadius())));
      this.lastShotTime = millis() + this.shootCooldown / (level * 0.5);
    }
    if (this.hp <= 0) this.markedForRemoval = true;
  }
  show() {
    if (this.markedForRemoval) return;
    let c = (millis() - this.lastHitDisplayTime < 100 && this.hp > 0) ? this.hitColor : this.baseColor;
    fill(c); stroke(0); strokeWeight(2);
    ellipse(this.x, this.y, this.size, this.size);
    fill(255, 255, 0);
    ellipse(this.x - this.size * 0.2, this.y - this.size * 0.1, this.size * 0.15, this.size * 0.2);
    ellipse(this.x + this.size * 0.2, this.y - this.size * 0.1, this.size * 0.15, this.size * 0.2);
  }
}
