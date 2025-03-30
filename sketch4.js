let cartaImagenes = [];
let cartas = [];
let cartaSeleccionada = [];
let cartasVolteadas = 0;
let pokemons = [];
const PARES = 10;
let espera = false;
const GRID_COLS = 5;
const ANCHO_CARTA = 100;
const ALTURA_CARTA = 100;
const PADDING = 20;
let offsetX, offsetY;

let inicio;
let fin = false;

function preload() {
    let pokemonIds = [];
    while (pokemonIds.length < PARES) {
        let randomId = Math.floor(Math.random() * 898) + 1;
        if (!pokemonIds.includes(randomId)) {
            pokemonIds.push(randomId);
        }
    }

    for (let id of pokemonIds) {
        let url = `https://pokeapi.co/api/v2/pokemon/${id}`;
        loadJSON(url, (data) => {
            let sprite = loadImage(data.sprites.front_default);
            pokemons.push(sprite);
            if (pokemons.length === PARES) {
                initializeGame();
            }
        });
    }
}

function initializeGame() {
    cartaImagenes
        = [...pokemons, ...pokemons];
    shuffle(cartaImagenes
        , true);

    let totalWidth = GRID_COLS * (ANCHO_CARTA + PADDING) - PADDING;
    let totalHeight = Math.ceil(cartaImagenes
        .length / GRID_COLS) * (ALTURA_CARTA + PADDING) - PADDING;
    offsetX = (windowWidth - totalWidth) / 2;
    offsetY = (windowHeight - totalHeight) / 2;

    cartas = [];
    for (let i = 0; i < cartaImagenes
        .length; i++) {
        cartas.push({
            image: cartaImagenes
            [i],
            isFlipped: false,
            matched: false,
            x: offsetX + (i % GRID_COLS) * (ANCHO_CARTA + PADDING),
            y: offsetY + Math.floor(i / GRID_COLS) * (ALTURA_CARTA + PADDING),
        });
    }

    inicio = millis();
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    if (pokemons.length === PARES) {
        initializeGame();
    }
}

function draw() {
    background(173, 216, 230);

    if (!fin) {
        let tiempoActual = millis() - inicio;
        let segundos = floor(tiempoActual / 1000);
        fill(0);
        textSize(32);
        textAlign(CENTER, TOP);
        text('Tiempo: ' + segundos + 's', width / 2, 20);
        text('Alumno: Carballo Caballero Jesus Alberto', width / 2, 60);
    }

    for (let card of cartas) {
        if (card.isFlipped || card.matched) {
            image(card.image, card.x, card.y, ANCHO_CARTA, ALTURA_CARTA);
        } else {
            fill(205, 255, 112);
            rect(card.x, card.y, ANCHO_CARTA, ALTURA_CARTA, 10);
        }
    }

    if (cartasVolteadas === PARES && !fin) {
        fin = true;
        noLoop();
        ventanaDeVictoria();
    }
}

function mousePressed() {
    if (espera || fin) return;

    for (let card of cartas) {
        if (
            mouseX > card.x &&
            mouseX < card.x + ANCHO_CARTA &&
            mouseY > card.y &&
            mouseY < card.y + ALTURA_CARTA &&
            !card.isFlipped &&
            !card.matched
        ) {
            card.isFlipped = true;
            cartaSeleccionada.push(card);

            if (cartaSeleccionada.length === 2) {
                espera = true;
                setTimeout(encontrarPar, 1000);
            }
            break;
        }
    }
}

function encontrarPar() {
    let [primeraCarta, segundaCarta] = cartaSeleccionada;

    if (primeraCarta.image === segundaCarta.image) {
        primeraCarta.matched = true;
        segundaCarta.matched = true;
        cartasVolteadas++;
    } else {
        primeraCarta.isFlipped = false;
        segundaCarta.isFlipped = false;
    }

    cartaSeleccionada = [];
    espera = false;
}

function ventanaDeVictoria() {
    let totalTime = millis() - inicio;
    let totalsegundos = floor(totalTime / 1000);

    fill(0, 0, 0, 150);
    rect(0, 0, width, height);

    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text('¡Has ganado!', width / 2, height / 2 - 50);
    text('Tiempo total: ' + totalsegundos + 's', width / 2, height / 2 + 50);
}

function shuffle(array, shouldMutate) {
    if (!shouldMutate) array = array.slice();
    let m = array.length, t, i;

    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}
