let jugador1, jugador2;
let pelota;
let puntuacionJ1 = 0, puntuacionJ2 = 0;
let puntajeGanador = 10;
let mostrarInstrucciones = true;

function setup() {
  createCanvas(600, 400);
  jugador1 = new jugador(10, height / 2 - 50);
  jugador2 = new jugador(width - 20, height / 2 - 50);
  pelota = new Pelota();
}

function draw() {
  background(173, 216, 230);

  if (mostrarInstrucciones) {
    fill(0);
    textSize(24); 
    textAlign(LEFT, TOP);
    text("            Equipo: Carballo Caballero Jesus Alberto\n                                          y\n                   Gutierrez Arce Andrey Julian", 10, 10);
    textAlign(CENTER, CENTER);
    text("Jugador 1: W para arriba, S para abajo", width / 2, height / 3);
    text("Jugador 2: Flecha arriba para arriba\nFlecha abajo para abajo", width / 2, height / 2);
    text("Presiona 'P' para comenzar", width / 2, (2 * height) / 3);
    return;
  }

  fill(0);
  textSize(32);
  text(puntuacionJ1, 50, 50);
  text(puntuacionJ2, width - 100, 50);



  if (puntuacionJ1 >= puntajeGanador || puntuacionJ2 >= puntajeGanador) {
    textSize(64);
    textAlign(CENTER, CENTER);
    let winner = puntuacionJ1 > puntuacionJ2 ? "Jugador 1" : "Jugador 2";
    text(`${winner} Gana!`, width / 2, height / 2);
    noLoop();
  } else {
    jugador1.show();
    jugador2.show();
    pelota.show();

    jugador1.move();
    jugador2.move();
    pelota.move();

    pelota.verificarColisionConJugador(jugador1);
    pelota.verificarColisionConJugador(jugador2);

    if (pelota.x < 0) {
      puntuacionJ2++;
      pelota.reset();
    } else if (pelota.x > width) {
      puntuacionJ1++;
      pelota.reset();
    }
  }
}

function keyPressed() {
  if (key === 'W' || key === 'w') {
    jugador1.setDirection(-1);
  } else if (key === 'S' || key === 's') {
    jugador1.setDirection(1);
  }

  if (keyCode === UP_ARROW) {
    jugador2.setDirection(-1);
  } else if (keyCode === DOWN_ARROW) {
    jugador2.setDirection(1);
  }

  if (key === 'p' || key === 'P') {
    mostrarInstrucciones = false;
    loop();
  }
}

function keyReleased() {
  if (key === 'W' || key === 'S' || key === 'w' || key === 's') {
    jugador1.setDirection(0);
  }

  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    jugador2.setDirection(0);
  }
}

class jugador {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 100;
    this.speed = 5;
    this.direction = 0;
    this.color = color(random(255), random(255), random(255));
  }

  show() {
    fill(this.color);
    rect(this.x, this.y, this.width, this.height);
  }

  move() {
    this.y += this.direction * this.speed;
    this.y = constrain(this.y, 0, height - this.height);
  }

  setDirection(dir) {
    this.direction = dir;
  }

  changeColor() {
    this.color = color(random(255), random(255), random(255));
  }
}

class Pelota {
  constructor() {
    this.reset();
    this.speedIncrement = 1.02; // Incremento constante en cada colisión
    this.color = color(random(255), random(255), random(255));
  }

  reset() {
    this.x = width / 2;
    this.y = height / 2;
    this.xSpeed = random(2, 4) * (random(1) > 0.5 ? 1 : -1);
    this.ySpeed = random(2, 4) * (random(1) > 0.5 ? 1 : -1);
    this.size = 20;
    this.color = color(random(255), random(255), random(255));
  }

  show() {
    fill(this.color);
    ellipse(this.x, this.y, this.size);
  }

  move() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;

    // Rebota en las paredes superiores e inferiores
    if (this.y < 0 || this.y > height) {
      this.ySpeed *= -1;
    }
  }

  verificarColisionConJugador(jugador) {
    if (this.x - this.size / 2 < jugador.x + jugador.width &&
      this.x + this.size / 2 > jugador.x &&
      this.y + this.size / 2 > jugador.y &&
      this.y - this.size / 2 < jugador.y + jugador.height) {

      // Invertir la dirección en el eje X
      this.xSpeed *= -1;

      // Determinar en qué parte del jugador ocurrió la colisión
      let offset = (this.y - (jugador.y + jugador.height / 2)) / (jugador.height / 2);

      // Si la colisión fue en la parte superior o inferior, cambiar la dirección vertical
      if (Math.abs(offset) > 0.5) {
        this.ySpeed = offset * 5; // Cambiar dirección hacia arriba o abajo
      }

      // Incrementar las velocidades de la pelota tras la colisión (aumenta de forma constante en ambos ejes)
      this.xSpeed *= this.speedIncrement;
      this.ySpeed *= this.speedIncrement;

      // Cambiar color de la pelota
      this.color = color(random(255), random(255), random(255));
      jugador.changeColor();

      // Mover la pelota ligeramente fuera del área de la paleta para evitar colisiones múltiples
      if (this.xSpeed > 0) {
        this.x = jugador.x + jugador.width + this.size / 2;
      } else {
        this.x = jugador.x - this.size / 2;
      }
    }
  }
}



