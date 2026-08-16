const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const healthElement = document.getElementById("health");
const scoreElement = document.getElementById("score");
const playersElement = document.getElementById("players");
const statusElement = document.getElementById("status");

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const shootButton = document.getElementById("shootButton");

let socket;

let myId = null;

let players = {};

let health = 100;
let score = 0;

let joystickX = 0;
let joystickY = 0;

let shooting = false;

const SERVER_URL = "wss://YOUR-SERVER-ADDRESS";

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


/* =========================
   CONNECT TO SERVER
========================= */

function connect() {

    statusElement.textContent = "Connecting...";

    socket = new WebSocket(SERVER_URL);

    socket.addEventListener("open", () => {

        statusElement.textContent = "🟢 Online";

        socket.send(JSON.stringify({
            type: "join"
        }));

    });

    socket.addEventListener("message", event => {

        const message = JSON.parse(event.data);

        if (message.type === "welcome") {

            myId = message.id;

        }

        if (message.type === "state") {

            players = message.players;

            playersElement.textContent =
                Object.keys(players).length;

            if (myId && players[myId]) {

                health = players[myId].health;
                score = players[myId].score;

                healthElement.textContent = health;
                scoreElement.textContent = score;
            }
        }

    });

    socket.addEventListener("close", () => {

        statusElement.textContent = "🔴 Offline";

        setTimeout(connect, 3000);

    });

    socket.addEventListener("error", () => {

        statusElement.textContent = "⚠️ Connection error";

    });
}


/* =========================
   SEND MOVEMENT
========================= */

setInterval(() => {

    if (!socket) return;

    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
        type: "move",
        x: joystickX,
        y: joystickY
    }));

}, 50);


/* =========================
   SHOOT
========================= */

function shoot() {

    if (!socket) return;

    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
        type: "shoot"
    }));
}

shootButton.addEventListener("pointerdown", () => {

    shooting = true;

    shoot();

});

shootButton.addEventListener("pointerup", () => {

    shooting = false;

});


/* =========================
   JOYSTICK
========================= */

let joystickActive = false;

function updateJoystick(clientX, clientY) {

    const rect = joystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const maxDistance = 40;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {

        dx = dx / distance * maxDistance;
        dy = dy / distance * maxDistance;

    }

    joystickX = dx / maxDistance;
    joystickY = dy / maxDistance;

    stick.style.transform =
        `translate(${dx}px, ${dy}px)`;
}

function resetJoystick() {

    joystickActive = false;

    joystickX = 0;
    joystickY = 0;

    stick.style.transform =
        "translate(0px, 0px)";
}

joystick.addEventListener("pointerdown", event => {

    joystickActive = true;

    joystick.setPointerCapture(event.pointerId);

    updateJoystick(
        event.clientX,
        event.clientY
    );

});

joystick.addEventListener("pointermove", event => {

    if (!joystickActive) return;

    updateJoystick(
        event.clientX,
        event.clientY
    );

});

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);


/* =========================
   DRAW GAME
========================= */

function drawMap() {

    ctx.fillStyle = "#303030";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // grid

    ctx.strokeStyle = "#404040";
    ctx.lineWidth = 1;

    const gridSize = 50;

    for (
        let x = 0;
        x < canvas.width;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);

        ctx.stroke();
    }

    for (
        let y = 0;
        y < canvas.height;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);

        ctx.stroke();
    }
}


function drawPlayers() {

    for (const id in players) {

        const player = players[id];

        const x =
            player.x * canvas.width;

        const y =
            player.y * canvas.height;

        if (id === myId) {

            ctx.fillStyle = "#4CAF50";

        } else {

            ctx.fillStyle = "#2196F3";

        }

        ctx.fillRect(
            x - 20,
            y - 20,
            40,
            40
        );

        // player name

        ctx.fillStyle = "white";

        ctx.font = "12px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            id === myId ? "YOU" : "PLAYER",
            x,
            y - 28
        );

        // health bar

        ctx.fillStyle = "#222";

        ctx.fillRect(
            x - 25,
            y + 28,
            50,
            5
        );

        ctx.fillStyle = "#4CAF50";

        ctx.fillRect(
            x - 25,
            y + 28,
            50 * (player.health / 100),
            5
        );
    }
}


function gameLoop() {

    drawMap();

    drawPlayers();

    requestAnimationFrame(gameLoop);
}

gameLoop();

connect();
