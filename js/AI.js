var AI = {
    flagClick: true,
    flagClickNow: false,
    flagClickTimer: true,
    flagNoFlag: true,
    flagNoOpen: true,
    x: 0,
    y: 0,
    noCount: 0,
    YouCanNotSeeMe: true
};

$('#AI').click(function(){
    if (!AI.flagClickTimer) {
        return false;
    }

    AI.start();
    autoClickTimer = setInterval(AI.start, timerSpeed);
    autoArea.innerText = '';
    AI.flagClickTimer = false;
    return true;
});


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
    if (AI.flagClickNow) {
        clearInterval(autoClickTimer);
        autoClickTimer = setInterval(AI.start, timerSpeed);
    }
};

/**
 *
 * @returns {Array}
 */
AI.map = function () {
    var map = [];
    for (var x = 0; x < game.width; x++) {
        map[x] = [];
        for (var y = 0; y < game.height; y++) {
            map[x][y] = {};
        }
    }

    for (x = 0; x < game.width; x++) {
        for (y = 0; y < game.height; y++) {
            map[x][y] = {
                flagCount: AI.surroundFlagCount(x, y),
                closeCount: AI.surroundCloseCount(x, y),
                closeXY: AI.surroundCloseXY(x, y),
                openCount: AI.surroundOpenCount(x, y),
                openXY: AI.surroundOpenXY(x, y),
                x: x,
                y: y,
                imageName: AI.squareImageName(x, y)
            };
        }
    }

    return map;
};

/**
 * how many mine need to flag
 * @return {number}
 */
AI.existMine = function () {
    return game.mineSum - $('img[src="flag.png"]').length;
};

/**
 * how many square need to open
 * @return {number}
 */
AI.existSquare = function () {
    return $('img[src="square.png"]').length;
};

/**
 *
 * @param x
 * @param y
 * @returns {string|number}
 */
AI.squareImageName = function (x, y) {
    if (x > game.width || y > game.height) {
        return '';
    }

    if (AI.isSquare(x, y)) {
        return '?';
    }

    if (AI.isFlag(x, y)) {
        return 'flag';
    }

    var num = parseInt(document.getElementById(x + '-' + y + '-back').src.replace(window.location.href, '').replace('.png', ''));
    if (!Number(num)) {
        num = 0;
    }

    return num;
};

/**
 *
 * @returns {Array}
 */
AI.squareCloseXY = function () {
    var coordinate = [];
    for (var x = 0; x < game.width; x++) {
        for (var y = 0; y < game.height; y++) {
            if (AI.isSquare(x, y)) {
                coordinate.push({x: x, y: y});
            }
        }
    }

    return coordinate;
};

/**
 *
 * @returns {Array}
 */
AI.squareMaybeMineXY = function () {
    var maybeMineXY = [];
    var noMineXY = [];
    var closeXY = AI.squareCloseXY();
    $.each(closeXY, function (key, val) {
        var openXY = AI.surroundOpenXY(val.x, val.y);
        for (var i = 0, len = openXY.length; i < len; i++) {
            if (AI.eqFlag(openXY[i].x, openXY[i].y)) {
                noMineXY.push({x: val.x, y: val.y});
                continue;
            }

            maybeMineXY.push({x: val.x, y: val.y});
        }
    });

    noMineXY = AI.filterUniqueXY(noMineXY);
    maybeMineXY = AI.filterUniqueXY(maybeMineXY);
    if (noMineXY.length) {
        maybeMineXY = AI.filterDifferenceXY(closeXY, noMineXY);
    }

    return maybeMineXY;
};

/**
 *
 * @returns {Array}
 */
AI.squareNoneMineXY = function () {
    var noMineXY = [];
    $.each(AI.squareCloseXY(), function (key, val) {
        var openXY = AI.surroundOpenXY(val.x, val.y);
        for (var i = 0, len = openXY.length; i < len; i++) {
            if (!AI.eqFlag(openXY[i].x, openXY[i].y)) {
                continue;
            }

            noMineXY.push({x: val.x, y: val.y});
        }
    });

    noMineXY = AI.filterUniqueXY(noMineXY);

    return noMineXY;
};

/**
 *
 * @returns {{}|bool}
 */
AI.squareLastXY = function () {
    var lastXY = {};
    var count = 0;
    for (var x = 0; x < game.width; x++) {
        for (var y = 0; y < game.height; y++) {
            if (AI.isSquare(x, y)) {
                lastXY = {x: x, y: y};
                count++;
            }
        }
    }

    if (!Object.keys(lastXY).length || count != 1) {
        lastXY = false;
    }

    return lastXY;
};

/**
 *
 * @param x
 * @param y
 * @returns {Array}
 */
AI.surroundXY = function (x, y) {
    var squareXY = [];
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (!(x === x + i && y === y + j) && 0 <= x + i && x + i < game.width && 0 <= y + j && y + j < game.height) {
                squareXY.push({
                    x: x + i,
                    y: y + j,
                    imageName: AI.squareImageName(x + i, y + j)
                });
            }
        }
    }

    return squareXY;
};

/**
 *
 * @param x
 * @param y
 * @returns Array
 */
AI.surroundCloseXY = function (x, y) {
    var squareXY = AI.surroundXY(x, y);
    var closeXY = [];
    $.each(squareXY, function (key, val) {
        if (val.imageName === '?') {
            closeXY.push({x: val.x, y: val.y});
        }
    });

    return closeXY;
};

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
AI.surroundOpenCount = function (x, y) {
    var squareXY = AI.surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName !== '?' && val.imageName !== 'flag') {
            count++;
        }
    });

    return count;
};

/**
 *
 * @param x
 * @param y
 * @returns Array
 */
AI.surroundOpenXY = function (x, y) {
    var squareXY = AI.surroundXY(x, y);
    var openXY = [];
    $.each(squareXY, function (key, val) {
        if (AI.isOpen(val.x, val.y)) {
            openXY.push(val);
        }
    });

    return openXY;
};

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
AI.surroundCloseCount = function (x, y) {
    var squareXY = AI.surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName === '?') {
            count++;
        }
    });

    return count;
};

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
AI.surroundFlagCount = function (x, y) {
    var squareXY = AI.surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName === 'flag') {
            count++;
        }
    });

    return count;
};

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
AI.surroundOpenAndFlagCount = function (x, y) {
    var squareXY = AI.surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName !== '?') {
            count++;
        }
    });

    return count;
};

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
AI.surroundCloseAndFlagCount = function (x, y) {
    var squareXY = AI.surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName === '?' || val.imageName === 'flag') {
            count++;
        }
    });

    return count;
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
AI.isNumber = function (x, y) {
    return $(`#${x}-${y}`).length === 0;
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
AI.isFlag = function (x, y) {
    return $(`#${x}-${y}`).attr('src') === 'flag.png';
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
AI.isOpen = function (x, y) {
    return $(`#${x}-${y}`).length === 0;
};

/**
 *
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {boolean}
 */
AI.isOpen2 = function (x1, y1, x2, y2) {
    return AI.isOpen(x1, y1) && AI.isOpen(x2, y2);
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
AI.isSquare = function (x, y) {
    return $(`#${x}-${y}`).attr('src') === 'square.png';
};

/**
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
AI.isSurroundNoneMine = function (x, y) {
    return AI.squareImageName(x, y) === 0 || (AI.isOpen(x, y) && AI.eqFlag(x, y));
};

/**
 * filename == surround flag quantity
 * @param x
 * @param y
 * @returns {boolean}
 */
AI.eqFlag = function (x, y) {
    var num = parseInt($(`#${x}-${y}-back`).attr('src').replace('.png', ''));
    var flagCount = AI.surroundFlagCount(x, y);
    return flagCount != 0 && num === flagCount;
};

/**
 * mine quantity == giving number
 * @param {number} quantity
 * @returns {boolean}
 */
AI.eqMine = function (quantity) {
    return AI.existMine() === Number(quantity);
};

/**
 * if image name == new number
 * @param {number} x
 * @param {number} y
 * @param {number} newNumber
 * @returns {boolean}
 */
AI.eqNumber = function (x, y, newNumber) {
    return AI.squareImageName(x, y) - AI.surroundFlagCount(x, y) === newNumber;
};

/**
 * coordinate1 == coordinate2
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {boolean}
 */
AI.eqNumber2 = function (x1, y1, x2, y2) {
    return AI.squareImageName(x1, y1) - AI.surroundFlagCount(x1, y1) === AI.squareImageName(x2, y2) - AI.surroundFlagCount(x2, y2);
};

/**
 * coordinate1 > coordinate2
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {boolean}
 */
AI.gtNumber2 = function (x1, y1, x2, y2) {
    return AI.squareImageName(x1, y1) - AI.surroundFlagCount(x1, y1) > AI.squareImageName(x2, y2) - AI.surroundFlagCount(x2, y2);
};

/**
 * coordinate1 > coordinate2
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {boolean}
 */
AI.ltNumber2 = function (x1, y1, x2, y2) {
    return AI.squareImageName(x1, y1) - AI.surroundFlagCount(x1, y1) < AI.squareImageName(x2, y2) - AI.surroundFlagCount(x2, y2);
};

/**
 * filename == surround square quantity
 * @param x
 * @param y
 * @returns {boolean}
 */
AI.eqSquare = function (x, y) {
    var flagCount = AI.surroundFlagCount(x, y);
    var num = parseInt($(`#${x}-${y}-back`).attr('src').replace('.png', ''));
    return num - flagCount === AI.surroundCloseCount(x, y);
};

/**
 * if exist mine == 1 and exist square > 1
 * @returns {Array}
 */
AI.ifMineEq1 = function () {
    var existSquareCount = AI.existSquare();
    if (!AI.eqMine(1) || existSquareCount < 1) {
        return [];
    }

    var mineXY = [];
    var coordinateCloseXY = AI.squareCloseXY();
    $.each(coordinateCloseXY, function () {
        $.each(AI.surroundOpenXY(this.x, this.y), function (key, val) {
            if (AI.eqFlag(val.x, val.y)) {
                return false;
            } else if (mineXY.length) {
                mineXY = AI.filterIntersectXY(mineXY, AI.surroundCloseXY(val.x, val.y));
            } else{
                mineXY = AI.surroundCloseXY(val.x, val.y);
            }
        });
    });

    if (!mineXY.length) {
        return [];
    }

    return AI.filterUniqueXY(AI.filterDifferenceXY(mineXY, coordinateCloseXY));
};

/**
 * if exist mine == 2 and exist square > 2
 * @returns {Array}
 */
AI.ifMineEq2 = function () {
    var noMineXY = [];
    var allCloseXY = AI.squareCloseXY();
    if (!AI.eqMine(2) || allCloseXY.length < 2 || allCloseXY.length > 11) {
        return noMineXY;
    }

    var maybeMineXY = AI.squareMaybeMineXY();
    noMineXY = AI.squareNoneMineXY();

    var eqNumberFlag = false;
    var eqNumberXY = [];
    $.each(maybeMineXY, function () {
        $.each(AI.surroundOpenXY(this.x, this.y), function (key, val) {
            if (AI.eqNumber(val.x, val.y, 2)) {
                eqNumberFlag = true;
                eqNumberXY = AI.surroundCloseXY(val.x, val.y);
                return false;
            }
        });
    });

    if (eqNumberFlag) {
        noMineXY = AI.filterUniqueXY(AI.filterDifferenceXY(allCloseXY, eqNumberXY));
    }

    return noMineXY;
};

/**
 * @param {number} x
 * @param {number} y
 * @returns {Array}
 */
AI.leftClick2 = function (x, y) {
    var map = AI.map();
    var noMineXY = [];

    if (!(AI.y + 1 < game.height) || !AI.isOpen2(x, y, x, y + 1) || !AI.gtNumber2(x, y, x, y + 1) || map[x][y].closeCount !== map[x][y + 1].closeCount || AI.eqFlag(x, y) || AI.eqFlag(x, y + 1) || AI.eqSquare(x, y) || AI.eqSquare(x, y + 1)) {
        return noMineXY;
    }

    noMineXY = AI.filterDifferenceXY(map[x][y + 1].closeXY, AI.filterIntersectXY(map[x][y].closeXY, map[x][y + 1].closeXY));
    if (noMineXY.length != 1) {
        return [];
    }

    return noMineXY;
};

/**
 * use 3 coordinate to compare
 * @param {number} x
 * @param {number} y
 * @returns {Array}
 */
AI.leftClick3 = function (x, y) {
    var map = AI.map();
    var openXY = map[x][y].openXY;
    var closeXY = map[x][y].closeXY;
    var noMineXY = [];

    if (!AI.isOpen(x, y) || openXY.length != 2 || AI.eqSquare(x, y) || AI.eqFlag(x, y)) {
        return noMineXY;
    }

    $.each(openXY, function () {
        if (!map[x][y].imageName || map[x][y].imageName != this.imageName + 1 || !map[this.x][this.y].closeXY.length || !AI.filterIncludeXY(closeXY, map[this.x][this.y].closeXY)) {
            return false;
        }

        closeXY = AI.filterDifferenceXY(closeXY, map[this.x][this.y].closeXY);
    });

    if (closeXY.length != 1) {
        return noMineXY;
    }

    noMineXY = closeXY;

    return noMineXY;
};

/**
 *
 * @param oldArray
 * @returns {Array}
 */
AI.filterUniqueXY = function (oldArray) {
    var tempArray = [];
    $.each(oldArray, function (key, val) {
        tempArray.push(JSON.stringify(val));
    });

    tempArray = $.unique(tempArray);
    var newArray = [];
    $.each(tempArray, function (key, val) {
        newArray.push(JSON.parse(val));
    });

    return newArray;
};

/**
 * a fully includes b OR b fully includes a
 * @param a
 * @param b
 * @returns {Array}
 */
AI.filterIncludeXY = function (a, b) {
    var intersectXY = AI.filterIntersectXY(a, b);
    var differenceXY = AI.filterDifferenceXY(a, b);
    if (!a.length || a.length === b.length || !b.length || !intersectXY.length) {
        return [];
    }

    if (intersectXY.length != Math.min(a.length, b.length)) {
        return [];
    }

    return differenceXY;
};

/**
 *
 * @param a
 * @param b
 * @returns {Array}
 */
AI.filterIntersectXY = function (a, b) {
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
};

/**
 *
 * @param a
 * @param b
 * @returns {Array}
 */
AI.filterDifferenceXY = function (a, b) {
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
};

/**
 *
 */
AI.start = function () {
    if (!game.flagGame) {
        return false;
    }

    AI.flagClickNow = true;
    if (AI.existSquare() === 1 && AI.eqMine(0)) {
        var lastXY = AI.squareLastXY();
        if (lastXY) {
            game.leftClick(lastXY['x'], lastXY['y']);
        }
    } else if (AI.ifMineEq1().length) {
        $.each(AI.ifMineEq1(), function () {
            game.leftClick(this.x, this.y);
        });
    } else if (AI.ifMineEq2().length) {
        $.each(AI.ifMineEq2(), function () {
            game.leftClick(this.x, this.y);
        });
    } else if (AI.flagClick) {
        while (1) {
            if (AI.x === game.width) {
                AI.x = 0;
                AI.y++;
            }
            if (AI.y === game.height) {
                AI.x = 0;
                AI.y = 0;
                AI.flagClick = false;
                if (AI.flagNoFlag) {
                    AI.noCount++;
                }
                AI.flagNoFlag = true;
                return;
            }

            if (AI.isOpen(AI.x, AI.y) && game.surroundMineCount(AI.x, AI.y) !== 0 && game.surroundMineCount(AI.x, AI.y) === AI.surroundCloseAndFlagCount(AI.x, AI.y) && game.surroundMineCount(AI.x, AI.y) !== AI.surroundFlagCount(AI.x, AI.y)) {
                $.each(AI.surroundCloseXY(AI.x, AI.y), function (key, val) {
                    game.rightClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoFlag = false;
                break;
            } else if (AI.x + 1 < game.width && AI.isOpen2(AI.x, AI.y, AI.x + 1, AI.y)
                && AI.surroundCloseXY(AI.x, AI.y).length && AI.surroundCloseXY(AI.x + 1, AI.y).length
                && game.remainMineCount > AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)).length
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)).length <= AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)).length <= AI.squareImageName(AI.x + 1, AI.y) - AI.surroundFlagCount(AI.x + 1, AI.y)
                && AI.ltNumber2(AI.x, AI.y, AI.x + 1, AI.y)
                && AI.squareImageName(AI.x, AI.y) > AI.surroundFlagCount(AI.x, AI.y) && AI.squareImageName(AI.x + 1, AI.y) > AI.surroundFlagCount(AI.x + 1, AI.y)
                && !(AI.squareImageName(AI.x, AI.y) === 2 && AI.squareImageName(AI.x + 1, AI.y) === 3)
            ) {
                $.each(AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)), function (key, val) {
                    game.rightClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoFlag = false;
                break;
            } else if (AI.x + 1 < game.width && AI.isOpen2(AI.x, AI.y, AI.x + 1, AI.y)
                && AI.surroundCloseXY(AI.x, AI.y).length && AI.surroundCloseXY(AI.x + 1, AI.y).length
                && AI.gtNumber2(AI.x, AI.y, AI.x + 1, AI.y)
                && AI.squareImageName(AI.x, AI.y) > AI.surroundFlagCount(AI.x, AI.y) && AI.squareImageName(AI.x + 1, AI.y) > AI.surroundFlagCount(AI.x + 1, AI.y)
                && AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.filterIntersectXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y))).length === 1
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.filterIntersectXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y))), function (key, val) {
                    game.rightClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoFlag = false;
                break;
            } else if (AI.y + 1 < game.height && AI.isOpen2(AI.x, AI.y, AI.x, AI.y + 1)
                && AI.surroundCloseXY(AI.x, AI.y).length && AI.surroundCloseXY(AI.x, AI.y + 1).length
                && game.remainMineCount > AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)).length
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)).length <= AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)).length <= AI.squareImageName(AI.x, AI.y + 1) - AI.surroundFlagCount(AI.x, AI.y + 1)
                && AI.ltNumber2(AI.x, AI.y, AI.x, AI.y + 1)
                && AI.squareImageName(AI.x, AI.y) > AI.surroundFlagCount(AI.x, AI.y) && AI.squareImageName(AI.x, AI.y + 1) > AI.surroundFlagCount(AI.x, AI.y + 1)
            ) {
                $.each(AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)), function (key, val) {
                    game.rightClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoFlag = false;
                break;
            } else if (AI.y + 1 < game.height && AI.isOpen2(AI.x, AI.y, AI.x, AI.y + 1) && AI.gtNumber2(AI.x, AI.y, AI.x, AI.y + 1)
                && AI.surroundCloseXY(AI.x, AI.y).length && AI.surroundCloseXY(AI.x, AI.y + 1).length
                && AI.squareImageName(AI.x, AI.y) > AI.surroundFlagCount(AI.x, AI.y) && AI.squareImageName(AI.x, AI.y + 1) > AI.surroundFlagCount(AI.x, AI.y + 1)
                && AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.filterIntersectXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1))).length === 1
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.filterIntersectXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1))), function (key, val) {
                    game.rightClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoFlag = false;
                break;
            }

            AI.x++;
        }
    } else {
        while (1) {
            if (AI.x === game.width) {
                AI.x = 0;
                AI.y++;
            }
            if (AI.y === game.height) {
                AI.x = 0;
                AI.y = 0;
                AI.flagClick = true;
                if (AI.flagNoOpen) {
                    AI.noCount++;
                }
                if (AI.noCount > 6) {
                    clearInterval(autoClickTimer);
                    AI.noCount = 0;
                    autoArea.innerText = 'AI fail！';
                    AI.flagClickTimer = true;
                    AI.flagClickNow = false;
                }
                AI.flagNoOpen = true;
                return;
            }

            if (AI.isOpen(AI.x, AI.y) && AI.eqFlag(AI.x, AI.y) && AI.surroundCloseXY(AI.x, AI.y).length) {
                $.each(AI.surroundCloseXY(AI.x, AI.y), function (key, val) {
                    game.leftClick(val.x, val.y);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.x + 1 < game.width && AI.isOpen2(AI.x, AI.y, AI.x + 1, AI.y) && AI.eqNumber2(AI.x, AI.y, AI.x + 1, AI.y)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)).length
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)), function (key, val) {
                    game.leftClick(val.x, val.y);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.x + 2 < game.width && AI.isOpen2(AI.x, AI.y, AI.x + 2, AI.y) && AI.eqNumber2(AI.x, AI.y, AI.x + 2, AI.y)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 2, AI.y)).length
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 2, AI.y)), function (key, val) {
                    game.leftClick(val.x, val.y);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.y + 1 < game.height && AI.isOpen2(AI.x, AI.y, AI.x, AI.y + 1) && AI.eqNumber2(AI.x, AI.y, AI.x, AI.y + 1)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)).length
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)), function (key, val) {
                    game.leftClick(val.x, val.y);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.y + 2 < game.width && AI.isOpen2(AI.x, AI.y, AI.x, AI.y + 2) && AI.eqNumber2(AI.x, AI.y, AI.x, AI.y + 2)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 2)).length
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 2)), function (key, val) {
                    game.leftClick(val.x, val.y);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.leftClick2(AI.x, AI.y).length) {
                $.each(AI.leftClick2(AI.x, AI.y), function (key, val) {
                    game.leftClick(val.x, val.y);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.leftClick3(AI.x, AI.y).length) {
                $.each(AI.leftClick3(AI.x, AI.y), function (key, val) {
                    game.leftClick(val.x, val.y);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            }

            AI.x++;
        }
    }
};