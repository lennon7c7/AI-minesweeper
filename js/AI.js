var AI = {
    flagClick: true,
    flagClickNow: false,
    flagNoFlag: true,
    flagNoOpen: true,
    x: 0,
    y: 0,
    noCount: 0,
    YouCanNotSeeMe: true
};

document.getElementById('AI').onclick = function () {
    if (autoClickTimerFlag) {
        AI.start();
        autoClickTimer = setInterval(AI.start, timerSpeed);
        autoArea.innerText = '';
        autoClickTimerFlag = false;
    }
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
    if (AI.flagClickNow) {
        clearInterval(autoClickTimer);
        autoClickTimer = setInterval(AI.start, timerSpeed);
    }
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
    for (var x = 0; x < game.width; x++) {
        for (var y = 0; y < game.height; y++) {
            if (AI.isOpen(x, y) && AI.surroundFlagCount(x, y) !== AI.squareImageName(x, y)) {
                maybeMineXY = $.merge(maybeMineXY, AI.surroundCloseXY(x, y));
            }
        }
    }

    maybeMineXY = AI.filterUniqueXY(maybeMineXY);

    // deep filter
    var noMineXY = [];
    $.each(maybeMineXY, function (key, val) {
        $.each(AI.surroundXY(val['x'], val['y']), function (key2, val2) {
            var surroundCloseSquareXYArray = AI.surroundCloseXY(val2['x'], val2['y']);
            if (game.remainMineCount === val2.imageName && !AI.surroundFlagCount(val2['x'], val2['y'])) {
                var diffArray = AI.filterDifferenceXY(maybeMineXY, surroundCloseSquareXYArray);
                if (diffArray.length) {
                    $.each(diffArray, function (key4, val4) {
                        noMineXY.push({x: val4['x'], y: val4['y']});
                    });
                }
            }
        });
    });

    noMineXY = AI.filterUniqueXY(noMineXY);
    maybeMineXY = AI.filterDifferenceXY(maybeMineXY, noMineXY);

    return maybeMineXY;
};

/**
 *
 * @returns {Array}
 */
AI.squareNoMineXY = function () {
    var maybeMineXY = AI.squareMaybeMineXY();
    var squareXY = AI.squareCloseXY();
    var noMineXY = [];

    if (!maybeMineXY.length || !squareXY.length) {
        return noMineXY;
    }

    return AI.filterDifferenceXY(maybeMineXY, squareXY);
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
 * @returns {number}
 */
AI.surroundOpenCount = function (x, y) {
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
 * @param x
 * @param y
 * @returns {boolean}
 */
AI.isSquare = function (x, y) {
    return $(`#${x}-${y}`).attr('src') === 'square.png';
};

/**
 *
 * @param oldArray
 * @returns {Array}
 */
AI.filterUniqueXY = function (oldArray) {
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
    if (AI.existSquare() === 1 && game.remainMineCount === 0) {
        var lastXY = AI.squareLastXY();
        if (lastXY) {
            game.leftClick(lastXY['x'], lastXY['y']);
        }
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
            } else if (AI.x + 1 < game.width && AI.isOpen(AI.x, AI.y) && AI.isOpen(AI.x + 1, AI.y)
                && AI.surroundCloseXY(AI.x, AI.y).length && AI.surroundCloseXY(AI.x + 1, AI.y).length
                && game.remainMineCount > AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)).length
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)).length <= AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)).length <= AI.squareImageName(AI.x + 1, AI.y) - AI.surroundFlagCount(AI.x + 1, AI.y)
                && AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y) < AI.squareImageName(AI.x + 1, AI.y) - AI.surroundFlagCount(AI.x + 1, AI.y)
                && AI.squareImageName(AI.x, AI.y) > AI.surroundFlagCount(AI.x, AI.y) && AI.squareImageName(AI.x + 1, AI.y) > AI.surroundFlagCount(AI.x + 1, AI.y)
                && !(AI.squareImageName(AI.x, AI.y) === 2 && AI.squareImageName(AI.x + 1, AI.y) === 3)
            ) {
                $.each(AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)), function (key, val) {
                    game.rightClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoFlag = false;
                break;
            } else if (AI.x + 1 < game.width && AI.isOpen(AI.x, AI.y) && AI.isOpen(AI.x + 1, AI.y)
                && AI.surroundCloseXY(AI.x, AI.y).length && AI.surroundCloseXY(AI.x + 1, AI.y).length
                && AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y) > AI.squareImageName(AI.x + 1, AI.y) - AI.surroundFlagCount(AI.x + 1, AI.y)
                && AI.squareImageName(AI.x, AI.y) > AI.surroundFlagCount(AI.x, AI.y) && AI.squareImageName(AI.x + 1, AI.y) > AI.surroundFlagCount(AI.x + 1, AI.y)
                && AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.filterIntersectXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y))).length === 1
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.filterIntersectXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y))), function (key, val) {
                    game.rightClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoFlag = false;
                break;
            } else if (AI.y + 1 < game.height && AI.isOpen(AI.x, AI.y) && AI.isOpen(AI.x, AI.y + 1)
                && AI.surroundCloseXY(AI.x, AI.y).length && AI.surroundCloseXY(AI.x, AI.y + 1).length
                && game.remainMineCount > AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)).length
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)).length <= AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)).length <= AI.squareImageName(AI.x, AI.y + 1) - AI.surroundFlagCount(AI.x, AI.y + 1)
                && AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y) < AI.squareImageName(AI.x, AI.y + 1) - AI.surroundFlagCount(AI.x, AI.y + 1)
                && AI.squareImageName(AI.x, AI.y) > AI.surroundFlagCount(AI.x, AI.y) && AI.squareImageName(AI.x, AI.y + 1) > AI.surroundFlagCount(AI.x, AI.y + 1)
            ) {
                $.each(AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)), function (key, val) {
                    game.rightClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoFlag = false;
                break;
            } else if (AI.y + 1 < game.height && AI.isOpen(AI.x, AI.y) && AI.isOpen(AI.x, AI.y + 1)
                && AI.surroundCloseXY(AI.x, AI.y).length && AI.surroundCloseXY(AI.x, AI.y + 1).length
                && AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y) > AI.squareImageName(AI.x, AI.y + 1) - AI.surroundFlagCount(AI.x, AI.y + 1)
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
                    autoClickTimerFlag = true;
                    AI.flagClickNow = false;

                    console.warn(`AI fail！remain mine count: ${game.remainMineCount}`);
                    var output = '// game.map = [';
                    for (var x = 0; x < game.width; x++) {
                        output += '[';
                        for (var y = 0; y < game.height; y++) {
                            if (game.map[x][y] === 'mine') {
                                output += `'${game.map[x][y]}',`;
                            } else {
                                output += `${game.map[x][y]},`;
                            }
                        }
                        output += '],';
                    }
                    output += '];';
                    console.log(output);
                }
                AI.flagNoOpen = true;
                return;
            }

            var maybeMineXY = [];
            $.each(AI.squareMaybeMineXY(), function (key, val) {
                maybeMineXY.push(JSON.stringify(val));
            });
            var noMineXY = [];
            $.each(AI.squareNoMineXY(), function (key, val) {
                noMineXY.push(JSON.stringify(val));
            });
            var currentXY = JSON.stringify({x: AI.x, y: AI.y});
            if (AI.isOpen(AI.x, AI.y) && game.surroundMineCount(AI.x, AI.y) !== 0 && game.surroundMineCount(AI.x, AI.y) === AI.surroundFlagCount(AI.x, AI.y) && game.surroundMineCount(AI.x, AI.y) !== AI.surroundCloseAndFlagCount(AI.x, AI.y)) {
                $.each(AI.surroundCloseXY(AI.x, AI.y), function (key, val) {
                    game.leftClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (game.remainMineCount === 1 && AI.isSquare(AI.x, AI.y) && !maybeMineXY.includes(currentXY) && noMineXY.includes(currentXY)) {
                game.leftClick(AI.x, AI.y);

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.x + 1 < game.width && AI.isOpen(AI.x, AI.y) && AI.isOpen(AI.x + 1, AI.y)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)).length
                && AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y) === AI.squareImageName(AI.x + 1, AI.y) - AI.surroundFlagCount(AI.x + 1, AI.y)
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 1, AI.y)), function (key, val) {
                    game.leftClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.x + 2 < game.width && AI.isOpen(AI.x, AI.y) && AI.isOpen(AI.x + 2, AI.y)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 2, AI.y)).length
                && AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y) === AI.squareImageName(AI.x + 2, AI.y) - AI.surroundFlagCount(AI.x + 2, AI.y)
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x + 2, AI.y)), function (key, val) {
                    game.leftClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
            } else if (AI.y + 1 < game.height && AI.isOpen(AI.x, AI.y) && AI.isOpen(AI.x, AI.y + 1)
                && AI.filterIncludeXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)).length
                && (AI.squareImageName(AI.x, AI.y) - AI.surroundFlagCount(AI.x, AI.y)) === AI.squareImageName(AI.x, AI.y + 1) - AI.surroundFlagCount(AI.x, AI.y + 1)
            ) {
                $.each(AI.filterDifferenceXY(AI.surroundCloseXY(AI.x, AI.y), AI.surroundCloseXY(AI.x, AI.y + 1)), function (key, val) {
                    game.leftClick(val['x'], val['y']);
                });

                AI.x++;
                AI.flagNoOpen = false;
                break;
                // } else if (game.openMap[AI.x][AI.y] === game.squareClose && !AI.surroundOpenCount(AI.x, AI.y) && AI.squareNoMineXY().length && AI.filterIncludeXY(AI.squareNoMineXY(), [{x: AI.x, y: AI.y}]).length) {
                //     $.each(AI.squareNoMineXY(), function (key, val) {
                //         game.leftClick(val['x'], val['y']);
                //     });
                //
                //     AI.x++;
                //     AI.flagNoOpen = false;
                //     break;
            }

            AI.x++;
        }
    }
};