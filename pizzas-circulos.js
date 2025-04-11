let input, button, label;
let slices = 0;

function setup() {
    createCanvas(800, 450);
    textSize(16);

    label = createP('Carballo Caballero Jesús Alberto / Gutierrez Arce Andrey Julian');
    label.position(20, 400);

    label = createP('Ingrese el número de rebanadas:');
    label.position(20, 0);

    input = createInput('0');
    input.position(20, 60);
    input.size(50);
    input.style('height', '24px');

    button = createButton('Calcular');
    button.position(input.x + input.width + 10, 60);
    button.style('height', '30px');
    button.style('background-color', '#4CAF50');
    button.style('color', 'white');
    button.style('border', 'none');
    button.style('padding', '0 12px');
    button.style('border-radius', '4px');
    button.mousePressed(updateSlices);

    noLoop();
}

function updateSlices() {
    let val = int(input.value());
    if (val >= 0) {
        slices = val;
        redraw();
    }
}

function draw() {
    background(255);

    text("Punto-Pendiente", 80, 120);
    text("DDA", 360, 120);
    text("Bresenham", 620, 120);

    drawPizza(150, 250, 100, slices, drawCircleMidpoint);
    drawPizza(400, 250, 100, slices, drawCircleMidpoint);
    drawPizza(650, 250, 100, slices, drawCircleMidpoint);
}

function drawPizza(cx, cy, r, num, circleFunc) {
    circleFunc(cx, cy, r);

    // Dibuja las "rebanadas"
    if (num <= 0) return;

    for (let i = 0; i < num; i++) {
        let angle = TWO_PI * i / num;
        let x = cx + r * cos(angle);
        let y = cy + r * sin(angle);
        line(cx, cy, x, y);
    }
}

function drawCircleMidpoint(xc, yc, r) {
    let x = 0;
    let y = r;
    let p = 1 - r;

    while (x <= y) {
        point(xc + x, yc + y);
        point(xc - x, yc + y);
        point(xc + x, yc - y);
        point(xc - x, yc - y);
        point(xc + y, yc + x);
        point(xc - y, yc + x);
        point(xc + y, yc - x);
        point(xc - y, yc - x);

        x++;

        if (p < 0) {
            p += 2 * x + 3;
        } else {
            y--;
            p += 2 * (x - y) + 5;
        }
    }
}
