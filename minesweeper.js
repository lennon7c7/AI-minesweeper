var mine = {
    width: 9,
    height: 9,
    num: 10,
    squareWidth: 16,
    squareHeight: 16,
    map: [], // 1mine
    openMap: [], //0opened、1close、2flag
    openNumberMap: [],
    numberMap: [],
    squareOpen: 0,
    squareClose: 1,
    squareMine: 1,
    squareFlag: 2,
    game: true,
    gameStart: true,
    startTime: 0,
    endTime: 0,
    marginLeft: 30,
    marginTop: 60
};

var displayArea = document.getElementById('display-area');
var resultArea = document.getElementById('result-area');
var scoreArea = document.getElementById('score-area');
var autoArea = document.getElementById('auto-area');
var remainMineArea = document.getElementById('remain-mine-area');
var timer = null;
var autoClickTimer = null;
var autoClickTimerFlag = true;
var remainMineCount = 0;
var timerSpeed = document.getElementById('speed').selectedIndex;
var autoClickNowFlag = false;

/**
 * 初始化
 * @param difficulty
 */
function init(difficulty) {
    mine.game = true;
    mine.gameStart = true;
    mine.startTime = 0;
    mine.endTime = 0;
    resultArea.innerText = '';
    // scoreArea.innerText = 'time:' + 0;
    autoArea.innerText = '';
    clearInterval(autoClickTimer);
    autoClickTimerFlag = true;

    if (difficulty === 0) {
        mine.width = 9;
        mine.height = 9;
        mine.num = 10;
    } else if (difficulty === 1) {
        mine.width = 16;
        mine.height = 16;
        mine.num = 40;
    } else if (difficulty === 2) {
        mine.width = 30;
        mine.height = 16;
        mine.num = 99;
    } else if (difficulty === 3) {
        mine.width = 48;
        mine.height = 24;
        mine.num = 256;
    } else if (difficulty === 4) {
        mine.width = 64;
        mine.height = 48;
        mine.num = 777;
    }
    remainMineArea.innerText = 'mine quantity:' + mine.num;
    remainMineCount = mine.num;

    // 初始化
    for (var i = 0; i < mine.width; i++) {
        mine.map[i] = [];
        mine.openMap[i] = [];
        mine.openNumberMap[i] = [];
        mine.numberMap[i] = [];
        for (var j = 0; j < mine.height; j++) {
            mine.map[i][j] = 0;
            mine.openMap[i][j] = mine.squareClose;
            mine.openNumberMap[i][j] = '?';
            mine.numberMap[i][j] = '?';

            // 盤面削除
            if (document.getElementById(i + '-' + j)) {
                document.getElementById(i + '-' + j).parentNode.removeChild(document.getElementById(i + '-' + j));
            }
            if (document.getElementById(i + '-' + j + '-back')) {
                document.getElementById(i + '-' + j + '-back').parentNode.removeChild(document.getElementById(i + '-' + j + '-back'));
            }
        }
    }

    // 地雷配置
    var count = 0;
    while (count < mine.num) {
        var rand = Math.floor(Math.random() * mine.width * mine.height);
        var top = Math.floor(rand / mine.height);
        var left = rand % mine.width;
        mine.map[top][left] = mine.squareMine;
        count = 0;
        for (var i = 0; i < mine.width; i++) {
            for (var j = 0; j < mine.height; j++) {
                count += mine.map[i][j];
            }
        }
    }

    // for bug review
    // mine.map = [[0, 0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 1, 0, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 0]];

    var img = '';
    for (var i = 0; i < mine.width; i++) {
        for (var j = 0; j < mine.height; j++) {
            // 盤面裏的画像的表示
            img = document.createElement('img');
            if (mine.map[i][j] === mine.squareMine) {
                img.src = 'mine.png';
                mine.numberMap[i][j] = 'mine';
            } else {
                var square_number = surroundMineNum(i, j);
                img.src = square_number + '.png';
                mine.numberMap[i][j] = square_number;
            }
            img.id = i + '-' + j + '-back';
            img.style.position = 'absolute';
            img.style.left = mine.marginLeft + mine.squareWidth * i + 'px';
            img.style.top = mine.marginTop + mine.squareHeight * j + 'px';
            displayArea.appendChild(img);

            // 盤面的画像的表示
            img = document.createElement('img');
            img.src = 'square.png';
            img.id = i + '-' + j;
            img.style.position = 'absolute';
            img.style.left = mine.marginLeft + mine.squareWidth * i + 'px';
            img.style.top = mine.marginTop + mine.squareHeight * j + 'px';
            displayArea.appendChild(img);
        }
    }

    // first click
    loop1:
        for (var i = 0; i < mine.width; i++) {
            for (var j = 0; j < mine.height; j++) {
                if (mine.numberMap[i][j] === 0) {
                    leftClickAction(i, j);
                    break loop1;
                }
            }
        }

    document.getElementById('auto').click();
}

document.getElementById('restart').onclick = init;

document.getElementById('difficulty').onchange = function () {
    init(document.getElementById('difficulty').selectedIndex);
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

document.oncontextmenu = function (e) {
    return false;
};

// 按键
var buttonNum = 0;
displayArea.onmousedown = function (e) {
    var x = ( parseInt(e.target.style.left) - mine.marginLeft ) / mine.squareWidth;
    var y = ( parseInt(e.target.style.top) - mine.marginTop ) / mine.squareHeight;
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
        leftClickAction(x, y);
    } else if (buttonNum === 2) {
        rightClickAction(x, y);
    }
}

/**
 * 左键
 * @param x
 * @param y
 */
function leftClickAction(x, y) {
    if (mine.game) {
        if (mine.gameStart) {
            mine.startTime = new Date().getTime();
            mine.gameStart = false;
            // timer = setInterval(updateTime, 50);
        }

        if (mine.openMap[x][y] === mine.squareClose) {
            if (mine.numberMap[x][y] === 'mine') {
                console.log('leftClickAction click mine:', x, y);
            }

            squareOpen(x, y);
        }
    }
}

/**
 * 右键
 * @param x
 * @param y
 */
function rightClickAction(x, y) {
    if (mine.game) {
        if (mine.openMap[x][y] === mine.squareClose) {
            mine.openMap[x][y] = mine.squareFlag;
            document.getElementById(x + '-' + y).src = 'flag.png';
            remainMineCount--;
        } else if (mine.openMap[x][y] === mine.squareFlag) {
            mine.openMap[x][y] = mine.squareClose;
            document.getElementById(x + '-' + y).src = 'square.png';
            remainMineCount++;
        }
        remainMineArea.innerText = 'mine quantity:' + remainMineCount;
    }
}

/**
 *
 * @param x
 * @param y
 */
function squareOpen(x, y) {
    if (mine.map[x][y] === mine.squareMine) {
        // open all
        for (var i = 0; i < mine.width; i++) {
            for (var j = 0; j < mine.height; j++) {
                if (mine.openMap[i][j] !== mine.squareOpen) {
                    mine.openMap[i][j] = mine.squareOpen;
                    document.getElementById(i + '-' + j).parentNode.removeChild(document.getElementById(i + '-' + j));
                }
            }
        }

        resultArea.innerText = 'GAME OVER！';
        mine.endTime = new Date().getTime();
        // scoreArea.innerText = 'time:' + (mine.endTime - mine.startTime) / 1000;
        mine.gameStart = true;
        mine.game = false;
        clearInterval(timer);
        clearInterval(autoClickTimer);
        autoArea.innerText = '';
    } else if (surroundMineNum(x, y)) {
        // open number
        mine.openMap[x][y] = mine.squareOpen;
        mine.openNumberMap[x][y] = squareImgNum(x, y);
        document.getElementById(x + '-' + y).parentNode.removeChild(document.getElementById(x + '-' + y));
    } else {
        zeroSquareOpen(x, y);
    }

    setWin();
}

function setWin() {
    var clearFlag = true;
    for (var i = 0; i < mine.width; i++) {
        for (var j = 0; j < mine.height; j++) {
            if (!( (mine.map[i][j] === mine.openMap[i][j]) || (mine.map[i][j] === mine.squareMine && mine.openMap[i][j] === mine.squareFlag) )) {
                clearFlag = false;
            }
        }
    }

    if (clearFlag) {
        resultArea.innerText = 'YOU WIN！';
        mine.endTime = new Date().getTime();
        // scoreArea.innerText = 'time:' + ( (mine.endTime - mine.startTime) / 1000 );
        mine.gameStart = true;
        mine.game = false;
        clearInterval(timer);
        clearInterval(autoClickTimer);

        console.log('YOU WIN！');
        document.getElementById('restart').click();
    }
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function squareImgNum(x, y) {
    var fileName = document.getElementById(x + '-' + y + '-back').src;
    var num = parseInt(fileName.replace(window.location.href, '').replace('.png', ''));
    if (!Number(num)) {
        num = 0;
    }

    return num;
}

/**
 *
 * @returns {number}
 */
function squareCloseNum() {
    var count = 0;
    for (var x = 0; x < mine.width; x++) {
        for (var y = 0; y < mine.height; y++) {
            if (mine.openMap[x][y] === mine.squareClose) {
                count++;
            }
        }
    }

    return count;
}

/**
 *
 * @returns {Array}
 */
function squareCloseXY() {
    var closeXY = [];
    for (var x = 0; x < mine.width; x++) {
        for (var y = 0; y < mine.height; y++) {
            if (mine.openMap[x][y] === mine.squareClose) {
                closeXY.push({x: x, y: y});
            }
        }
    }

    return closeXY;
}

/**
 *
 * @returns {Array}
 */
function squareMaybeMineXY() {
    var maybeMineXY = [];
    for (var x = 0; x < mine.width; x++) {
        for (var y = 0; y < mine.height; y++) {
            if (mine.openMap[x][y] === mine.squareOpen && surroundFlagNum(x, y) !== squareImgNum(x, y)) {
                maybeMineXY = $.merge(maybeMineXY, surroundCloseSquareXY(x, y));
            }
        }
    }

    maybeMineXY = filterUniqueXY(maybeMineXY);

    // deep filter
    var noMineXY = [];
    $.each(maybeMineXY, function (key, val) {
        var surroundImgNumArray = surroundSquareImgNum(val['x'], val['y']);
        $.each(surroundImgNumArray, function (key2, val2) {
            var surroundCloseSquareXYArray = surroundCloseSquareXY(val2['x'], val2['y']);
            if (remainMineCount === val2['num']) {
                var diffArray = filterDifferenceXY(maybeMineXY, surroundCloseSquareXYArray);
                if (diffArray.length) {
                    $.each(diffArray, function (key4, val4) {
                        noMineXY.push({x: val4['x'], y: val4['y']});
                    });
                }
            }
        });
    });

    noMineXY = filterUniqueXY(noMineXY);
    maybeMineXY = filterDifferenceXY(maybeMineXY, noMineXY);

    return maybeMineXY;
}

/**
 *
 * @returns {Array}
 */
function squareNoMineXY() {
    var maybeMineXY = squareMaybeMineXY();
    var squareXY = squareCloseXY();
    var noMineXY = [];

    if (!maybeMineXY.length || !squareXY.length) {
        return noMineXY;
    }

    return filterDifferenceXY(maybeMineXY, squareXY);
}

/**
 *
 * @returns {{}|bool}
 */
function squareLastXY() {
    var lastXY = {};
    var count = 0;
    for (var x = 0; x < mine.width; x++) {
        for (var y = 0; y < mine.height; y++) {
            if (mine.openMap[x][y] === mine.squareClose) {
                lastXY = {x: x, y: y};
                count++;
            }
        }
    }

    if (!Object.keys(lastXY).length || count != 1) {
        lastXY = false;
    }

    return lastXY;
}

/**
 *
 * @param x
 * @param y
 */
function zeroSquareOpen(x, y) {
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < mine.width && 0 <= y + j && y + j < mine.height) {
                if (mine.openMap[x + i][y + j] === mine.squareClose) {
                    mine.openMap[x + i][y + j] = mine.squareOpen;
                    mine.openNumberMap[x + i][y + j] = squareImgNum(x + i, y + j);
                    document.getElementById((x + i) + '-' + (y + j)).parentNode.removeChild(document.getElementById((x + i) + '-' + (y + j)));
                    if (surroundMineNum(x + i, y + j) === 0) {
                        zeroSquareOpen(x + i, y + j);
                    }
                }
            }
        }
    }
}

function updateTime() {
    if (mine.game && (mine.gameStart === false)) {
        var nowTime = new Date().getTime();
        var seconds = (nowTime - mine.startTime) / 1000;
        scoreArea.innerText = 'time:' + seconds;
    }
}

document.getElementById('auto').onclick = function () {
    if (autoClickTimerFlag) {
        autoClick();
        autoClickTimer = setInterval(autoClick, timerSpeed);
        autoArea.innerText = '';
        autoClickTimerFlag = false;
    }
};

var autoClickX = 0;
var autoClickY = 0;
var autoClickFlag = true;
var noFlagFlag = true;
var noOpenFlag = true;
var noCount = 0;

/**
 *
 */
function autoClick() {
    if (mine.game) {
        autoClickNowFlag = true;
        if (mine.gameStart) {
            var left = 0;
            var top = 0;
            while (1) {
                left = Math.floor(Math.random() * mine.width);
                top = Math.floor(Math.random() * mine.height);
                if (surroundMineNum(left, top) === 0) {
                    break;
                }
            }
            leftClickAction(left, top);
        } else if (squareCloseNum() === 1 && remainMineCount === 0) {
            var lastXY = squareLastXY();
            if (lastXY) {
                leftClickAction(lastXY['x'], lastXY['y']);
            }
        // } else if (squareNoMineXY() && squareCloseNum() > remainMineCount && remainMineCount === 1) {
        //     var noMineXY = squareNoMineXY();
        //     for (var i = 0; i < noMineXY.length; i++) {
        //         leftClickAction(noMineXY[i]['x'], noMineXY[i]['y']);
        //     }
        } else if (autoClickFlag) {
            while (1) {
                if (autoClickX === mine.width) {
                    autoClickX = 0;
                    autoClickY++;
                }
                if (autoClickY === mine.height) {
                    autoClickX = 0;
                    autoClickY = 0;
                    autoClickFlag = false;
                    if (noFlagFlag) {
                        //clearInterval(autoClickTimer);
                        //autoClickFlag = true;
                        noCount++;
                    }
                    noFlagFlag = true;
                    return;
                }
                if (mine.openMap[autoClickX][autoClickY] === 0 && surroundMineNum(autoClickX, autoClickY) !== 0 && surroundMineNum(autoClickX, autoClickY) === surroundSquareNum(autoClickX, autoClickY) && surroundMineNum(autoClickX, autoClickY) !== surroundFlagNum(autoClickX, autoClickY)) {
                    noFlagFlag = false;
                    break;
                }
                autoClickX++;
            }
            for (var i = -1; i < 2; i++) {
                for (var j = -1; j < 2; j++) {
                    if (0 <= autoClickX + i && autoClickX + i < mine.width && 0 <= autoClickY + j && autoClickY + j < mine.height) {
                        if (mine.openMap[autoClickX + i][autoClickY + j] === mine.squareClose) {
                            rightClickAction(autoClickX + i, autoClickY + j);
                        }
                    }
                }
            }
            autoClickX++;
        } else {
            while (1) {
                if (autoClickX === mine.width) {
                    autoClickX = 0;
                    autoClickY++;
                }
                if (autoClickY === mine.height) {
                    autoClickX = 0;
                    autoClickY = 0;
                    autoClickFlag = true;
                    if (noOpenFlag) {
                        //clearInterval(autoClickTimer);
                        //autoClickFlag = true;
                        noCount++;
                    }
                    if (noCount >= 6) {
                        clearInterval(autoClickTimer);
                        noCount = 0;
                        autoArea.innerText = 'AI fail！';
                        autoClickTimerFlag = true;
                        autoClickNowFlag = false;

                        console.log('AI fail！');
                        // document.getElementById('restart').click();
                    }
                    noOpenFlag = true;
                    return;
                }

                if (mine.openMap[autoClickX][autoClickY] === mine.squareOpen
                    && surroundMineNum(autoClickX, autoClickY) !== mine.squareOpen
                    && surroundMineNum(autoClickX, autoClickY) === surroundFlagNum(autoClickX, autoClickY)
                    && surroundMineNum(autoClickX, autoClickY) !== surroundSquareNum(autoClickX, autoClickY)) {
                    var xyArray = surroundCloseSquareXY(autoClickX, autoClickY);
                    for (var i = 0; i < xyArray.length; i++) {
                        leftClickAction(xyArray[i]['x'], xyArray[i]['y']);
                    }

                    autoClickX++;

                    noOpenFlag = false;
                    break;
                }

                var maybeMineXY = [];
                $.each(squareMaybeMineXY(), function (key, val) {
                    maybeMineXY.push(JSON.stringify(val));
                });
                var currentXY = JSON.stringify({x:autoClickX , y: autoClickY});
                if (remainMineCount === 1 && mine.openMap[autoClickX][autoClickY] === mine.squareClose && !maybeMineXY.includes(currentXY)) {
                    leftClickAction(autoClickX, autoClickY);

                    autoClickX++;

                    noOpenFlag = false;
                    break;
                }

                autoClickX++;
            }
        }
    }
}

/**
 *
 * @param x
 * @param y
 * @returns {Array}
 */
function surroundSquare(x, y) {
    var xyArray = [];
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (!(x === x + i && y === y + j) && 0 <= x + i && x + i < mine.width && 0 <= y + j && y + j < mine.height) {
                xyArray.push({
                    x: x + i,
                    y: y + j,
                    num: squareImgNum(x + i, y + j)
                });
            }
        }
    }

    return xyArray;
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundSquareNum(x, y) {
    var count = 0;
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < mine.width && 0 <= y + j && y + j < mine.height) {
                if (mine.openMap[x + i][y + j] !== mine.squareOpen) {
                    count++;
                }
            }
        }
    }
    return count;
}

/**
 *
 * @param x
 * @param y
 * @returns {Array}
 */
function surroundSquareImgNum(x, y) {
    var xyArray = [];
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (!(x === x + i && y === y + j) && 0 <= x + i && x + i < mine.width && 0 <= y + j && y + j < mine.height && mine.openMap[x + i][y + j] === mine.squareOpen) {
                xyArray.push({
                    x: x + i,
                    y: y + j,
                    num: squareImgNum(x + i, y + j)
                });
            }
        }
    }

    return xyArray;
}

/**
 *
 * @param x
 * @param y
 * @returns Array
 */
function surroundCloseSquareXY(x, y) {
    var xyArray = [];
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < mine.width && 0 <= y + j && y + j < mine.height) {
                if (mine.openMap[x + i][y + j] === mine.squareClose) {
                    xyArray.push({x: x + i, y: y + j});
                }
            }
        }
    }
    return xyArray;
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundFlagNum(x, y) {
    var count = 0;
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < mine.width && 0 <= y + j && y + j < mine.height) {
                if (mine.openMap[x + i][y + j] === mine.squareFlag) {
                    count++;
                }
            }
        }
    }
    return count;
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundMineNum(x, y) {
    var count = 0;
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (0 <= x + i && x + i < mine.width && 0 <= y + j && y + j < mine.height) {
                count += mine.map[x + i][y + j];
            }
        }
    }
    return count;
}

/**
 *
 * @param oldArray
 * @returns {Array}
 */
function filterUniqueXY(oldArray) {
    var tempArray = [];
    $.each(oldArray, function (key, val) {
        tempArray.push(`${val.x},${val.y}`);
    });

    tempArray = $.unique(tempArray);
    var newArray = [];
    $.each(tempArray, function (key, val) {
        val = val.split(',');
        newArray.push({x: parseInt(val[0]), y: parseInt(val[1])});
    });

    return newArray;
}

/**
 *
 * @param a
 * @param b
 * @returns {Array}
 */
function filterIntersectXY(a, b) {
    var tempA = [];
    $.each(a, function (key, val) {
        tempA.push(JSON.stringify(val));
    });

    var tempB = [];
    $.each(b, function (key, val) {
        tempB.push(JSON.stringify(val));
    });

    var c = tempA.filter(v => tempB.includes(v));
    var tempC = [];
    $.each(c, function (key, val) {
        tempC.push(JSON.parse(val));
    });

    return tempC;
}

/**
 *
 * @param a
 * @param b
 * @returns {Array}
 */
function filterDifferenceXY(a, b) {
    var tempA = [];
    $.each(a, function (key, val) {
        tempA.push(JSON.stringify(val));
    });

    var tempB = [];
    $.each(b, function (key, val) {
        tempB.push(JSON.stringify(val));
    });

    var c = tempA.concat(tempB).filter(v => !tempA.includes(v) || !tempB.includes(v));
    var tempC = [];
    $.each(c, function (key, val) {
        tempC.push(JSON.parse(val));
    });

    return tempC;
}

init(document.getElementById('difficulty').selectedIndex);