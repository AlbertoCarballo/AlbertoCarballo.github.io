let points = [];
let currentAlgorithm = 'dda'; // puede ser 'dda', 'bresenham' o 'punto-pendiente'

function setup() {
    createCanvas(1000, 400);
    background(255);
    textSize(16);
}

function draw() {
    background(255);

    stroke(0);
    noFill();
    rect(0, 0, width - 1, height - 1);

    // Mostrar los puntos
    for (let i = 0; i < points.length; i++) {
        fill(0);
        ellipse(points[i].x, points[i].y, 10, 10);
    }

    // Dibujar línea con el algoritmo seleccionado
    if (points.length === 2) {
        let p1 = points[0];
        let p2 = points[1];

        stroke(255, 0, 0);
        if (currentAlgorithm === 'dda') {
            drawDDA(p1.x, p1.y, p2.x, p2.y);
        } else if (currentAlgorithm === 'bresenham') {
            drawBresenham(p1.x, p1.y, p2.x, p2.y);
        } else if (currentAlgorithm === 'punto-pendiente') {
            drawPuntoPendiente(p1.x, p1.y, p2.x, p2.y);
        }

        // Mostrar texto de algoritmo actual
        noStroke();
        fill(0);
        text("Algoritmo: " + currentAlgorithm.toUpperCase(), 10, height - 10);
    }
}

function mousePressed() {
    if (points.length < 2) {
        points.push({ x: mouseX, y: mouseY });
    } else {
        points = [];
    }
}

function keyPressed() {
    if (key === 'd' || key === 'D') {
        currentAlgorithm = 'dda';
    } else if (key === 'b' || key === 'B') {
        currentAlgorithm = 'bresenham';
    } else if (key === 'p' || key === 'P') {
        currentAlgorithm = 'punto-pendiente';
    }
}

// DDA
function drawDDA(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    let steps = max(abs(dx), abs(dy));
    let incX = dx / steps;
    let incY = dy / steps;

    let x = x1;
    let y = y1;

    for (let i = 0; i <= steps; i++) {
        point(round(x), round(y));
        x += incX;
        y += incY;
    }
}

// Bresenham
function drawBresenham(x1, y1, x2, y2) {
    x1 = round(x1);
    y1 = round(y1);
    x2 = round(x2);
    y2 = round(y2);

    let dx = abs(x2 - x1);
    let dy = abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        point(x1, y1);
        if (x1 === x2 && y1 === y2) break;
        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
}

// Punto-pendiente
function drawPuntoPendiente(x1, y1, x2, y2) {
    if (x1 === x2) {
        // Línea vertical
        let startY = min(y1, y2);
        let endY = max(y1, y2);
        for (let y = startY; y <= endY; y++) {
            point(x1, y);
        }
    } else {
        let m = (y2 - y1) / (x2 - x1);
        let startX = min(x1, x2);
        let endX = max(x1, x2);
        for (let x = startX; x <= endX; x++) {
            let y = m * (x - x1) + y1;
            point(x, round(y));
        }
    }
}
