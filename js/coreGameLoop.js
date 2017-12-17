/*INDEX*/
/*
start game
core game loop
pictures
var game area
player
background
bomb
*/

//load images first
var myImageFactory = new ImageFactory();
myImageFactory.load(ImageFactoryLoaded);

/********************/
/*   Declarations   */
/********************/
var explosion = new Audio('./sound/Bomb1.mp3');
explosion.volume = 0.2;

var canvas_game = document.getElementById("gameCanvas");

/* Game Area (Canvas) */
var myGameArea = {
    canvas: canvas_game,
    context: canvas_game.getContext("2d"),
    start: function () {
        this.canvas.width = 665;
        this.canvas.height = 455;
        this.interval = setInterval(updateGameArea, 16);
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

/* direction enum to distinguish directions */
var directions = {
    left: 1,
    right: 2,
    up: 3,
    down: 4
};

var tileBlocks = {
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

var difficulty = {
    normal: 1,
    hardmode: 2
};

var mode = {
    deathmatch: 1,
    closingin: 2,
    fogofwar: 3,
    virusonly: 4,
    destroytheblock: 5
}

function bombHandler() {
    this.bombCounter = 0;
    this.myBombsCounter = 0;
    this.bombs = [];

    this.addBomb = function (position, radius) {
        var playerBomb = new bomb(myPlayer.ctx, 4000, 1000, radius, 2, position);
        this.bombs.push(playerBomb);
        this.myBombsCounter += 1;
        this.bombsCounter += 1;
        var index = this.bombsCounter;
        var _this = this;

        playerBombSet(playerBomb);

        // set remove bomb timeout
        setTimeout(function () {
            _this.bombs.splice(index, 1);
            _this.bombCounter -= 1;
            _this.myBombsCounter -= 1;
        }, (playerBomb.bombTimer + playerBomb.explodeTimer));

    };

    this.addBombFin = function (enemyBomb) {
        var playerBomb = new bomb(myPlayer.ctx, enemyBomb.bombTimer, enemyBomb.explodeTimer, enemyBomb.explosionRadius, 2, enemyBomb.pos);
        playerBomb.id = enemyBomb.id
        this.bombs.push(playerBomb);
        this.bombsCounter += 1;
        var index = this.bombsCounter;
        var _this = this;

        // set remove bomb timeout
        setTimeout(function () {
            _this.bombs.splice(index, 1);
            _this.bombCounter -= 1;
        }, (playerBomb.bombTimer + playerBomb.explodeTimer));
    };
};

var globalPlayerSizeMultiplier = 0.5;
var globalTileSize = 35;
var gameStarted = false;
var gameLoaded = false;

/********************
*     Functions     *
*********************/

function startGame(position) {
    myBombHandler = new bombHandler();
    
    myBackground = new background(myGameArea.context, globalTileSize);
    myPlayer = new player(myGameArea.context, position, globalPlayerSizeMultiplier, 2);
    players = new otherPlayers();

    myGameArea.start();
    gameLoaded = true;
}

function updateGameArea() {
    updateStatus();//gamepad
    if (movLeft || movRight || movUp || movDown) {
        myPlayer.tryMove();
    }

    // redraw background if sth changed
    if (myBackground.layerDirty) {
        myBackground.update();
        myPlayer.update(false, true);
        myBackground.layerDirty = false;

        if (players.playerCount != 0) {
            players.players.forEach(element => {
                element.update(true);
            });
        }
    }

    // redraw player if sth changed
    if (myPlayer.layerDirty) {
        myPlayer.update(true, true);
        myPlayer.layerDirty2 = true;
        playerMoved(myPlayer.pos, myPlayer.imageCounter, myPlayer.currentDirection);
    } else if (myPlayer.layerDirty2) {
        myPlayer.imageCounter = 0;
        myPlayer.layerDirty2 = false;
        myPlayer.update(true, true);
        playerMoved(myPlayer.pos, myPlayer.imageCounter, myPlayer.currentDirection);
    }

    if (players.playerCount != 0) {
        players.players.forEach(element => {
            if (element.layerDirty) 
            element.update(true, true);
        });
    }

    myBombHandler.bombs.forEach(element => {
        if (element.layerDirty) element.drawBomb();
        myPlayer.update(false, true);
    });
}


/********************/
/*     Objects      */
/********************/

/* Player Object
 * Contains vars and funcitons to move and draw the player + check functions*/
function player(context, position, playerSizeMultiplier, walkSpeed) {
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

    this.stats = {
        kills: 0,
        bombs: 1,
        bombRadius: 2,
        speedPowerup: 0
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

    this.BlockCoord = [
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1]
    ];

    this.oldBlockCoord = [
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1]
    ];

    /*moves player when possible
     * updates the direction + image counter
     * also checks if players moves diagonally */
    this.tryMove = function () {
        if (!gameStarted) return;
        var moved = false;
        var movedDiagonally = false;

        for (var i=0; i<this.walkSpeed; ++i) {
            if (movLeft) {
                if (this.possibleMove(this.pos.x + this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height / 2 + this.speed.speedY, -this.walkStep, 0) &&
                    this.possibleMove(this.pos.x + this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height - this.collsionCorrection + this.speed.speedY, -this.walkStep, 0)) {
                    this.speed.speedX -= this.walkStep;
                    moved = true;
                }
                this.currentDirection = directions.left;
            }
            if (movRight && !movLeft) {
                if (this.possibleMove(this.pos.x + this.dimensions.width - this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height / 2 + this.speed.speedY, this.walkStep, 0) &&
                    this.possibleMove(this.pos.x + this.dimensions.width - this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height - this.collsionCorrection + this.speed.speedY, this.walkStep, 0)) {
                    this.speed.speedX += this.walkStep;
                    moved = true;
                }
                this.currentDirection = directions.right;
            }
            if (movUp) {
                if (this.possibleMove(this.pos.x + this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height / 2 + this.speed.speedY, 0, -this.walkStep) &&
                    this.possibleMove(this.pos.x + this.dimensions.width - this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height / 2 + this.speed.speedY, 0, -this.walkStep)) {
                    this.speed.speedY -= this.walkStep;
                    if (moved)
                        movedDiagonally = true;
                    else
                        moved = true;
                }
                this.currentDirection = directions.up;
            }
            if (movDown && !movUp) {
                if (this.possibleMove(this.pos.x + this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height - this.collsionCorrection + this.speed.speedY, 0, this.walkStep) &&
                    this.possibleMove(this.pos.x + this.dimensions.width - this.collsionCorrection + this.speed.speedX, this.pos.y + this.dimensions.height - this.collsionCorrection + this.speed.speedY, 0, this.walkStep)) {
                    this.speed.speedY += this.walkStep;
                    if (moved)
                        movedDiagonally = true;
                    else
                        moved = true;
                }
                this.currentDirection = directions.down;
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
            return true;
        } else
            return false;
    };

    //checks if a single Point can be moved
    this.possibleMove = function (x, y, dx, dy) {
        var y = Math.trunc((y + dy) / myBackground.tileSize);
        var x = Math.trunc((x + dx) / myBackground.tileSize);
        if (myBackground.map[y][x] == tileBlocks.background || myBackground.map[y][x] == tileBlocks.BombUp || myBackground.map[y][x] == tileBlocks.FlameUp || myBackground.map[y][x] == tileBlocks.SpeedUp) {
            return true;
        }
        return false;
    };

    // draws player according to the current looking direction
    this.update = function (draw_bg, draw_others) {
        if (draw_bg) {
            for (var i = 0; i < 6; ++i) { //draw blocks behind player
                myBackground.drawBlock(this.oldBlockCoord[i][0], this.oldBlockCoord[i][1]);
            }
            this.oldBlockCoord = this.BlockCoord;
        }
        if (draw_others) {
            if (players.playerCount != 0) {
                players.players.forEach(element => {
                    element.update(false, false);
                });
            }
        }
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

    this.layBomb = async function () {
        if (!gameStarted) return;

        if (myBombHandler.myBombsCounter < this.stats.bombs) {
            var pos = {
                y: Math.trunc((this.pos.y + (this.dimensions.height / 4) * 3) / myBackground.tileSize),
                x: Math.trunc((this.pos.x + this.dimensions.width / 2) / myBackground.tileSize)
            };
            myBombHandler.addBomb(pos, this.stats.bombRadius);
        };
    };

    this.getPowerUp = function () {
        for (var i = 2; i < 6; ++i) {
            if (myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] == tileBlocks.BombUp) {
                myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] = tileBlocks.background;
                this.stats.bombs++;
                change_infobar("+Bomb");
            }
            else if (myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] == tileBlocks.FlameUp) {
                myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] = tileBlocks.background;
                this.stats.bombRadius++;
                change_infobar("+Flame");
            }
            else if (myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] == tileBlocks.SpeedUp) {
                myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] = tileBlocks.background;
                this.stats.speedPowerup++;
                this.walkStep += 0.1;
                change_infobar("+Speed");
            }
            else if (myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] == tileBlocks.Virus) {
                myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] = tileBlocks.background;
                change_infobar("Virus!");
            }
        }
    };

    this.killPlayer = function (x, y) {
        for (var i = 2; i < 6; ++i) {
            if (this.BlockCoord[i][0] == x && this.BlockCoord[i][1] == y) { //player dead
                if (this.inFlames(this.pos.x + this.collsionCorrection, this.pos.y + this.dimensions.height - this.collsionCorrection, x, y) ||
                    this.inFlames(this.pos.x + this.dimensions.width - this.collsionCorrection, this.pos.y + this.dimensions.height - this.collsionCorrection, x, y) ||
                    this.inFlames(this.pos.x + this.collsionCorrection, this.pos.y + this.dimensions.height / 2, x, y) ||
                    this.inFlames(this.pos.x + this.dimensions.width - this.collsionCorrection, this.pos.y + this.dimensions.height / 2, x, y))
                        change_infobar("You died");
            }
        }
    };

    this.inFlames = function (plx, ply, x, y) {
        var px = Math.trunc(plx / myBackground.tileSize);
        var py = Math.trunc(ply / myBackground.tileSize);
        if (py==y && px==x) {
            return true;
        }
        return false;
    };
}

/* Multiplayer player object
 * */
function playerObject(position, id) {
    this.id = id;
    this.layerDirty = true;
    this.imageCounter = 0;
    this.currentDirection = directions.down;

    this.BlockCoord = [
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1]
    ];

    this.oldBlockCoord = [
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

    this.dimensions = {
        width: 64 * globalPlayerSizeMultiplier,
        height: 100 * globalPlayerSizeMultiplier
    };

    this.stats = {
        kills: 0
    };

    this.update = function (draw_bg, draw_others) {
        // draw block behind player and draw player
        if (draw_bg) {
            this.convertPlayerPos();
            this.drawBlockCoords();
        }

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
        if (draw_others) {
            myPlayer.update(false, false);
            this.removePowerUp();
        }
        this.layerDirty = false;
    };

    this.drawBlockCoords = function () {
        for (var i = 0; i < 6; ++i) { //draw blocks behind player
            myBackground.drawBlock(this.oldBlockCoord[i][0], this.oldBlockCoord[i][1]);
        }
        this.oldBlockCoord = this.BlockCoord;
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

    this.removePowerUp = function () {
        for (var i = 2; i < 6; ++i) {
            if (myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] == tileBlocks.BombUp) {
                myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] = tileBlocks.background;
            }
            else if (myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] == tileBlocks.FlameUp) {
                myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] = tileBlocks.background;
            }
            else if (myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] == tileBlocks.SpeedUp) {
                myBackground.map[this.BlockCoord[i][1]][this.BlockCoord[i][0]] = tileBlocks.background;
            }
        }
    };
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

    this.dimensions = {
        width: 19,
        height: 13
    };

    this.map = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

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
                this.ctx.drawImage(myImageFactory.tiles[tileBlocks.solid], this.tileSize * x, this.tileSize * y, this.tileSize, this.tileSize);
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
}

/*everything with bombs*/
function bomb(context, bombTimer, explodeTimer, explosionRadius, status, position) {
    this.playerId = socket.id;
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
        myBackground.layerDirty = true;
        await sleep(this.explodeTimer);
        this.bombOver();
    };

    this.bombOver = function () {
        this.status = 1;
        myBackground.layerDirty = true;
        this.layerDirty = false;
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
        for (var i = 1; i <= this.explosionRadius; i++) {
            if (enable_x_pos) {
                this.size.x_pos++;
                if (myBackground.map[this.pos.y][this.pos.x + i] == tileBlocks.explodeable) { //remove block
                    myBackground.map[this.pos.y][this.pos.x + i] = tileBlocks.background;
                    enable_x_pos = false;
                } 
                else if (myBackground.map[this.pos.y][this.pos.x + i] == tileBlocks.solid) { //solid block
                    enable_x_pos = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x + i] > tileBlocks.Virus) {
                    myBackground.map[this.pos.y][this.pos.x + i] -= 4;
                    enable_x_pos = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x + i] > tileBlocks.explodeable) {
                    myBackground.map[this.pos.y][this.pos.x + i] = 1;
                    enable_x_pos = false;
                }
            }
            if (enable_y_pos) {
                this.size.y_pos++;
                if (myBackground.map[this.pos.y + i][this.pos.x] == tileBlocks.explodeable) { //remove block
                    myBackground.map[this.pos.y + i][this.pos.x] = tileBlocks.background;
                    enable_y_pos = false;
                } 
                else if (myBackground.map[this.pos.y + i][this.pos.x] == tileBlocks.solid) { //solid block
                    enable_y_pos = false;
                }
                else if (myBackground.map[this.pos.y + i][this.pos.x] > tileBlocks.Virus) {
                    myBackground.map[this.pos.y + i][this.pos.x] -= 4;
                    enable_y_pos = false;
                }
                else if (myBackground.map[this.pos.y + i][this.pos.x] > tileBlocks.explodeable) {
                    myBackground.map[this.pos.y + i][this.pos.x] = 1;
                    enable_y_pos = false;
                }
            }

            if (enable_x_neg) {
                this.size.x_neg++;
                if (myBackground.map[this.pos.y][this.pos.x - i] == tileBlocks.explodeable) { //remove block
                    myBackground.map[this.pos.y][this.pos.x - i] = tileBlocks.background;
                    enable_x_neg = false;
                } 
                else if (myBackground.map[this.pos.y][this.pos.x - i] == tileBlocks.solid) { //solid block
                    enable_x_neg = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x - i] > tileBlocks.Virus) {
                    myBackground.map[this.pos.y][this.pos.x - i] -= 4;
                    enable_x_neg = false;
                }
                else if (myBackground.map[this.pos.y][this.pos.x - i] > tileBlocks.explodeable) {
                    myBackground.map[this.pos.y][this.pos.x - i] = 1;
                    enable_x_neg = false;
                }
            }
            if (enable_y_neg) {
                this.size.y_neg++;
                if (myBackground.map[this.pos.y - i][this.pos.x] == tileBlocks.explodeable) { //remove block
                    myBackground.map[this.pos.y - i][this.pos.x] = tileBlocks.background;
                    enable_y_neg = false;
                } 
                else if (myBackground.map[this.pos.y - i][this.pos.x] == tileBlocks.solid) { //solid block
                    enable_y_neg = false;
                }
                else if (myBackground.map[this.pos.y - i][this.pos.x] > tileBlocks.Virus) {
                    myBackground.map[this.pos.y - i][this.pos.x] -= 4;
                    enable_y_neg = false;
                }
                else if (myBackground.map[this.pos.y - i][this.pos.x] > tileBlocks.explodeable) {
                    myBackground.map[this.pos.y - i][this.pos.x] = 1;
                    enable_y_neg = false;
                }
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
            myPlayer.killPlayer(this.pos.x, this.pos.y);
            this.updateFlameCounter();
            //flames
            for (var i = 1; i <= this.explosionRadius; i++) {
                var enable_x_pos = true;
                var enable_y_pos = true;
                var enable_x_neg = true;
                var enable_y_neg = true;
                for (var i = 1; i <= this.explosionRadius; i++) {
                    if (enable_x_pos && this.size.x_pos>=i) {
                        if (myBackground.map[this.pos.y][this.pos.x + i] == tileBlocks.background) { //flames
                            myBackground.drawBlock(this.pos.x + i, this.pos.y);

                            this.drawBlock(this.ctx, myImageFactory.flames[this.flameCounter], this.pos.x + i, this.pos.y);

                            myPlayer.killPlayer(this.pos.x + i, this.pos.y);
                        } else if (myBackground.map[this.pos.y][this.pos.x + i] == tileBlocks.solid) { //solid block
                            enable_x_pos = false;
                        }
                    }
                    if (enable_y_pos && this.size.y_pos>=i) {
                        if (myBackground.map[this.pos.y + i][this.pos.x] == tileBlocks.background) { //flames
                            myBackground.drawBlock(this.pos.x, this.pos.y + i);

                            this.drawBlock(this.ctx, myImageFactory.flames[this.flameCounter], this.pos.x, this.pos.y + i);

                            myPlayer.killPlayer(this.pos.x, this.pos.y + i);
                        } else if (myBackground.map[this.pos.y + i][this.pos.x] == tileBlocks.solid) { //solid block
                            enable_y_pos = false;
                        }
                    }

                    if (enable_x_neg && this.size.x_neg>=i) {
                        if (myBackground.map[this.pos.y][this.pos.x - i] == tileBlocks.background) { //flames
                            myBackground.drawBlock(this.pos.x - i, this.pos.y);

                            this.drawBlock(this.ctx, myImageFactory.flames[this.flameCounter], this.pos.x - i, this.pos.y);

                            myPlayer.killPlayer(this.pos.x - i, this.pos.y);
                        } else if (myBackground.map[this.pos.y][this.pos.x - i] == tileBlocks.solid) { //solid block
                            enable_x_neg = false;
                        }
                    }
                    if (enable_y_neg && this.size.y_neg>=i) {
                        if (myBackground.map[this.pos.y - i][this.pos.x] == tileBlocks.background) { //flames
                            myBackground.drawBlock(this.pos.x, this.pos.y - i);

                            this.drawBlock(this.ctx, myImageFactory.flames[this.flameCounter], this.pos.x, this.pos.y - i);

                            myPlayer.killPlayer(this.pos.x, this.pos.y - i);
                        } else if (myBackground.map[this.pos.y - i][this.pos.x] == tileBlocks.solid) { //solid block
                            enable_y_neg = false;
                        }
                    }
                }
            }
        }
    };

    this.drawBlock = function (ctx, img, x, y) {
        ctx.drawImage(img, myBackground.tileSize * x, myBackground.tileSize * y, myBackground.tileSize, myBackground.tileSize);
    };

    /* updates image counter
     * determines which frame of the player should be drawn*/
    this.updateFlameCounter = function () {
        if (this.delay == 4){
            if (this.flameCounter < 3) {
                    this.flameCounter++;
            } else {
                this.flameCounter = 0;
            }
            this.delay=0;
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

function calculateCoords(position) {
    position.x = (position.x * globalTileSize);
    position.y = (position.y * globalTileSize) - globalTileSize / 2;
}

//helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ImageFactoryLoaded () {
    show_infobar("All images loaded, ready to start");
}