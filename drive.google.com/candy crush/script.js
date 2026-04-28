document.addEventListener("DOMContentLoaded", () => {
    candyCrushGame();
});

function candyCrushGame() {
    // DOM Elements
    const grid = document.querySelector(".grid");
    const scoreDisplay = document.getElementById("score");
    const timerDisplay = document.getElementById("timer");
    const modeSelection = document.getElementById("modeSelection");
    const endlessButton = document.getElementById("endlessMode");
    const timedButton = document.getElementById("timedMode");
    const changeModeButton = document.getElementById("changeMode");

    // Game State Variables
    const width = 8;
    const squares = [];
    let score = 0;
    let currentMode = null;
    let timeLeft = 0;
    let gameInterval = null;
    let timerInterval = null;

    // Optimized candy colors using simple CSS colors instead of external images
    // This loads much faster than remote images from GitHub
    const candyColors = [
        "#FF4444", // Red
        "#4444FF", // Blue
        "#44FF44", // Green
        "#FFFF44", // Yellow
        "#FF8844", // Orange
        "#FF44FF", // Purple
    ];

    // Preload candy colors for instant rendering
    const candyGradients = candyColors.map(color => ({
        backgroundColor: color,
        backgroundImage: `linear-gradient(135deg, ${color}cc 0%, ${color}ff 100%)`,
        boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`
    }));

    // Create the Game Board
    function createBoard() {
        grid.innerHTML = ""; // Clear existing grid
        squares.length = 0;  // Clear squares array
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement("div");
            square.setAttribute("draggable", true);
            square.setAttribute("id", i);
            let randomColor = Math.floor(Math.random() * candyColors.length);
            
            // Use data attribute to store color and apply CSS for fast rendering
            square.dataset.color = randomColor;
            square.style.backgroundColor = candyColors[randomColor];
            square.style.backgroundImage = candyGradients[randomColor].backgroundImage;
            square.style.boxShadow = candyGradients[randomColor].boxShadow;
            square.style.borderRadius = "8px";
            
            grid.appendChild(square);
            squares.push(square);
        }
        // Add drag event listeners using delegation for better performance
        grid.addEventListener("dragstart", handleDragStart);
        grid.addEventListener("dragend", handleDragEnd);
        grid.addEventListener("dragover", handleDragOver);
        grid.addEventListener("dragenter", handleDragEnter);
        grid.addEventListener("dragleave", handleDragLeave);
        grid.addEventListener("drop", handleDrop);
    }

    // Drag and Drop Functions (optimized with event delegation)
    let colorBeingDragged, colorBeingReplaced, squareIdBeingDragged, squareIdBeingReplaced;

    function handleDragStart(e) {
        if (e.target.id) {
            colorBeingDragged = e.target.dataset.color;
            squareIdBeingDragged = parseInt(e.target.id);
            e.target.style.opacity = "0.7";
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDragEnter(e) {
        e.preventDefault();
    }

    function handleDragLeave() {
        // No action needed
    }

    function handleDrop(e) {
        e.preventDefault();
        if (e.target.id) {
            colorBeingReplaced = e.target.dataset.color;
            squareIdBeingReplaced = parseInt(e.target.id);
            
            // Swap colors
            const temp = squares[squareIdBeingDragged].dataset.color;
            squares[squareIdBeingDragged].dataset.color = squares[squareIdBeingReplaced].dataset.color;
            squares[squareIdBeingReplaced].dataset.color = temp;
            
            // Update styles
            squares[squareIdBeingDragged].style.backgroundColor = candyColors[squares[squareIdBeingDragged].dataset.color];
            squares[squareIdBeingDragged].style.backgroundImage = candyGradients[squares[squareIdBeingDragged].dataset.color].backgroundImage;
            
            squares[squareIdBeingReplaced].style.backgroundColor = candyColors[squares[squareIdBeingReplaced].dataset.color];
            squares[squareIdBeingReplaced].style.backgroundImage = candyGradients[squares[squareIdBeingReplaced].dataset.color].backgroundImage;
        }
    }

    function handleDragEnd(e) {
        if (e.target.id) {
            e.target.style.opacity = "1";
            
            // Define valid moves (adjacent squares: left, up, right, down)
            let validMoves = [
                squareIdBeingDragged - 1,
                squareIdBeingDragged - width,
                squareIdBeingDragged + 1,
                squareIdBeingDragged + width
            ];
            let validMove = validMoves.includes(squareIdBeingReplaced);

            if (!validMove && squareIdBeingReplaced) {
                // Invalid move, revert the swap
                const temp = squares[squareIdBeingDragged].dataset.color;
                squares[squareIdBeingDragged].dataset.color = squares[squareIdBeingReplaced].dataset.color;
                squares[squareIdBeingReplaced].dataset.color = temp;
                
                squares[squareIdBeingDragged].style.backgroundColor = candyColors[squares[squareIdBeingDragged].dataset.color];
                squares[squareIdBeingDragged].style.backgroundImage = candyGradients[squares[squareIdBeingDragged].dataset.color].backgroundImage;
                
                squares[squareIdBeingReplaced].style.backgroundColor = candyColors[squares[squareIdBeingReplaced].dataset.color];
                squares[squareIdBeingReplaced].style.backgroundImage = candyGradients[squares[squareIdBeingReplaced].dataset.color].backgroundImage;
            }
        }
    }

    // Move Candies Down
    function moveIntoSquareBelow() {
        // Fill empty squares in the first row
        for (let i = 0; i < width; i++) {
            if (squares[i].dataset.color === "") {
                let randomColor = Math.floor(Math.random() * candyColors.length);
                squares[i].dataset.color = randomColor;
                squares[i].style.backgroundColor = candyColors[randomColor];
                squares[i].style.backgroundImage = candyGradients[randomColor].backgroundImage;
            }
        }
        // Move candies down to fill gaps
        for (let i = 0; i < width * (width - 1); i++) {
            if (squares[i + width].dataset.color === "") {
                squares[i + width].dataset.color = squares[i].dataset.color;
                squares[i + width].style.backgroundColor = squares[i].style.backgroundColor;
                squares[i + width].style.backgroundImage = squares[i].style.backgroundImage;
                
                squares[i].dataset.color = "";
                squares[i].style.backgroundColor = "";
                squares[i].style.backgroundImage = "";
            }
        }
    }

    // Check for Matches
    function checkRowForFour() {
        for (let i = 0; i < 60; i++) {
            if (i % width >= width - 3) continue; // Skip if not enough columns left
            let rowOfFour = [i, i + 1, i + 2, i + 3];
            let decidedColor = squares[i].dataset.color;
            const isBlank = squares[i].dataset.color === "";
            if (rowOfFour.every(index => squares[index].dataset.color === decidedColor && !isBlank)) {
                score += 4;
                scoreDisplay.innerHTML = score;
                rowOfFour.forEach(index => {
                    squares[index].dataset.color = "";
                    squares[index].style.backgroundColor = "";
                    squares[index].style.backgroundImage = "";
                });
            }
        }
    }

    function checkColumnForFour() {
        for (let i = 0; i < 40; i++) {
            let columnOfFour = [i, i + width, i + 2 * width, i + 3 * width];
            let decidedColor = squares[i].dataset.color;
            const isBlank = squares[i].dataset.color === "";
            if (columnOfFour.every(index => squares[index].dataset.color === decidedColor && !isBlank)) {
                score += 4;
                scoreDisplay.innerHTML = score;
                columnOfFour.forEach(index => {
                    squares[index].dataset.color = "";
                    squares[index].style.backgroundColor = "";
                    squares[index].style.backgroundImage = "";
                });
            }
        }
    }

    function checkRowForThree() {
        for (let i = 0; i < 62; i++) {
            if (i % width >= width - 2) continue; // Skip if not enough columns left
            let rowOfThree = [i, i + 1, i + 2];
            let decidedColor = squares[i].dataset.color;
            const isBlank = squares[i].dataset.color === "";
            if (rowOfThree.every(index => squares[index].dataset.color === decidedColor && !isBlank)) {
                score += 3;
                scoreDisplay.innerHTML = score;
                rowOfThree.forEach(index => {
                    squares[index].dataset.color = "";
                    squares[index].style.backgroundColor = "";
                    squares[index].style.backgroundImage = "";
                });
            }
        }
    }

    function checkColumnForThree() {
        for (let i = 0; i < 48; i++) {
            let columnOfThree = [i, i + width, i + 2 * width];
            let decidedColor = squares[i].dataset.color;
            const isBlank = squares[i].dataset.color === "";
            if (columnOfThree.every(index => squares[index].dataset.color === decidedColor && !isBlank)) {
                score += 3;
                scoreDisplay.innerHTML = score;
                columnOfThree.forEach(index => {
                    squares[index].dataset.color = "";
                    squares[index].style.backgroundColor = "";
                    squares[index].style.backgroundImage = "";
                });
            }
        }
    }

    // Game Loop
    function gameLoop() {
        checkRowForFour();
        checkColumnForFour();
        checkRowForThree();
        checkColumnForThree();
        moveIntoSquareBelow();
    }

    // Start the Game
    function startGame(mode) {
        currentMode = mode;
        modeSelection.style.display = "none";
        grid.style.display = "flex";
        scoreDisplay.parentElement.style.display = "flex"; // Show scoreboard
        createBoard();
        score = 0;
        scoreDisplay.innerHTML = score;
        gameInterval = setInterval(gameLoop, 100);

        if (mode === "timed") {
            timeLeft = 120; // 2 minutes in seconds
            updateTimerDisplay();
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    endGame();
                }
            }, 1000);
        } else {
            timerDisplay.innerHTML = ""; // Clear timer in Endless Mode
        }
    }

    // Update Timer Display
    function updateTimerDisplay() {
        if (currentMode === "timed") {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            timerDisplay.innerHTML = `Time Left: ${minutes}:${seconds.toString().padStart(2, "0")}`;
        } else {
            timerDisplay.innerHTML = "";
        }
    }

    // End Game (Timed Mode)
    function endGame() {
        clearInterval(gameInterval);
        squares.forEach(square => square.setAttribute("draggable", false));
        alert(`Time's Up! Your score is ${score}`);
    }

    // Change Mode
    function changeMode() {
        clearInterval(gameInterval);
        if (currentMode === "timed") {
            clearInterval(timerInterval);
        }
        grid.style.display = "none";
        scoreDisplay.parentElement.style.display = "none";
        modeSelection.style.display = "flex"; // Show mode selection screen
    }

    // Event Listeners
    endlessButton.addEventListener("click", () => startGame("endless"));
    timedButton.addEventListener("click", () => startGame("timed"));
    changeModeButton.addEventListener("click", changeMode);
}