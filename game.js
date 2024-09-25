const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI элементы
const roundInfo = document.getElementById('roundInfo');
const timerText = document.getElementById('timer');
const shotsText = document.getElementById('shots');
const scoreText = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverMessage = document.getElementById('gameOverMessage');

// Загрузка изображений
const cannonImg = new Image();
cannonImg.src = 'https://i.imgur.com/6Xh1VZP.png'; // Замените на ссылку на изображение пушки

const wagonImg = new Image();
wagonImg.src = 'https://i.imgur.com/NZ8V7xT.png'; // Замените на ссылку на изображение вагонетки

const shellImg = new Image();
shellImg.src = 'https://i.imgur.com/2v3XgQK.png'; // Замените на ссылку на изображение ядра

// Звуки
const backgroundMusic = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // Замените на ссылку на фоновую музыку
backgroundMusic.loop = true;

const shootSound = new Audio('https://www.soundjay.com/mechanical/sounds/cannon-shot-01.mp3'); // Замените на ссылку на звук выстрела
const hitSound = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3'); // Замените на ссылку на звук попадания

// Объекты игры
let cannon;
let wagon;
let shells = [];
let targetsHit = 0;
let shotsLeft = 20;
let round = 1;
let timer = 90;
let roundActive = true;
let wagonSpeed = 2;
let cannonSpeed = 2;
let lastTime = 0;

// Класс Пушки
class Cannon {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 10;
        this.speed = cannonSpeed;
        this.direction = 1; // 1 - вправо, -1 - влево
    }

    update(delta) {
        this.x += this.direction * this.speed * delta;

        // Поворот направления при достижении границ
        if (this.x > canvas.width - this.width || this.x < 0) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.drawImage(cannonImg, this.x, this.y, this.width, this.height);
    }
}

// Класс Вагонетки
class Wagon {
    constructor(speed) {
        this.width = 80;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = 50;
        this.speed = speed;
        this.direction = 1; // 1 - вправо, -1 - влево
    }

    update(delta) {
        this.x += this.direction * this.speed * delta;

        // Поворот направления при достижении границ
        if (this.x > canvas.width - this.width || this.x < 0) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.drawImage(wagonImg, this.x, this.y, this.width, this.height);
    }
}

// Класс Ядра
class Shell {
    constructor(x, y, velocityX, velocityY) {
        this.width = 20;
        this.height = 20;
        this.x = x;
        this.y = y;
        this.vx = velocityX;
        this.vy = velocityY;
        this.active = true;
    }

    update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        // Проверка на выход за границы экрана
        if (this.y < -this.height || this.x < -this.width || this.x > canvas.width + this.width) {
            this.active = false;
        }
    }

    draw() {
        ctx.drawImage(shellImg, this.x, this.y, this.width, this.height);
    }
}

// Инициализация игры
function init() {
    cannon = new Cannon();
    wagon = new Wagon(wagonSpeed);
    backgroundMusic.play();
    requestAnimationFrame(gameLoop);
}

// Игровой цикл
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 16.67; // Примерное количество кадров в секунду
    lastTime = timestamp;

    update(delta);
    draw();

    if (roundActive) {
        requestAnimationFrame(gameLoop);
    }
}

// Обновление состояния игры
function update(delta) {
    // Обновление объектов
    cannon.update(delta);
    wagon.update(delta);

    // Обновление ядер
    shells.forEach(shell => shell.update(delta));
    shells = shells.filter(shell => shell.active);

    // Проверка столкновений
    shells.forEach(shell => {
        if (checkCollision(shell, wagon)) {
            shell.active = false;
            targetsHit++;
            hitSound.play();
            if (targetsHit >= 10) {
                endRound(true);
            }
        }
    });

    // Обновление таймера
    timer -= delta * (90 / 90); // Примерно 1 секунда за 60 кадров
    if (timer <= 0) {
        endRound(false);
    }

    // Обновление UI
    updateUI();
}

// Рисование объектов
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисование фона (небо и земля)
    // Небо уже задано в CSS, рисуем землю
    ctx.fillStyle = '#228B22'; // Зеленый цвет земли
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Рисование объектов
    cannon.draw();
    wagon.draw();
    shells.forEach(shell => shell.draw());
}

// Обработка нажатия кнопки "Пробел" для выстрела
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && roundActive) {
        shoot();
    }
});

// Функция выстрела
function shoot() {
    if (shotsLeft <= 0) return;

    const shellX = cannon.x + cannon.width / 2 - 10;
    const shellY = cannon.y;
    const velocityX = cannon.direction * cannon.speed * 0.5; // Инерция от пушки
    const velocityY = -10; // Скорость вверх

    shells.push(new Shell(shellX, shellY, velocityX, velocityY));
    shotsLeft--;
    shootSound.play();

    updateUI();

    if (shotsLeft <= 0 && targetsHit < 10) {
        endRound(false);
    }
}

// Проверка столкновений двух объектов (простой AABB)
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Обновление UI
function updateUI() {
    roundInfo.textContent = `Раунд: ${round}`;
    timerText.textContent = `Время: ${Math.ceil(timer)}`;
    shotsText.textContent = `Выстрелов: ${shotsLeft}`;
    scoreText.textContent = `Забито: ${targetsHit}/10`;
}

// Завершение раунда
function endRound(success) {
    roundActive = false;
    backgroundMusic.pause();
    gameOverScreen.style.display = 'block';
    if (success) {
        gameOverMessage.textContent = `Поздравляем! Вы выиграли раунд ${round}.`;
        // Переход к следующему раунду
        setTimeout(() => {
            round++;
            targetsHit = 0;
            shotsLeft = 20;
            timer = 90;
            wagonSpeed += 0.5;
            cannonSpeed += 0.5;
            cannon.speed = cannonSpeed;
            wagon.speed = wagonSpeed;
            gameOverScreen.style.display = 'none';
            backgroundMusic.play();
            roundActive = true;
            requestAnimationFrame(gameLoop);
        }, 2000);
    } else {
        gameOverMessage.textContent = `Время вышло или вы исчерпали выстрелы. Игра окончена!`;
    }
}

// Перезапуск игры
function restartGame() {
    gameOverScreen.style.display = 'none';
    round = 1;
    targetsHit = 0;
    shotsLeft = 20;
    timer = 90;
    wagonSpeed = 2;
    cannonSpeed = 2;
    cannon.speed = cannonSpeed;
    wagon.speed = wagonSpeed;
    shells = [];
    roundActive = true;
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    lastTime = 0;
    requestAnimationFrame(gameLoop);
}

// Инициализация после загрузки изображений
window.onload = function() {
    // Убедитесь, что все изображения загружены
    const imagesLoaded = () => {
        if (cannonImg.complete && wagonImg.complete && shellImg.complete) {
            init();
        } else {
            setTimeout(imagesLoaded, 100);
        }
    };
    imagesLoaded();
};
