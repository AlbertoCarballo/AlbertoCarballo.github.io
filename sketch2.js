let img1, img2, img3, img4;
let selectedImage = null;

function preload() {
    img1 = loadImage("https://picsum.photos/300?random=1");
    img2 = loadImage("https://picsum.photos/300?random=2");
    img3 = loadImage("https://picsum.photos/300?random=3");
    img4 = loadImage("https://picsum.photos/300?random=4");
}

function setup() {
    createCanvas(600, 600);
}

function draw() {
    background(0);

    if (selectedImage === null) {
        image(img1, 0, 0, 300, 300);
        image(img2, 300, 0, 300, 300);
        image(img3, 0, 300, 300, 300);
        image(img4, 300, 300, 300, 300);
    } else {
        image(selectedImage, 0, 0, width, height);
    }
}

function mouseClicked() {
    if (selectedImage !== null) {
        selectedImage = null;
        return;
    }

    if (mouseX >= 0 && mouseX <= 300 && mouseY >= 0 && mouseY <= 300) {
        selectedImage = img1;
    } else if (mouseX >= 300 && mouseX <= 600 && mouseY >= 0 && mouseY <= 300) {
        selectedImage = img2;
    } else if (mouseX >= 0 && mouseX <= 300 && mouseY >= 300 && mouseY <= 600) {
        selectedImage = img3;
    } else if (mouseX >= 300 && mouseX <= 600 && mouseY >= 300 && mouseY <= 600) {
        selectedImage = img4;
    }
}