var game = {
    width: 9,
    height: 9,
    mineSum: 10,
    remainMineCount: 0,
    map: [],
    flagGame: true,
    flagGameStart: true,
    startTime: 0,
    endTime: 0,
    imgWidth: 16,
    imgHeight: 16,
    marginLeft: 30,
    marginTop: 60
};

var displayArea = document.getElementById('display-area');
var resultArea = document.getElementById('result-area');
var scoreArea = document.getElementById('score-area');
var autoArea = document.getElementById('auto-area');
var remainMineArea = document.getElementById('remain-mine-area');
var timer = null;
var timerSpeed = document.getElementById('speed').selectedIndex;
var autoClickTimer = null;
var autoClickTimerFlag = true;

game.initMine = function () {
    for (var x = 0; x < game.width; x++) {
        game.map[x] = [];
        for (var y = 0; y < game.height; y++) {
            game.map[x][y] = '?';
        }
    }

    var count = 0;
    while (count < game.mineSum) {
        var rand = Math.floor(Math.random() * game.width * game.height);
        var x = Math.floor(rand / game.height);
        var y = rand % game.width;
        game.map[x][y] = 'mine';

        count = 0;
        for (var i = 0; i < game.width; i++) {
            for (var j = 0; j < game.height; j++) {
                if (game.map[i][j] === 'mine') {
                    count++;
                }
            }
        }
    }
};

game.initMap = function () {
    game.initMine();

    var img = '';
    for (var x = 0; x < game.width; x++) {
        for (var y = 0; y < game.height; y++) {
            // 盤面裏的画像的表示
            img = document.createElement('img');
            if (game.map[x][y] === 'mine') {
                img.src = 'mine.png';
            } else {
                var square_number = game.surroundMineCount(x, y);
                img.src = square_number + '.png';
                game.map[x][y] = square_number;
            }
            img.id = x + '-' + y + '-back';
            img.title = x + '-' + y;
            img.style.position = 'absolute';
            img.style.left = game.marginLeft + game.imgWidth * x + 'px';
            img.style.top = game.marginTop + game.imgHeight * y + 'px';
            displayArea.appendChild(img);

            // 盤面的画像的表示
            img = document.createElement('img');
            img.src = 'square.png';
            img.id = x + '-' + y;
            img.title = x + '-' + y;
            img.style.position = 'absolute';
            img.style.left = game.marginLeft + game.imgWidth * x + 'px';
            img.style.top = game.marginTop + game.imgHeight * y + 'px';
            displayArea.appendChild(img);
        }
    }
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
game.isMine = function (x, y) {
    return $(`#${x}-${y}-back`).attr('src') === 'mine.png';
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
game.isZero = function (x, y) {
    return $(`#${x}-${y}-back`).attr('src') === '0.png';
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
game.isNumber = function (x, y) {
    return $(`#${x}-${y}-back`).attr('src') != 'mine.png' && $(`#${x}-${y}-back`).attr('src') != '0.png';
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
game.isFlag = function (x, y) {
    return $(`#${x}-${y}`).attr('src') === 'flag.png';
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
game.isOpen = function (x, y) {
    return $(`#${x}-${y}`).length === 0;
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
game.isSquare = function (x, y) {
    return $(`#${x}-${y}`).attr('src') === 'square.png';
};

/**
 *
 * @return {boolean}
 */
game.lose = function () {
    // open answer
    $("img[src='square.png'], [src='flag.png']").remove();

    resultArea.innerText = 'GAME OVER！';
    game.endTime = new Date().getTime();
    // scoreArea.innerText = 'time:' + (mine.endTime - mine.startTime) / 1000;
    game.flagGameStart = true;
    game.flagGame = false;
    clearInterval(timer);
    clearInterval(autoClickTimer);
    autoArea.innerText = '';

    return true;
};

/**
 *
 * @return {boolean}
 */
game.win = function () {
    var clearFlag = $("img[src='square.png'], [src='flag.png']").length === $("img[src='mine.png']").length;
    if (!clearFlag) {
        return false;
    }

    resultArea.innerText = 'YOU WIN！';
    game.endTime = new Date().getTime();
    // scoreArea.innerText = 'time:' + ( (mine.endTime - mine.startTime) / 1000 );
    game.flagGameStart = true;
    game.flagGame = false;
    clearInterval(timer);
    clearInterval(autoClickTimer);

    return true;
};

/**
 * 左键
 * @param x
 * @param y
 */
game.leftClick = function (x, y) {
    if (!game.flagGame) {
        return false;
    }

    if (game.flagGameStart) {
        game.startTime = new Date().getTime();
        game.flagGameStart = false;
        // timer = setInterval(updateTime, 50);
    }

    if (game.isSquare(x, y)) {
        squareOpen(x, y);
    }
};

/**
 * 右键
 * @param x
 * @param y
 */
game.rightClick = function (x, y) {
    if (!game.flagGame) {
        return false;
    }

    if (game.isSquare(x, y)) {
        $(`#${x}-${y}`).attr('src', 'flag.png');
        game.remainMineCount--;
    } else if (game.isFlag(x, y)) {
        $(`#${x}-${y}`).attr('src', 'square.png');
        game.remainMineCount++;
    }

    remainMineArea.innerText = 'mine quantity:' + game.remainMineCount;
};

/**
 * first click
 */
game.firstClick = function () {
    $.each($("img[src='0.png']"), function () {
        var coordinate = game.decompose2XY(this.id);
        game.leftClick(coordinate.x, coordinate.y);
        return false;
    });
};

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
game.surroundMineCount = function (x, y) {
    var count = 0;
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < game.width && 0 <= y + j && y + j < game.height && game.map[x + i][y + j] === 'mine') {
                count++;
            }
        }
    }

    return count;
};

/**
 *
 * @param x
 * @param y
 */
function squareOpen(x, y) {
    if (game.isMine(x, y)) {
        game.lose();
    } else if (game.surroundMineCount(x, y)) {
        // open number
        document.getElementById(x + '-' + y).parentNode.removeChild(document.getElementById(x + '-' + y));
    } else {
        game.squareOpenZero(x, y);
    }

    game.win();
};

/**
 *
 * @param x
 * @param y
 */
game.squareOpenZero = function (x, y) {
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < game.width && 0 <= y + j && y + j < game.height && game.isSquare(x + i, y + j)) {
                document.getElementById((x + i) + '-' + (y + j)).parentNode.removeChild(document.getElementById((x + i) + '-' + (y + j)));
                if (game.surroundMineCount(x + i, y + j) === 0) {
                    game.squareOpenZero(x + i, y + j);
                }
            }
        }
    }
};

/**
 * decompose string to x, y
 * @param {string} id example: 5-1-back
 * @returns {Object} example: { x:5, y:1}
 */
game.decompose2XY = function (id) {
    id = id.replace('-back', '');
    var coordinate = id.split('-');

    return {x: parseInt(coordinate[0]), y: parseInt(coordinate[1])};
};

updateTime = function () {
    if (game.flagGame && (game.flagGameStart === false)) {
        var nowTime = new Date().getTime();
        var seconds = (nowTime - game.startTime) / 1000;
        scoreArea.innerText = 'time:' + seconds;
    }
};

/**
 * start play game
 * @param difficulty
 */
game.start = function (difficulty) {
    game.flagGame = true;
    game.flagGameStart = true;
    game.startTime = 0;
    game.endTime = 0;
    resultArea.innerText = '';
    // scoreArea.innerText = 'time:' + 0;
    autoArea.innerText = '';
    clearInterval(autoClickTimer);
    $(displayArea).empty();
    autoClickTimerFlag = true;

    if (difficulty === 0) {
        game.width = 9;
        game.height = 9;
        game.mineSum = 10;
    } else if (difficulty === 1) {
        game.width = 16;
        game.height = 16;
        game.mineSum = 40;
    } else if (difficulty === 2) {
        game.width = 30;
        game.height = 16;
        game.mineSum = 99;
    } else if (difficulty === 3) {
        game.width = 48;
        game.height = 24;
        game.mineSum = 256;
    } else if (difficulty === 4) {
        game.width = 64;
        game.height = 48;
        game.mineSum = 777;
    }
    remainMineArea.innerText = 'mine quantity:' + game.mineSum;
    game.remainMineCount = game.mineSum;

    game.initMap();

    game.firstClick();
};

document.getElementById('restart').onclick = game.start;

document.getElementById('difficulty').onchange = function () {
    game.start(document.getElementById('difficulty').selectedIndex);
};

document.oncontextmenu = function () {
    return false;
};

displayArea.onmousedown = function (e) {
    var x = ( parseInt(e.target.style.left) - game.marginLeft ) / game.imgWidth;
    var y = ( parseInt(e.target.style.top) - game.marginTop ) / game.imgHeight;
    if (e.buttons === 1) {
        game.leftClick(x, y);
    } else if (e.buttons === 2) {
        game.rightClick(x, y);
    }
};

$(function () {
    game.start(document.getElementById('difficulty').selectedIndex);
});