
// load images first
var myImageFactory = new ImageFactory();
myImageFactory.load(ImageFactoryLoaded);

/********************/
/*   Declarations   */
/********************/
var explosion = new Audio('./sound/Bomb1.mp3');
explosion.volume = 0.01;

var canvas_game = document.getElementById("gameCanvas");

var diarrheaIntervalRunning = false;

var fps = 60;

/* Game Area (Canvas) */
var myGameArea = {
    gameStartedUp: false,
    canvas: canvas_game,
    context: canvas_game.getContext("2d"),
    start: function () {
        this.canvas.width = 665;
        this.canvas.height = 455;
        this.interval = setInterval(updateGameArea, 1000/fps);
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

// Times for different viruses
var virusTimer = {
    diarrhea: 15000,
    fastBomb: 20000,
    default: 15000
};

// all directions
var directions = {
    left: 1,
    right: 2,
    up: 3,
    down: 4
};

// all tileBlocks
var tileBlocks = {
    numberOfHiddenBlocks: 4,
    solid: 0,
    background: 1,
    explodeable: 2,
    BombUp: 3,
    FlameUp: 4,
    SpeedUp: 5,
    Virus: 6,
    hiddenBombUp: 7,
    hiddenFlameUp: 8,
    hiddenSpeedUp: 9,
    hiddenVirus: 10
};

// available difficulty types
var difficultyTypes = {
    normal: 1,
    hardmode: 2
};

// available game modes
var modeTypes = {
    deathmatch: 1,
    closingin: 2,
    fogofwar: 3,
    virusonly: 4,
    destroytheblock: 5
};

var globalPlayerSizeMultiplier = 0.5;
var globalTileSize = 35;
var gameStarted = false;
var gameLoaded = false;
var gameFinished = false;
var currentGamemode;
var currentDifficulty;
var closingInterval;
var bombsToDelete = [];

/********************
*     Functions     *
*********************/

function startGame(position, difficulty, mode) {
    myBombHandler = new bombHandler();

    myBackground = new background(myGameArea.context, globalTileSize);
    myPlayer = new player(myGameArea.context, position, globalPlayerSizeMultiplier, 2);
    currentDifficulty = difficulty;

    if (currentDifficulty == difficultyTypes.hardmode) {
        myPlayer.stats.bombs += 4;
        myPlayer.stats.bombTimer /= 2;
        myPlayer.stats.bombRadius *= 2;
        myPlayer.walkStep = 1.3;
    }

    currentGamemode = mode;
    players = new otherPlayers();

    myGameArea.start();

    gameLoaded = true;
    myGameArea.gameStartedUp = true;
}

function updateGameArea() {
    updateStatus(); //gamepad
    if (movLeft || movRight || movUp || movDown) {
        myPlayer.tryMove();
    } else {
        myPlayer.imageCounter = 0;
    }

    // redraw background
    myBackground.update();

    // redraw bombs
    myBombHandler.bombs.forEach(element => {
        element.drawBomb();
        if (element.status == 1) bombsToDelete.push(element);
    });

    if (bombsToDelete.length != 0) {
        bombsToDelete.forEach(element => {
            myBombHandler.removeBomb(element);
        });
    }

    // redraw other players
    players.players.forEach(element => {
        element.update();
    });

    // redraw myplayer
    myPlayer.update();
}

/********************/
/*     Objects      */
/********************/

/* Player Object
 * Contains vars and funcitons to move and draw the player + check functions
 * */
function player(context, position, playerSizeMultiplier, walkSpeed) {
    this.playerId = socket.id;
    this.imageCounter = 0;
    this.currentDirection = directions.down;
    this.oldDirection = this.currentDirection;
    this.ctx = context;
    this.playerSizeMultiplier = playerSizeMultiplier;
    this.walkSpeed = walkSpeed;
    this.walkStep = 1;
    this.diagonalMoveDivisior = 1.4;
    this.layerDirty = true;
    this.layerDirty2 = false;
    this.collsionCorrection = 5 * playerSizeMultiplier;
    this.delay = 0;
    this.isAlive = true;
    this.quarter = 1; //in which quarter of a block the player stands

    this.stats = {
        kills: 0,
        bombs: 1,
        bombRadius: 2,
        bombTimer: 4000,
        speedPowerup: 0,
        godFlames: false,
        directionSwitch: false,
        points: 0
    };

    this.dimensions = {
        width: 64 * playerSizeMultiplier,
        height: 100 * playerSizeMultiplier
    };

    this.speed = {
        speedX: 0,
        speedY: 0
    };

    this.pos = {
        x: (position.x * globalTileSize),
        y: (position.y * globalTileSize) - globalTileSize / 2
    };

    this.startPos = {
        x: this.pos.x,
        y: this.pos.y
    };

    this.BlockCoord = [
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1]
    ];

    this.checkBlockCoords = function (blockcoordY, blockcoordX) {
        if (myBackground.map[blockcoordY][blockcoordX] == tileBlocks.background) {
            return true;
        }

        if ((myBackground.map[blockcoordY][blockcoordX] >= tileBlocks.BombUp) && (myBackground.map[blockcoordY][blockcoordX] <= tileBlocks.Virus)) {
            return true;
        }
        return false;
    };

    this.moveLeft = function () {
        if (this.possibleMove(this.pos.x + this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height / 2 + this.speed.speedY, -this.walkStep, 0) &&
            this.possibleMove(this.pos.x + this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height - this.collsionCorrection + this.speed.speedY, -this.walkStep, 0)) {
            this.speed.speedX -= this.walkStep;
        }
        else if (!movUp && !movDown && (this.quarter == 3 || this.quarter == 4) && this.BlockCoord[0][0] != 0) {
            if (this.checkBlockCoords(this.BlockCoord[2][1], this.BlockCoord[2][0]))
                this.moveDown();
        }
        else if (!movUp && !movDown && (this.quarter == 2 || this.quarter == 1) && this.BlockCoord[0][0] != 0) {
            if (this.checkBlockCoords(this.BlockCoord[4][1], this.BlockCoord[4][0]))
                this.moveUp();
        }
        double = false;
        this.currentDirection = directions.left;
    };

    this.moveRight = function () {
        if (this.possibleMove(this.pos.x + this.dimensions.width - this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height / 2 + this.speed.speedY, this.walkStep, 0) &&
            this.possibleMove(this.pos.x + this.dimensions.width - this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height - this.collsionCorrection + this.speed.speedY, this.walkStep, 0)) {
            this.speed.speedX += this.walkStep;
        }
        else if (!movUp && !movDown && (this.quarter == 4 || this.quarter == 3) && this.BlockCoord[1][0] != 18) {
            if (this.checkBlockCoords(this.BlockCoord[3][1], this.BlockCoord[3][0]))
                this.moveDown();
        }
        else if (!movUp && !movDown && (this.quarter == 1 || this.quarter == 2) && this.BlockCoord[1][0] != 18) {
            if (this.checkBlockCoords(this.BlockCoord[5][1], this.BlockCoord[5][0]))
                this.moveUp();
        }
        double = false;
        this.currentDirection = directions.right;
    };

    this.moveUp = function () {
        if (this.possibleMove(this.pos.x + this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height / 2 + this.speed.speedY, 0, -this.walkStep) &&
            this.possibleMove(this.pos.x + this.dimensions.width - this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height / 2 + this.speed.speedY, 0, -this.walkStep)) {
            this.speed.speedY -= this.walkStep;
        }
        else if (!movLeft && !movRight && (this.quarter == 1 || this.quarter == 4) && this.BlockCoord[0][1] != 0) {
            if (this.checkBlockCoords(this.BlockCoord[1][1], this.BlockCoord[1][0]))
                this.moveRight();
        }
        else if (!movLeft && !movRight && (this.quarter == 2 || this.quarter == 3) && this.BlockCoord[0][1] != 0) {
            if (this.checkBlockCoords(this.BlockCoord[0][1], this.BlockCoord[0][0]))
                this.moveLeft();
        }
        double = false;
        this.currentDirection = directions.up;
    };

    this.moveDown = function () {
        if (this.possibleMove(this.pos.x + this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height - this.collsionCorrection + this.speed.speedY, 0, this.walkStep) &&
            this.possibleMove(this.pos.x + this.dimensions.width - this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height - this.collsionCorrection + this.speed.speedY, 0, this.walkStep)) {
            this.speed.speedY += this.walkStep;
        }
        else if (!movLeft && !movRight && (this.quarter == 4 || this.quarter == 1) && this.BlockCoord[2][1] != 12) {
            if (this.checkBlockCoords(this.BlockCoord[3][1], this.BlockCoord[3][0]))
                this.moveRight();
        }
        else if (!movLeft && !movRight && (this.quarter == 3 || this.quarter == 2) && this.BlockCoord[2][1] != 12) {
            if (this.checkBlockCoords(this.BlockCoord[2][1], this.BlockCoord[2][0]))
                this.moveLeft();
        }
        double = false;
        this.currentDirection = directions.down;
    };

    /*moves player when possible
     * updates the direction + image counter
     * also checks if players moves diagonally */
    this.tryMove = function () {
        if (!gameStarted) return;
        if (!this.isAlive) return;
        var moved = false;
        var movedDiagonally = false;

        //controlling for corner assist
        var double = false;

        for (var i = 0; i < this.walkSpeed; ++i) {
            if (movLeft) {
                if (this.stats.directionSwitch) {
                    this.moveRight();
                }
                else {
                    this.moveLeft();
                }
                moved = true;
            }
            if (movRight && !movLeft) {
                if (this.stats.directionSwitch) {
                    this.moveLeft();
                }
                else {
                    this.moveRight();
                }
                moved = true;
            }
            if (movUp) {
                if (this.stats.directionSwitch) {
                    this.moveDown();
                }
                else {
                    this.moveUp();
                }

                // check diagonal move
                if (moved) {
                    movedDiagonally = true;
                }
                else {
                    moved = true;
                }
            }
            if (movDown && !movUp) {
                if (this.stats.directionSwitch) {
                    this.moveUp();
                }
                else {
                    this.moveDown();
                }

                // check diagonal move
                if (moved) {
                    movedDiagonally = true;
                }
                else {
                    moved = true;
                }
            }
        }

        // move speed is to high if moved diagonally, so we lower it
        if (movedDiagonally) {
            this.speed.speedX = this.speed.speedX / this.diagonalMoveDivisior;
            this.speed.speedY = this.speed.speedY / this.diagonalMoveDivisior;
        }

        this.newPos();
        this.resetSpeed();
        this.convertPlayerPos();
        this.getPowerUp();
        this.layerDirty = true;

        // update image counter and return true if moved
        if (moved) {
            this.updateImageCounter();
            playerMoved(this.pos, this.imageCounter, this.currentDirection);
            return true;
        } else {
            return false;
        }
    };

    //checks if player can move to a point
    this.possibleMove = function (x, y, dx, dy) {
        var tempY = Math.trunc((y + dy) / myBackground.tileSize);
        var tempX = Math.trunc((x + dx) / myBackground.tileSize);

        if (myBackground.map[tempY][tempX] == tileBlocks.background || myBackground.map[tempY][tempX] == tileBlocks.BombUp || myBackground.map[tempY][tempX] == tileBlocks.FlameUp || myBackground.map[tempY][tempX] == tileBlocks.SpeedUp || myBackground.map[tempY][tempX] == tileBlocks.Virus) {
            return true;
        }
        else {
            this.getQuarter(x, y);
            return false;
        }
    };

    this.getQuarter = function (x, y) {
        var fallbackY = (this.pos.y + (this.dimensions.height / 4) * 3) / myBackground.tileSize;
        var fallbackX = (this.pos.x + this.dimensions.width / 2) / myBackground.tileSize;

        if (double) {
            if ((fallbackX - Math.trunc(fallbackX)) < 0.5) {
                if ((fallbackY - Math.trunc(fallbackY)) < 0.5) {
                    this.quarter = 2;
                }
                else {
                    this.quarter = 3;
                }
            }
            else {
                if ((fallbackY - Math.trunc(fallbackY)) < 0.5) {
                    this.quarter = 1;
                }
                else {
                    this.quarter = 4;
                }
            }
        }
        else {
            if ((x - (this.pos.x + this.dimensions.width / 2)) < 0) {
                if (y - (this.pos.y + (this.dimensions.height / 4) * 3) < 0) {
                    if (movUp) {
                        this.quarter = 1;
                    }
                    else if (movLeft) {
                        this.quarter = 3;
                    }
                }
                else {
                    if (movDown) {
                        this.quarter = 4;
                    }
                    else if (movLeft) {
                        this.quarter = 2;
                    }
                }
            }
            else {
                if (y - (this.pos.y + (this.dimensions.height / 4) * 3) < 0) {
                    if (movUp) {
                        this.quarter = 2;
                    }
                    else if (movRight) {
                        this.quarter = 4;
                    }
                }
                else {
                    if (movDown) {
                        this.quarter = 3;
                    }
                    else if (movRight) {
                        this.quarter = 1;
                    }
                }
            }
            double = true;
        }
    }

    // draws player according to the current looking direction
    this.update = function () {
        if (!this.isAlive) return;

        //draw Player
        switch (this.currentDirection) {
            case directions.left:
                myGameArea.context.drawImage(myImageFactory.left[this.imageCounter], this.pos.x, this.pos.y, this.dimensions.width, this.dimensions.height);
                break;
            case directions.right:
                myGameArea.context.drawImage(myImageFactory.right[this.imageCounter], this.pos.x, this.pos.y, this.dimensions.width, this.dimensions.height);
                break;
            case directions.up:
                myGameArea.context.drawImage(myImageFactory.back[this.imageCounter], this.pos.x, this.pos.y, this.dimensions.width, this.dimensions.height);
                break;
            case directions.down:
                myGameArea.context.drawImage(myImageFactory.front[this.imageCounter], this.pos.x, this.pos.y, this.dimensions.width, this.dimensions.height);
                break;
        }
        myPlayer.layerDirty = false;
    };

    /* updates image counter
     * determines which frame of the player should be drawn*/
    this.updateImageCounter = function () {
        if (this.currentDirection != this.oldDirection) {
            imageCounter = 0;
            this.oldDirection = this.currentDirection;
        }

        if (this.imageCounter < 7) {
            if (this.delay == 2) {
                this.imageCounter = this.imageCounter + 1;
                this.delay = 0;
            }
            else {
                this.delay++;
            }
        } else {
            this.imageCounter = 0;
        }
    };

    // set new position of the player
    this.newPos = function () {
        this.pos.x += this.speed.speedX;
        this.pos.y += this.speed.speedY;
    };

    // resets the speed; else player won't stop moving ~
    this.resetSpeed = function () {
        this.speed.speedX = 0;
        this.speed.speedY = 0;
    };

    //gives upper left and lower right corner in background coords
    this.convertPlayerPos = function () {
        this.BlockCoord[0][0] = Math.trunc((this.pos.x) / myBackground.tileSize); //upper left
        this.BlockCoord[0][1] = Math.trunc((this.pos.y) / myBackground.tileSize);

        this.BlockCoord[1][0] = Math.trunc((this.pos.x + this.dimensions.width) / myBackground.tileSize); //upper right
        this.BlockCoord[1][1] = Math.trunc((this.pos.y) / myBackground.tileSize);

        this.BlockCoord[2][0] = Math.trunc((this.pos.x) / myBackground.tileSize); //lower left
        this.BlockCoord[2][1] = Math.trunc((this.pos.y + this.dimensions.height) / myBackground.tileSize);

        this.BlockCoord[3][0] = Math.trunc((this.pos.x + this.dimensions.width) / myBackground.tileSize); //lower right
        this.BlockCoord[3][1] = Math.trunc((this.pos.y + this.dimensions.height) / myBackground.tileSize);

        this.BlockCoord[4][0] = Math.trunc((this.pos.x) / myBackground.tileSize); //middle left
        this.BlockCoord[4][1] = Math.trunc((this.pos.y + this.dimensions.height / 2) / myBackground.tileSize);

        this.BlockCoord[5][0] = Math.trunc((this.pos.x + this.dimensions.width) / myBackground.tileSize); //middle right
        this.BlockCoord[5][1] = Math.trunc((this.pos.y + this.dimensions.height / 2) / myBackground.tileSize);
    };

    // lay bomb on current position
    this.layBomb = async function () {
        if (!gameStarted) return;

        if (myBombHandler.myBombsCounter < this.stats.bombs) {
            var pos = {
                y: Math.trunc((this.pos.y + (this.dimensions.height / 4) * 3) / myBackground.tileSize),
                x: Math.trunc((this.pos.x + this.dimensions.width / 2) / myBackground.tileSize)
            };
            myBombHandler.addBomb(pos, this.stats.bombRadius, this.stats.bombTimer);
        };
    };

    // add powerup to player
    this.getPowerUp = function () {
        var pickUp = [
            [1, 1],
            [1, 1],
            [1, 1],
            [1, 1]
        ];

        //calc pickUp
        pickUp[0][0] = Math.trunc((this.pos.x + this.collsionCorrection) / myBackground.tileSize);
        pickUp[0][1] = Math.trunc((this.pos.y + this.dimensions.height / 2) / myBackground.tileSize);

        pickUp[1][0] = Math.trunc((this.pos.x + this.collsionCorrection) / myBackground.tileSize);
        pickUp[1][1] = Math.trunc((this.pos.y + this.dimensions.height - this.collsionCorrection) / myBackground.tileSize);

        pickUp[2][0] = Math.trunc((this.pos.x + this.dimensions.width - this.collsionCorrection) / myBackground.tileSize);
        pickUp[2][1] = Math.trunc((this.pos.y + this.dimensions.height / 2) / myBackground.tileSize);

        pickUp[3][0] = Math.trunc((this.pos.x + this.dimensions.width - this.collsionCorrection) / myBackground.tileSize);
        pickUp[3][1] = Math.trunc((this.pos.y + this.dimensions.height - this.collsionCorrection) / myBackground.tileSize);

        for (var i = 0; i < 4; ++i) {
            if (myBackground.map[pickUp[i][1]][pickUp[i][0]] == tileBlocks.BombUp) {
                myBackground.map[pickUp[i][1]][pickUp[i][0]] = tileBlocks.background;
                this.stats.bombs++;
                change_infobar("+Bomb");
            }
            else if (myBackground.map[pickUp[i][1]][pickUp[i][0]] == tileBlocks.FlameUp) {
                myBackground.map[pickUp[i][1]][pickUp[i][0]] = tileBlocks.background;
                this.stats.bombRadius++;
                change_infobar("+Flame");
            }
            else if (myBackground.map[pickUp[i][1]][pickUp[i][0]] == tileBlocks.SpeedUp) {
                myBackground.map[pickUp[i][1]][pickUp[i][0]] = tileBlocks.background;
                this.stats.speedPowerup++;
                this.walkStep += 0.1;
                change_infobar("+Speed");
            }
            else if (myBackground.map[pickUp[i][1]][pickUp[i][0]] == tileBlocks.Virus) {
                myBackground.map[pickUp[i][1]][pickUp[i][0]] = tileBlocks.background;
                this.playerGotVirus();
            }
        }
    };

    // check if the player should die
    this.killPlayer = function (x, y, bombPlayerId) {
        if (!this.isAlive || !gameStarted) return;
        if (currentGamemode == modeTypes.destroytheblock) return;

        for (var i = 2; i < 6; ++i) {
            if (this.BlockCoord[i][0] == x && this.BlockCoord[i][1] == y) { //player dead
                if (this.inFlames(this.pos.x + this.collsionCorrection, this.pos.y + this.dimensions.height - this.collsionCorrection, x, y) ||
                    this.inFlames(this.pos.x + this.dimensions.width - this.collsionCorrection, this.pos.y + this.dimensions.height - this.collsionCorrection, x, y) ||
                    this.inFlames(this.pos.x + this.collsionCorrection, this.pos.y + this.dimensions.height / 2, x, y) ||
                    this.inFlames(this.pos.x + this.dimensions.width - this.collsionCorrection, this.pos.y + this.dimensions.height / 2, x, y)) {
                    playerDead(this.playerId, bombPlayerId);
                    this.isAlive = false;

                    if (players.playerCount == 0) {
                        this.isAlive = true;

                        myBombHandler.clearBombs();
                        clearInterval(closingInterval);
                        playerNotDead(socket.id);
                        gameIsFinished();
                        this.resetPosition();
                        this.resetStats();
                        return;
                    }
                }
            }
            if (!this.isAlive) return;
        }
    };

    // check if the player is standing in bomb flames
    this.inFlames = function (plx, ply, x, y) {
        var px = Math.trunc(plx / myBackground.tileSize);
        var py = Math.trunc(ply / myBackground.tileSize);
        if (py == y && px == x) {
            return true;
        }
        return false;
    };

    // reset stats to start stats
    this.resetStats = function () {
        this.stats.kills = 0;
        this.stats.bombs = (currentDifficulty == difficultyTypes.hardmode) ? 4 : 1;
        this.stats.bombRadius = (currentDifficulty == difficultyTypes.hardmode) ? 4 : 2;
        this.stats.bombTimer = (currentDifficulty == difficultyTypes.hardmode) ? 2000 : 4000;
        this.walkStep = (currentDifficulty == difficultyTypes.hardmode) ? 1.3 : 1;
        this.stats.speedPowerup = 0;
        this.stats.godFlames = false;
        this.stats.directionSwitch = false;
        this.stats.points = 0;
        socket.emit("player-reset", gameId, this.playerId);
    };

    // reset position to start position
    this.resetPosition = function () {
        this.pos.x = this.startPos.x;
        this.pos.y = this.startPos.y;
        this.currentDirection = directions.down;
        this.convertPlayerPos();
        this.layerDirty = true;
    };

    // calculate the canches which virus type the player gets
    this.playerGotVirus = function () {
        var probability = 0.10;
        var canche = Math.random();

        if ((canche > probability * 9.7) && (this.stats.godFlames != true)) { // god's flames
            change_infobar("+God's flames, you are the choosen one!");
            this.stats.godFlames = true;
            this.stats.bombRadius = 100;
        }
        else if (canche > probability * 9) {        // speed powerup
            this.stats.speedPowerup++;
            this.walkStep += 0.1;
            change_infobar("+Speed");
        }
        else if (canche > probability * 8) {        // bomb powerup
            this.stats.bombs++;
            change_infobar("+Bomb");
        }
        else if (canche > probability * 7) {        // flame powerup
            this.stats.bombRadius++;
            change_infobar("+Flame");
        }
        else if (canche > probability * 6) {        // diarrhea
            change_infobar("+Diarrhea");

            // increase bombs for more fun
            this.stats.bombs += 2;
            var _this = this;

            diarrheaIntervalRunning = true;

            // set interval
            var diarrheaInterval = setInterval(function () {
                _this.layBomb();
            }, 150);

            // clear interval
            setTimeout(function () {
                clearInterval(diarrheaInterval);
                _this.stats.bombs -= 2;
                diarrheaIntervalRunning = false;
            }, virusTimer.diarrhea);
        }
        else if (canche > probability * 5) {        // fast exploding bombs
            change_infobar("+Fast Bomb");
            this.stats.bombTimer /= 2;
            var _this = this;

            setTimeout(function () {
                _this.stats.bombTimer *= 2;
            }, virusTimer.fastBomb);
        }
        else if (canche > probability * 4) {        // slowness
            change_infobar("+Turtle Slowness");
            this.walkSpeed /= 2;
            var _this = this;

            setTimeout(function () {
                _this.walkSpeed *= 2;
            }, virusTimer.default);
        }
        else if (canche > probability * 3) {        // direction switch
            change_infobar("+Switcheroo");
            this.stats.directionSwitch = true;
            var _this = this;

            setTimeout(function () {
                _this.stats.directionSwitch = false;
            }, virusTimer.default);
        }
        else if (canche > probability * 2) {
            this.stats.bombRadius++;
            change_infobar("+Flame");
        }
        else if (canche > probability) {            // faster better stronger
            change_infobar("+Fast as hell");
            var oldSpeed = this.walkSpeed;
            this.walkSpeed *= 3;
            var _this = this;

            setTimeout(function () {
                _this.walkSpeed = oldSpeed;
            }, virusTimer.default);
        }
        else if (canche > probability / 2) {        // nothing happens
            change_infobar("Only a lucky few ones escape the curse..");
        }
        else {
            this.stats.bombs++;
            change_infobar("+Bomb");
        }
    };

    // calculate player pos, and set old one to prevent overdrawing other players
    this.convertPlayerPos();
}

/* Multiplayer player object
 * */
function playerObject(position, id) {
    this.id = id;
    this.layerDirty = true;
    this.imageCounter = 0;
    this.currentDirection = directions.down;
    this.isAlive = true;

    this.BlockCoord = [
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1]
    ];

    this.blockCoords = {
        x: position.x,
        y: position.y
    };

    this.pos = {
        x: (position.x * globalTileSize),
        y: (position.y * globalTileSize) - globalTileSize / 2
    };

    this.startPos = {
        x: this.pos.x,
        y: this.pos.y
    };

    this.dimensions = {
        width: 64 * globalPlayerSizeMultiplier,
        height: 100 * globalPlayerSizeMultiplier
    };

    this.stats = {
        kills: 0,
        points: 0
    };

    this.update = function () {
        if (!this.isAlive) return;

        switch (this.currentDirection) {
            case directions.left:
                myGameArea.context.drawImage(myImageFactory.left[this.imageCounter], this.pos.x, this.pos.y, this.dimensions.width, this.dimensions.height);
                break;
            case directions.right:
                myGameArea.context.drawImage(myImageFactory.right[this.imageCounter], this.pos.x, this.pos.y, this.dimensions.width, this.dimensions.height);
                break;
            case directions.up:
                myGameArea.context.drawImage(myImageFactory.back[this.imageCounter], this.pos.x, this.pos.y, this.dimensions.width, this.dimensions.height);
                break;
            case directions.down:
                myGameArea.context.drawImage(myImageFactory.front[this.imageCounter], this.pos.x, this.pos.y, this.dimensions.width, this.dimensions.height);
                break;
        }

        this.removePowerUp();
    };

    //gives upper left and lower right corner in background coords
    this.convertPlayerPos = function () {
        this.BlockCoord[0][0] = Math.trunc((this.pos.x) / myBackground.tileSize); //upper left
        this.BlockCoord[0][1] = Math.trunc((this.pos.y) / myBackground.tileSize);

        // head
        this.BlockCoord[1][0] = Math.trunc((this.pos.x + this.dimensions.width) / myBackground.tileSize); //upper right
        this.BlockCoord[1][1] = Math.trunc((this.pos.y) / myBackground.tileSize);

        this.BlockCoord[2][0] = Math.trunc((this.pos.x) / myBackground.tileSize); //lower left
        this.BlockCoord[2][1] = Math.trunc((this.pos.y + this.dimensions.height) / myBackground.tileSize);

        // body
        this.BlockCoord[3][0] = Math.trunc((this.pos.x + this.dimensions.width) / myBackground.tileSize); //lower right
        this.BlockCoord[3][1] = Math.trunc((this.pos.y + this.dimensions.height) / myBackground.tileSize);

        this.BlockCoord[4][0] = Math.trunc((this.pos.x) / myBackground.tileSize); //middle left
        this.BlockCoord[4][1] = Math.trunc((this.pos.y + this.dimensions.height / 2) / myBackground.tileSize);

        this.BlockCoord[5][0] = Math.trunc((this.pos.x + this.dimensions.width) / myBackground.tileSize); //middle right
        this.BlockCoord[5][1] = Math.trunc((this.pos.y + this.dimensions.height / 2) / myBackground.tileSize);
    };

    this.removePowerUp = function () {
        var pickUp = [
            [1, 1],
            [1, 1],
            [1, 1],
            [1, 1]
        ];

        //calc pickUp
        pickUp[0][0] = Math.trunc((this.pos.x + myPlayer.collsionCorrection) / myBackground.tileSize);
        pickUp[0][1] = Math.trunc((this.pos.y + this.dimensions.height / 2) / myBackground.tileSize);

        pickUp[1][0] = Math.trunc((this.pos.x + myPlayer.collsionCorrection) / myBackground.tileSize);
        pickUp[1][1] = Math.trunc((this.pos.y + this.dimensions.height - myPlayer.collsionCorrection) / myBackground.tileSize);

        pickUp[2][0] = Math.trunc((this.pos.x + this.dimensions.width - myPlayer.collsionCorrection) / myBackground.tileSize);
        pickUp[2][1] = Math.trunc((this.pos.y + this.dimensions.height / 2) / myBackground.tileSize);

        pickUp[3][0] = Math.trunc((this.pos.x + this.dimensions.width - myPlayer.collsionCorrection) / myBackground.tileSize);
        pickUp[3][1] = Math.trunc((this.pos.y + this.dimensions.height - myPlayer.collsionCorrection) / myBackground.tileSize);

        for (var i = 0; i < 4; ++i) {
            if (myBackground.map[pickUp[i][1]][pickUp[i][0]] == tileBlocks.BombUp) {
                myBackground.map[pickUp[i][1]][pickUp[i][0]] = tileBlocks.background;
            }
            else if (myBackground.map[pickUp[i][1]][pickUp[i][0]] == tileBlocks.FlameUp) {
                myBackground.map[pickUp[i][1]][pickUp[i][0]] = tileBlocks.background;
            }
            else if (myBackground.map[pickUp[i][1]][pickUp[i][0]] == tileBlocks.SpeedUp) {
                myBackground.map[pickUp[i][1]][pickUp[i][0]] = tileBlocks.background;
            }
            else if (myBackground.map[pickUp[i][1]][pickUp[i][0]] == tileBlocks.Virus) {
                myBackground.map[pickUp[i][1]][pickUp[i][0]] = tileBlocks.background;
            }
        }
    };

    this.resetPosition = function () {
        this.pos.x = this.startPos.x;
        this.pos.y = this.startPos.y;
        this.currentDirection = directions.down;
        this.convertPlayerPos();
        this.layerDirty = true;
    };

    this.resetStats = function () {
        this.stats.kills = 0;
        this.stats.points = 0;
    };

    this.convertPlayerPos();
}

function otherPlayers() {
    this.players = [];
    this.playerCount = 0;
}

/* Background Object
 * contains vars and functions to draw the background*/
function background(context, tileSize) {
    this.tileSize = tileSize;
    this.height = 0;
    this.width = 0;
    this.ctx = context;
    this.layerDirty = true;
    this.closingDirection = 1;
    this.possibleBlocks = 19 * 13;
    this.countClosingIn = 0;

    this.dimensions = {
        width: 19,
        height: 13
    };

    this.closingDimensions = {
        width: this.dimensions.width,
        height: this.dimensions.height
    };

    this.closingPosition = {
        x: 0,
        y: 0
    };

    this.closingPositionTemp = {
        x: 0,
        y: 0
    }

    this.map = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    this.startMap = arrayClone(this.map);

    // update function draws the background
    this.update = function () {
        this.drawBackground();
    };

    // draw_background draws background according to the matrix (this.map)
    this.drawBackground = function () {
        for (var y = 0; y < this.dimensions.height; ++y) {
            for (var x = 0; x < this.dimensions.width; ++x) {
                this.drawBlock(x, y);
            }
        }
    };

    // draws a block to the context
    this.drawBlock = function (x, y) {
        switch (this.map[y][x]) {
            case tileBlocks.explodeable:
            case tileBlocks.hiddenFlameUp:
            case tileBlocks.hiddenBombUp:
            case tileBlocks.hiddenSpeedUp:
            case tileBlocks.hiddenVirus:
                this.draw_image(this.ctx, myImageFactory.tiles[tileBlocks.explodeable], x, y);
                break;
            case tileBlocks.solid:
                this.draw_image(this.ctx, myImageFactory.tiles[tileBlocks.solid], x, y);
                break;
            case tileBlocks.background:
                this.draw_image(this.ctx, myImageFactory.tiles[tileBlocks.background], x, y);
                break;
            case tileBlocks.BombUp:
                this.draw_image(this.ctx, myImageFactory.tiles[tileBlocks.BombUp], x, y);
                break;
            case tileBlocks.FlameUp:
                this.draw_image(this.ctx, myImageFactory.tiles[tileBlocks.FlameUp], x, y);
                break;
            case tileBlocks.SpeedUp:
                this.draw_image(this.ctx, myImageFactory.tiles[tileBlocks.SpeedUp], x, y);
                break;
            case tileBlocks.Virus:
                this.draw_image(this.ctx, myImageFactory.tiles[tileBlocks.Virus], x, y);
                break;
        }
    };

    this.draw_image = function (ctx, img, x, y) {
        ctx.drawImage(img, this.tileSize * x, this.tileSize * y, this.tileSize, this.tileSize);
    };

    this.nextSolidBlock = function () {
        switch (this.closingDirection) {
            case 1:
                if (this.closingPosition.x >= this.closingDimensions.width - 3) {
                    this.closingDirection = 2;
                }
                this.closingPosition.x++;
                break;
            case 2:
                if (this.closingPosition.y >= this.closingDimensions.height - 3) {
                    this.closingDirection = 3;
                }
                this.closingPosition.y++;
                break;
            case 3:
                if (this.closingPosition.x < this.closingPositionTemp.x + 3) {
                    this.closingDirection = 4;
                }
                this.closingPosition.x--;
                break;
            case 4:
                if (this.closingPosition.y < this.closingPositionTemp.x + 3) {
                    this.closingDirection = 5;
                }
                this.closingPosition.y--;
                break;
            case 5:
                this.closingPositionTemp.x++;
                this.closingPositionTemp.y++;
                this.closingDimensions.width--;
                this.closingDimensions.height--;
                this.closingDirection = 1;
                this.closingPosition.x = this.closingPositionTemp.x;
                this.closingPosition.y = this.closingPositionTemp.y;
                break;
        }
        if (this.countClosingIn < this.possibleBlocks / 2) {
            this.countClosingIn++;
            this.map[this.closingPosition.y][this.closingPosition.x] = tileBlocks.solid;
            this.draw_image(this.ctx, myImageFactory.tiles[tileBlocks.solid], this.closingPosition.x, this.closingPosition.y);

            var playerCoords = {
                bodyX: myPlayer.BlockCoord[4][0],
                bodyY: myPlayer.BlockCoord[4][1]
            };

            if (this.closingPosition.y == playerCoords.bodyY && this.closingPosition.x == playerCoords.bodyX) {
                clearInterval(closingInterval);
                playerDead(this.playerId, 0);
                myPlayer.isAlive = false;

                if (players.playerCount == 0) {
                    myPlayer.isAlive = true;

                    playerNotDead(socket.id);
                    gameIsFinished();
                    myBombHandler.clearBombs();
                    myPlayer.resetPosition();
                    myPlayer.resetStats();
                    return;
                }
            }
        }
        else {
            clearInterval(closingInterval);
        }
    };

    this.setClosingStartPosition = function (x, y) {
        this.closingPosition.x = x;
        this.closingPosition.y = y;
        this.closingPositionTemp.x = x;
        this.closingPositionTemp.y = y;
    };

    this.resetMap = function () {
        // clone array; not a reference copy
        this.map = arrayClone(this.startMap);
        this.layerDirty = true;
    };
}

/*  handles all player bombs
 */
function bombHandler() {
    this.bombCounter = 0;
    this.myBombsCounter = 0;
    this.bombs = [];

    this.addBomb = function (position, radius, bombTimer) {
        var playerBomb = new bomb(myPlayer.ctx, bombTimer, 1000, radius, 2, position);
        this.bombs.push(playerBomb);
        this.myBombsCounter += 1;
        this.bombCounter += 1;
        var index = this.bombCounter;

        // notify other players
        playerBombSet(playerBomb);
    };

    this.addBombEnemy = function (enemyBomb) {
        var playerBomb = new bomb(myPlayer.ctx, enemyBomb.bombTimer, enemyBomb.explodeTimer, enemyBomb.explosionRadius, 2, enemyBomb.pos);
        playerBomb.bombPlayerId = enemyBomb.bombPlayerId;
        this.bombs.push(playerBomb);
        this.bombCounter += 1;
        var index = this.bombCounter;
        var _this = this;
    };

    this.clearBombs = function () {
        this.bombs = [];
        this.bombCounter = 0;
        this.myBombsCounter = 0;
    };

    this.removeBomb = function (bomb) {
        var index = this.bombs.indexOf(bomb);
        if (index > -1) {
            if (bomb.bombPlayerId == socket.id) {
                this.myBombsCounter--;
            }
            this.bombCounter--;
            this.bombs.splice(index, 1);
        }
    };
};

/*everything with bombs*/
function bomb(context, bombTimer, explodeTimer, explosionRadius, status, position) {
    this.bombPlayerId = socket.id;
    this.flameCounter = 0;
    this.bombTimer = bombTimer;
    this.explodeTimer = explodeTimer;
    this.explosionRadius = explosionRadius;
    this.status = status; //status: 0 dormant, 1 owned, 2 layed, 3 exploding
    this.ctx = context;
    this.layerDirty = true;
    this.delay = 0;

    this.pos = {
        x: position.x,
        y: position.y
    };

    this.size = {
        x_pos: -1,
        x_neg: -1,
        y_pos: -1,
        y_neg: -1
    }

    this.bombExplode = async function () {
        this.status = 3;
        this.makeExplosion();
        explosion.play();
        await sleep(this.explodeTimer);
        this.bombOver();
    };

    this.bombOver = function () {
        this.status = 1;
    };

    this.makeExplosion = function () {
        this.size.x_pos = 0;
        this.size.x_neg = 0;
        this.size.y_pos = 0;
        this.size.y_neg = 0;
        var enable_x_pos = true;
        var enable_y_pos = true;
        var enable_x_neg = true;
        var enable_y_neg = true;
        var changed = false;

        for (var i = 1; i <= this.explosionRadius; i++) {
            if (enable_x_pos) {
                myPlayer.killPlayer(this.pos.x + i, this.pos.y, this.bombPlayerId);
                this.size.x_pos++;

                if ((currentGamemode == modeTypes.destroytheblock) && (this.checkBlock(myBackground.map[this.pos.y][this.pos.x + i]))) {
                    if (this.bombPlayerId == socket.id) {
                        myPlayer.stats.points++;
                        changed = true;
                    }
                    else {
                        setOtherPlayerPoints(this.bombPlayerId);
                    }
                }

                if (myBackground.map[this.pos.y][this.pos.x + i] == tileBlocks.explodeable) { //remove block
                    myBackground.map[this.pos.y][this.pos.x + i] = tileBlocks.background;
                    enable_x_pos = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x + i] == tileBlocks.solid) { //solid block
                    enable_x_pos = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x + i] > tileBlocks.Virus) {
                    myBackground.map[this.pos.y][this.pos.x + i] -= tileBlocks.numberOfHiddenBlocks;
                    enable_x_pos = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x + i] > tileBlocks.explodeable) {
                    myBackground.map[this.pos.y][this.pos.x + i] = 1;
                    enable_x_pos = false;
                }
            }

            if (enable_y_pos) {
                myPlayer.killPlayer(this.pos.x, this.pos.y + i, this.bombPlayerId);
                this.size.y_pos++;

                if ((currentGamemode == modeTypes.destroytheblock) && (this.checkBlock(myBackground.map[this.pos.y + i][this.pos.x]))) {
                    if (this.bombPlayerId == socket.id) {
                        myPlayer.stats.points++;
                        changed = true;
                    }
                    else {
                        setOtherPlayerPoints(this.bombPlayerId);
                    }
                }

                if (myBackground.map[this.pos.y + i][this.pos.x] == tileBlocks.explodeable) { //remove block
                    myBackground.map[this.pos.y + i][this.pos.x] = tileBlocks.background;
                    enable_y_pos = false;
                }
                else if (myBackground.map[this.pos.y + i][this.pos.x] == tileBlocks.solid) { //solid block
                    enable_y_pos = false;
                }
                else if (myBackground.map[this.pos.y + i][this.pos.x] > tileBlocks.Virus) {
                    myBackground.map[this.pos.y + i][this.pos.x] -= tileBlocks.numberOfHiddenBlocks;
                    enable_y_pos = false;
                }
                else if (myBackground.map[this.pos.y + i][this.pos.x] > tileBlocks.explodeable) {
                    myBackground.map[this.pos.y + i][this.pos.x] = 1;
                    enable_y_pos = false;
                }
            }

            if (enable_x_neg) {
                myPlayer.killPlayer(this.pos.x - i, this.pos.y, this.bombPlayerId);
                this.size.x_neg++;

                if ((currentGamemode == modeTypes.destroytheblock) && (this.checkBlock(myBackground.map[this.pos.y][this.pos.x - i]))) {
                    if (this.bombPlayerId == socket.id) {
                        myPlayer.stats.points++;
                        changed = true;
                    }
                    else {
                        setOtherPlayerPoints(this.bombPlayerId);
                    }
                }

                if (myBackground.map[this.pos.y][this.pos.x - i] == tileBlocks.explodeable) { //remove block
                    myBackground.map[this.pos.y][this.pos.x - i] = tileBlocks.background;
                    enable_x_neg = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x - i] == tileBlocks.solid) { //solid block
                    enable_x_neg = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x - i] > tileBlocks.Virus) {
                    myBackground.map[this.pos.y][this.pos.x - i] -= tileBlocks.numberOfHiddenBlocks;
                    enable_x_neg = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x - i] > tileBlocks.explodeable) {
                    myBackground.map[this.pos.y][this.pos.x - i] = 1;
                    enable_x_neg = false;
                }
            }

            if (enable_y_neg) {
                myPlayer.killPlayer(this.pos.x, this.pos.y - i, this.bombPlayerId);
                this.size.y_neg++;

                if ((currentGamemode == modeTypes.destroytheblock) && (this.checkBlock(myBackground.map[this.pos.y - i][this.pos.x]))) {
                    if (this.bombPlayerId == socket.id) {
                        myPlayer.stats.points++;
                        changed = true;
                    }
                    else {
                        setOtherPlayerPoints(this.bombPlayerId);
                    }
                }

                if (myBackground.map[this.pos.y - i][this.pos.x] == tileBlocks.explodeable) { //remove block
                    myBackground.map[this.pos.y - i][this.pos.x] = tileBlocks.background;
                    enable_y_neg = false;
                }
                else if (myBackground.map[this.pos.y - i][this.pos.x] == tileBlocks.solid) { //solid block
                    enable_y_neg = false;
                }
                else if (myBackground.map[this.pos.y - i][this.pos.x] > tileBlocks.Virus) {
                    myBackground.map[this.pos.y - i][this.pos.x] -= tileBlocks.numberOfHiddenBlocks;
                    enable_y_neg = false;
                }
                else if (myBackground.map[this.pos.y - i][this.pos.x] > tileBlocks.explodeable) {
                    myBackground.map[this.pos.y - i][this.pos.x] = 1;
                    enable_y_neg = false;
                }
            }

            if (changed) {
                changed = false;
                sendPoints(myPlayer.stats.points);
            }
        }
    };

    this.drawBomb = function () {
        if (this.status == 2) {
            myBackground.drawBlock(this.pos.x, this.pos.y);
            this.drawBlock(this.ctx, myImageFactory.bombs[0], this.pos.x, this.pos.y);
        } else if (this.status == 3) {
            myBackground.drawBlock(this.pos.x, this.pos.y);
            this.drawBlock(this.ctx, myImageFactory.bombs[0], this.pos.x, this.pos.y);
            myPlayer.killPlayer(this.pos.x, this.pos.y, this.bombPlayerId);
            this.updateFlameCounter();
            //flames
            for (var i = 1; i <= this.explosionRadius; i++) {
                var enable_x_pos = true;
                var enable_y_pos = true;
                var enable_x_neg = true;
                var enable_y_neg = true;
                for (var i = 1; i <= this.explosionRadius; i++) {
                    if (enable_x_pos && this.size.x_pos >= i) {
                        if (myBackground.map[this.pos.y][this.pos.x + i] == tileBlocks.background) { //flames
                            myBackground.drawBlock(this.pos.x + i, this.pos.y);

                            this.drawBlock(this.ctx, myImageFactory.flames[this.flameCounter], this.pos.x + i, this.pos.y);

                            myPlayer.killPlayer(this.pos.x + i, this.pos.y, this.bombPlayerId);
                        } else if (myBackground.map[this.pos.y][this.pos.x + i] == tileBlocks.solid) { //solid block
                            enable_x_pos = false;
                        }
                    }
                    if (enable_y_pos && this.size.y_pos >= i) {
                        if (myBackground.map[this.pos.y + i][this.pos.x] == tileBlocks.background) { //flames
                            myBackground.drawBlock(this.pos.x, this.pos.y + i);

                            this.drawBlock(this.ctx, myImageFactory.flames[this.flameCounter], this.pos.x, this.pos.y + i);

                            myPlayer.killPlayer(this.pos.x, this.pos.y + i, this.bombPlayerId);
                        } else if (myBackground.map[this.pos.y + i][this.pos.x] == tileBlocks.solid) { //solid block
                            enable_y_pos = false;
                        }
                    }

                    if (enable_x_neg && this.size.x_neg >= i) {
                        if (myBackground.map[this.pos.y][this.pos.x - i] == tileBlocks.background) { //flames
                            myBackground.drawBlock(this.pos.x - i, this.pos.y);

                            this.drawBlock(this.ctx, myImageFactory.flames[this.flameCounter], this.pos.x - i, this.pos.y);

                            myPlayer.killPlayer(this.pos.x - i, this.pos.y, this.bombPlayerId);
                        } else if (myBackground.map[this.pos.y][this.pos.x - i] == tileBlocks.solid) { //solid block
                            enable_x_neg = false;
                        }
                    }
                    if (enable_y_neg && this.size.y_neg >= i) {
                        if (myBackground.map[this.pos.y - i][this.pos.x] == tileBlocks.background) { //flames
                            myBackground.drawBlock(this.pos.x, this.pos.y - i);

                            this.drawBlock(this.ctx, myImageFactory.flames[this.flameCounter], this.pos.x, this.pos.y - i);

                            myPlayer.killPlayer(this.pos.x, this.pos.y - i, this.bombPlayerId);
                        } else if (myBackground.map[this.pos.y - i][this.pos.x] == tileBlocks.solid) { //solid block
                            enable_y_neg = false;
                        }
                    }
                }
            }
        }
    };

    // check if block is explodeable, and not an item or a solid block
    this.checkBlock = function (block) {
        if ((block > tileBlocks.Virus) || (block == 2)) return true;
    };

    // draw a block
    this.drawBlock = function (ctx, img, x, y) {
        ctx.drawImage(img, myBackground.tileSize * x, myBackground.tileSize * y, myBackground.tileSize, myBackground.tileSize);
    };

    /* updates image counter
     * determines which frame of the player should be drawn*/
    this.updateFlameCounter = function () {
        if (this.delay == 4) {
            if (this.flameCounter < 3) {
                this.flameCounter++;
            } else {
                this.flameCounter = 0;
            }
            this.delay = 0;
        }
        else {
            this.delay++;
        }
    };

    var _this = this;

    setTimeout(function () {
        _this.bombExplode();
    }, _this.bombTimer);
}

//helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ImageFactoryLoaded() {
    show_infobar("All images loaded, ready to start");
}

// set other player points
function setOtherPlayerPoints(bombId) {
    players.players.forEach(element => {
        if (element.id == bombId) {
            element.stats.points++;
        }
    });
}

// collision detection between player and bomb
function collisionDetectionBomb(bomb) {

    // check player Block Coords
    var playerCoords = {
        headX: myPlayer.BlockCoord[1][0],
        headY: myPlayer.BlockCoord[1][1],
        bodyX: myPlayer.BlockCoord[4][0],
        bodyY: myPlayer.BlockCoord[4][1]
    };

    if (bomb.pos.x == playerCoords.headX || bomb.pos.x == playerCoords.bodyX || bomb.pos.y == playerCoords.headY || bomb.pos.y == playerCoords.bodyY) {
        return true;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}