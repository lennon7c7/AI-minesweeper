var game = {
    width: 9,
    height: 9,
    mineSum: 10,
    remainMineCount: 0,
    map: [],
    openMap: [], //0opened、1close、2flag
    squareOpen: 0,
    squareClose: 1,
    squareMine: 1,
    squareFlag: 2,
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
var autoClickNowFlag = false;

game.initMap = function () {
    // 初始化
    for (var i = 0; i < game.width; i++) {
        game.map[i] = [];
        game.openMap[i] = [];
        for (var j = 0; j < game.height; j++) {
            game.map[i][j] = 0;
            game.openMap[i][j] = game.squareClose;
        }
    }

    // 地雷配置
    var count = 0;
    while (count < game.mineSum) {
        var rand = Math.floor(Math.random() * game.width * game.height);
        var top = Math.floor(rand / game.height);
        var left = rand % game.width;
        game.map[top][left] = 'mine';
        count++;
    }

    var img = '';
    for (var i = 0; i < game.width; i++) {
        for (var j = 0; j < game.height; j++) {
            // 盤面裏的画像的表示
            img = document.createElement('img');
            if (game.map[i][j] === 'mine') {
                img.src = 'mine.png';
            } else {
                var square_number = surroundMineCount(i, j);
                img.src = square_number + '.png';
                game.map[i][j] = square_number;
            }
            img.id = i + '-' + j + '-back';
            img.title = i + '-' + j;
            img.style.position = 'absolute';
            img.style.left = game.marginLeft + game.imgWidth * i + 'px';
            img.style.top = game.marginTop + game.imgHeight * j + 'px';
            displayArea.appendChild(img);

            // 盤面的画像的表示
            img = document.createElement('img');
            img.src = 'square.png';
            img.id = i + '-' + j;
            img.title = i + '-' + j;
            img.style.position = 'absolute';
            img.style.left = game.marginLeft + game.imgWidth * i + 'px';
            img.style.top = game.marginTop + game.imgHeight * j + 'px';
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
game.clickMine = function (x, y) {
    return $(`#${x}-${y}-back`).attr('src') === 'mine.png';
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

    console.info('YOU WIN！');
    // $('#restart').click();

    return true;
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

    // for bug review
    // game.map = [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0], [1, 0, 1, 0, 1, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 1, 0], [0, 1, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];

    firstClick();

    console.clear();
};

document.getElementById('restart').onclick = game.start;

document.getElementById('difficulty').onchange = function () {
    game.start(document.getElementById('difficulty').selectedIndex);
};

document.getElementById('speed').onchange = function () {
    switch (document.getElementById('speed').selectedIndex) {
        case 0:
            timerSpeed = 2000;
            break;
        case 1:
            timerSpeed = 1000;
            break;
        case 2:
            timerSpeed = 500;
            break;
        case 3:
            timerSpeed = 200;
            break;
        case 4:
            timerSpeed = 100;
            break;
    }
    if (autoClickNowFlag) {
        clearInterval(autoClickTimer);
        autoClickTimer = setInterval(autoClick, timerSpeed);
    }
};

document.oncontextmenu = function () {
    return false;
};

// 按键
var buttonNum = 0;
displayArea.onmousedown = function (e) {
    var x = ( parseInt(e.target.style.left) - game.marginLeft ) / game.imgWidth;
    var y = ( parseInt(e.target.style.top) - game.marginTop ) / game.imgHeight;
    buttonNum = e.buttons;
    if (buttonNum === 1 || buttonNum === 2) {
        setTimeout(clickDecision, 100, x, y);
    }
};

/**
 *
 * @param x
 * @param y
 */
function clickDecision(x, y) {
    if (buttonNum === 1) {
        leftClick(x, y);
    } else if (buttonNum === 2) {
        rightClick(x, y);
    }
}

/**
 * 左键
 * @param x
 * @param y
 */
function leftClick(x, y) {
    if (game.flagGame) {
        if (game.flagGameStart) {
            game.startTime = new Date().getTime();
            game.flagGameStart = false;
            // timer = setInterval(updateTime, 50);
        }

        if (game.openMap[x][y] === game.squareClose) {
            squareOpen(x, y);
        }
    }
}

/**
 * 右键
 * @param x
 * @param y
 */
function rightClick(x, y) {
    if (game.flagGame) {
        if (game.openMap[x][y] === game.squareClose) {
            game.openMap[x][y] = game.squareFlag;
            document.getElementById(x + '-' + y).src = 'flag.png';
            game.remainMineCount--;
        } else if (game.openMap[x][y] === game.squareFlag) {
            game.openMap[x][y] = game.squareClose;
            document.getElementById(x + '-' + y).src = 'square.png';
            game.remainMineCount++;
        }
        remainMineArea.innerText = 'mine quantity:' + game.remainMineCount;
    }
}

/**
 * first click
 */
function firstClick() {
    $.each($("img[src='0.png']"), function () {
        var coordinate = decompose2XY(this.id);
        leftClick(coordinate.x, coordinate.y);
        return false;
    });
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundMineCount(x, y) {
    var count = 0;
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < game.width && 0 <= y + j && y + j < game.height && game.map[x + i][y + j] === 'mine') {
                count++;
            }
        }
    }

    return count;
}

/**
 *
 * @param x
 * @param y
 */
function squareOpen(x, y) {
    if (game.clickMine(x, y)) {
        game.lose();
    } else if (surroundMineCount(x, y)) {
        // open number
        game.openMap[x][y] = game.squareOpen;
        document.getElementById(x + '-' + y).parentNode.removeChild(document.getElementById(x + '-' + y));
    } else {
        squareOpenZero(x, y);
    }

    game.win();
}

/**
 *
 * @param x
 * @param y
 */
function squareOpenZero(x, y) {
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < game.width && 0 <= y + j && y + j < game.height) {
                if (game.openMap[x + i][y + j] === game.squareClose) {
                    game.openMap[x + i][y + j] = game.squareOpen;
                    document.getElementById((x + i) + '-' + (y + j)).parentNode.removeChild(document.getElementById((x + i) + '-' + (y + j)));
                    if (surroundMineCount(x + i, y + j) === 0) {
                        squareOpenZero(x + i, y + j);
                    }
                }
            }
        }
    }
}

/**
 * decompose string to x, y
 * @param {string} id example: 5-1-back
 * @returns {Object} example: { x:5, y:1}
 */
function decompose2XY(id) {
    id = id.replace('-back', '');
    var coordinate = id.split('-');

    return {x: parseInt(coordinate[0]), y: parseInt(coordinate[1])};
}

function updateTime() {
    if (game.flagGame && (game.flagGameStart === false)) {
        var nowTime = new Date().getTime();
        var seconds = (nowTime - game.startTime) / 1000;
        scoreArea.innerText = 'time:' + seconds;
    }
}

$(function () {
    game.start(document.getElementById('difficulty').selectedIndex);
});