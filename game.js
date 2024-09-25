const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI элементы
const roundInfo = document.getElementById('roundInfo');
const timerText = document.getElementById('timer');
const shotsText = document.getElementById('shots');
const scoreText = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverMessage = document.getElementById('gameOverMessage');
const shootButton = document.getElementById('shootButton');

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
let timer = 90; // 90 секунд на раунд
let roundActive = true;
let wagonSpeed = 2;
let cannonSpeed = 2;
let endTime = 0; // Временной маркер окончания раунда

// Класс Пушки
class Cannon {
    constructor() {
        this.width = 50;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 10; // Немного выше нижней границы
        this.speed = cannonSpeed;
        this.direction = 1; // 1 - вправо, -1 - влево
        this.color = '#FF5733'; // Оранжево-красный цвет пушки
    }

    update(delta) {
        this.x += this.direction * this.speed * delta;

        // Поворот направления при достижении границ
        if (this.x > canvas.width - this.width || this.x < 0) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Рисуем корпус пушки
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fill();

        // Рисуем дуло пушки
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width / 2 - 10, this.y - 20);
        ctx.lineTo(this.x + this.width / 2 + 10, this.y - 20);
        ctx.closePath();
        ctx.fill();
    }
}

// Класс Вагонетки
class Wagon {
    constructor(speed) {
        this.width = 80;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = 20; // Немного ниже верхней границы
        this.speed = speed;
        this.direction = 1; // 1 - вправо, -1 - влево
        this.color = '#8B4513'; // Коричневый цвет вагонетки
    }

    update(delta) {
        this.x += this.direction * this.speed * delta;

        // Поворот направления при достижении границ
        if (this.x > canvas.width - this.width || this.x < 0) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Рисуем корпус вагонетки
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fill();

        // Рисуем колеса
        ctx.fillStyle = '#000'; // Черные колеса
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + this.height, 10, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 15, this.y + this.height, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Класс Ядра
class Shell {
    constructor(x, y, velocityX, velocityY) {
        this.radius = 10;
        this.x = x;
        this.y = y;
        this.vx = velocityX;
        this.vy = velocityY;
        this.active = true;
        this.color = '#FFD700'; // Золотой цвет ядра
    }

    update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        // Проверка на выход за границы экрана
        if (this.y < -this.radius || this.x < -this.radius || this.x > canvas.width + this.radius) {
            this.active = false;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Инициализация игры
function init() {
    // Инициализация объектов
    cannon = new Cannon();
    wagon = new Wagon(wagonSpeed);

    // Запуск фоновой музыки
    backgroundMusic.play();

    // Установка времени окончания раунда
    endTime = performance.now() + 90000; // 90 секунд от текущего времени

    // Запуск игрового цикла
    requestAnimationFrame(gameLoop);
}

// Игровой цикл
function gameLoop(timestamp) {
    if (!endTime) {
        endTime = timestamp + 90000; // Установка времени окончания, если оно не задано
    }

    update(timestamp);
    draw();

    if (roundActive) {
        requestAnimationFrame(gameLoop);
    }
}

// Обновление состояния игры
function update(timestamp) {
    // Вычисляем оставшееся время
    timer = (endTime - timestamp) / 1000; // В секундах

    if (timer < 0) timer = 0;

    // Обновление объектов
    const delta = 1 / 60; // Предполагаемая частота обновления ~60 FPS
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

    // Проверка окончания раунда
    if (timer <= 0) {
        endRound(false);
    }

    // Обновление UI
    updateUI();
}

// Рисование объектов
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисование границ игровой зоны (уже сделано через CSS, дополнительные элементы можно добавить здесь)
    // Например, можно нарисовать сетку или другие декоративные элементы

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

// Обработка нажатия кнопки "Выстрелить" на мобильных устройствах
shootButton.addEventListener('click', function() {
    if (roundActive) {
        shoot();
    }
});

// Функция выстрела
function shoot() {
    if (shotsLeft <= 0) return;

    const shellX = cannon.x + cannon.width / 2;
    const shellY = cannon.y;
    const velocityX = cannon.direction * cannon.speed * 0.5; // Инерция от пушки

    // Рассчитаем velocityY для достижения вагонетки за 0.7 секунды
    // Позиция вагонетки: y = 20
    // Позиция выстрела: y = 640 - 30 - 10 = 600
    // Расстояние: 600 - 20 = 580 пикселей
    // Время: 0.7 секунд
    // velocityY = distance / time = 580 / 0.7 ≈ 828.57 пикселей/сек
    // Направление вверх, поэтому отрицательное
    const velocityY = -828.57;

    shells.push(new Shell(shellX, shellY, velocityX, velocityY));
    shotsLeft--;
    shootSound.play();

    updateUI();

    if (shotsLeft <= 0 && targetsHit < 10) {
        endRound(false);
    }
}

// Проверка столкновений двух объектов (круг и прямоугольник)
function checkCollision(shell, wagon) {
    // Находим ближайшую точку на вагонетке к ядру
    const closestX = clamp(shell.x, wagon.x, wagon.x + wagon.width);
    const closestY = clamp(shell.y, wagon.y, wagon.y + wagon.height);

    // Вычисляем расстояние до ближайшей точки
    const distanceX = shell.x - closestX;
    const distanceY = shell.y - closestY;

    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    return distanceSquared < (shell.radius * shell.radius);
}

// Функция ограничивает значение между min и max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
        // Переход к следующему раунду через 2 секунды
        setTimeout(() => {
            round++;
            targetsHit = 0;
            shotsLeft = 20;
            timer = 90;
            wagonSpeed += 0.5;
            cannonSpeed += 0.5;
            cannon.speed = cannonSpeed;
            wagon.speed = wagonSpeed;
            shells = [];
            gameOverScreen.style.display = 'none';
            backgro
