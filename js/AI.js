
/**
 *
 * @param x
 * @param y
 * @returns {string|number}
 */
function squareImageName(x, y) {
    if (x > game.width || y > game.height) {
        return '';
    }

    if (game.openMap[x][y] === game.squareClose) {
        return '?';
    }

    if (game.openMap[x][y] === game.squareFlag) {
        return 'flag';
    }

    var num = parseInt(document.getElementById(x + '-' + y + '-back').src.replace(window.location.href, '').replace('.png', ''));
    if (!Number(num)) {
        num = 0;
    }

    return num;
}

/**
 *
 * @returns {number}
 */
function squareCloseCount() {
    return $("img[src='square.png']").length;
}

/**
 *
 * @returns {Array}
 */
function squareCloseXY() {
    var closeXY = [];
    for (var x = 0; x < game.width; x++) {
        for (var y = 0; y < game.height; y++) {
            if (game.openMap[x][y] === game.squareClose) {
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
    for (var x = 0; x < game.width; x++) {
        for (var y = 0; y < game.height; y++) {
            if (game.openMap[x][y] === game.squareOpen && surroundFlagCount(x, y) !== squareImageName(x, y)) {
                maybeMineXY = $.merge(maybeMineXY, surroundCloseXY(x, y));
            }
        }
    }

    maybeMineXY = filterUniqueXY(maybeMineXY);

    // deep filter
    var noMineXY = [];
    $.each(maybeMineXY, function (key, val) {
        $.each(surroundXY(val['x'], val['y']), function (key2, val2) {
            var surroundCloseSquareXYArray = surroundCloseXY(val2['x'], val2['y']);
            if (game.remainMineCount === val2.imageName && !surroundFlagCount(val2['x'], val2['y'])) {
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
    for (var x = 0; x < game.width; x++) {
        for (var y = 0; y < game.height; y++) {
            if (game.openMap[x][y] === game.squareClose) {
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


document.getElementById('AI').onclick = function () {
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
    if (game.flagGame) {
        autoClickNowFlag = true;
        if (game.flagGameStart) {
            var left = 0;
            var top = 0;
            while (1) {
                left = Math.floor(Math.random() * game.width);
                top = Math.floor(Math.random() * game.height);
                if (surroundMineCount(left, top) === 0) {
                    break;
                }
            }
            leftClick(left, top);
        } else if (squareCloseCount() === 1 && game.remainMineCount === 0) {
            var lastXY = squareLastXY();
            if (lastXY) {
                leftClick(lastXY['x'], lastXY['y']);
            }
        } else if (autoClickFlag) {
            while (1) {
                if (autoClickX === game.width) {
                    autoClickX = 0;
                    autoClickY++;
                }
                if (autoClickY === game.height) {
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

                // console.log(autoClickX, autoClickY);
                if (game.openMap[autoClickX][autoClickY] === 0 && surroundMineCount(autoClickX, autoClickY) !== 0 && surroundMineCount(autoClickX, autoClickY) === surroundCloseAndFlagCount(autoClickX, autoClickY) && surroundMineCount(autoClickX, autoClickY) !== surroundFlagCount(autoClickX, autoClickY)) {
                    $.each(surroundCloseXY(autoClickX, autoClickY), function (key, val) {
                        rightClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noFlagFlag = false;
                    break;
                } else if (autoClickX + 1 < game.width && game.openMap[autoClickX][autoClickY] === game.squareOpen && game.openMap[autoClickX + 1][autoClickY] === game.squareOpen
                    && surroundCloseXY(autoClickX, autoClickY).length && surroundCloseXY(autoClickX + 1, autoClickY).length
                    && game.remainMineCount > filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 1, autoClickY)).length
                    && filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 1, autoClickY)).length <= squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY)
                    && filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 1, autoClickY)).length <= squareImageName(autoClickX + 1, autoClickY) - surroundFlagCount(autoClickX + 1, autoClickY)
                    && squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY) < squareImageName(autoClickX + 1, autoClickY) - surroundFlagCount(autoClickX + 1, autoClickY)
                    && squareImageName(autoClickX , autoClickY) > surroundFlagCount(autoClickX, autoClickY) && squareImageName(autoClickX + 1, autoClickY) > surroundFlagCount(autoClickX + 1, autoClickY)
                    && !(squareImageName(autoClickX, autoClickY) === 2 && squareImageName(autoClickX + 1, autoClickY) === 3)
                ) {
                    $.each(filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 1, autoClickY)), function (key, val) {
                        rightClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noFlagFlag = false;
                    break;
                } else if (autoClickX + 1 < game.width && game.openMap[autoClickX][autoClickY] === game.squareOpen && game.openMap[autoClickX + 1][autoClickY] === game.squareOpen
                    && surroundCloseXY(autoClickX, autoClickY).length && surroundCloseXY(autoClickX + 1, autoClickY).length
                    && squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY) > squareImageName(autoClickX + 1, autoClickY) - surroundFlagCount(autoClickX + 1, autoClickY)
                    && squareImageName(autoClickX, autoClickY) > surroundFlagCount(autoClickX, autoClickY) && squareImageName(autoClickX + 1, autoClickY) > surroundFlagCount(autoClickX + 1, autoClickY)
                    && filterDifferenceXY(surroundCloseXY(autoClickX, autoClickY), filterIntersectXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 1, autoClickY))).length === 1
                ) {
                    $.each(filterDifferenceXY(surroundCloseXY(autoClickX, autoClickY), filterIntersectXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 1, autoClickY))), function (key, val) {
                        rightClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noFlagFlag = false;
                    break;
                } else if (autoClickY + 1 < game.height && game.openMap[autoClickX][autoClickY] === game.squareOpen && game.openMap[autoClickX][autoClickY + 1] === game.squareOpen
                    && surroundCloseXY(autoClickX, autoClickY).length && surroundCloseXY(autoClickX, autoClickY + 1).length
                    && game.remainMineCount > filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX, autoClickY + 1)).length
                    && filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX, autoClickY + 1)).length <= squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY)
                    && filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX, autoClickY + 1)).length <= squareImageName(autoClickX, autoClickY + 1) - surroundFlagCount(autoClickX, autoClickY + 1)
                    && squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY) < squareImageName(autoClickX, autoClickY + 1) - surroundFlagCount(autoClickX, autoClickY + 1)
                    && squareImageName(autoClickX, autoClickY) > surroundFlagCount(autoClickX, autoClickY) && squareImageName(autoClickX, autoClickY + 1) > surroundFlagCount(autoClickX, autoClickY + 1)
                ) {
                    $.each(filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX, autoClickY + 1)), function (key, val) {
                        rightClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noFlagFlag = false;
                    break;
                } else if (autoClickY + 1 < game.height && game.openMap[autoClickX][autoClickY] === game.squareOpen && game.openMap[autoClickX][autoClickY + 1] === game.squareOpen
                    && surroundCloseXY(autoClickX, autoClickY).length && surroundCloseXY(autoClickX, autoClickY + 1).length
                    && squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY) > squareImageName(autoClickX, autoClickY + 1) - surroundFlagCount(autoClickX, autoClickY + 1)
                    && squareImageName(autoClickX, autoClickY) > surroundFlagCount(autoClickX, autoClickY) && squareImageName(autoClickX, autoClickY + 1) > surroundFlagCount(autoClickX, autoClickY + 1)
                    && filterDifferenceXY(surroundCloseXY(autoClickX, autoClickY), filterIntersectXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX, autoClickY + 1))).length === 1
                ) {
                    $.each(filterDifferenceXY(surroundCloseXY(autoClickX, autoClickY), filterIntersectXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX, autoClickY + 1))), function (key, val) {
                        rightClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noFlagFlag = false;
                    break;
                }

                autoClickX++;
            }
        } else {
            while (1) {
                if (autoClickX === game.width) {
                    autoClickX = 0;
                    autoClickY++;
                }
                if (autoClickY === game.height) {
                    autoClickX = 0;
                    autoClickY = 0;
                    autoClickFlag = true;
                    if (noOpenFlag) {
                        //clearInterval(autoClickTimer);
                        //autoClickFlag = true;
                        noCount++;
                    }
                    if (noCount > 10) {
                        clearInterval(autoClickTimer);
                        noCount = 0;
                        autoArea.innerText = 'AI fail！';
                        autoClickTimerFlag = true;
                        autoClickNowFlag = false;

                        console.warn(`AI fail！remain mine count: ${game.remainMineCount}`);
                        // $('#restart').click();
                    }
                    noOpenFlag = true;
                    return;
                }

                // console.log(autoClickX, autoClickY);
                var maybeMineXY = [];
                $.each(squareMaybeMineXY(), function (key, val) {
                    maybeMineXY.push(JSON.stringify(val));
                });
                var noMineXY = [];
                $.each(squareNoMineXY(), function (key, val) {
                    noMineXY.push(JSON.stringify(val));
                });
                var currentXY = JSON.stringify({x: autoClickX, y: autoClickY});
                if (game.openMap[autoClickX][autoClickY] === game.squareOpen && surroundMineCount(autoClickX, autoClickY) !== game.squareOpen && surroundMineCount(autoClickX, autoClickY) === surroundFlagCount(autoClickX, autoClickY) && surroundMineCount(autoClickX, autoClickY) !== surroundCloseAndFlagCount(autoClickX, autoClickY)) {
                    $.each(surroundCloseXY(autoClickX, autoClickY), function (key, val) {
                        leftClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noOpenFlag = false;
                    break;
                } else if (game.remainMineCount === 1 && game.openMap[autoClickX][autoClickY] === game.squareClose && !maybeMineXY.includes(currentXY) && noMineXY.includes(currentXY)) {
                    leftClick(autoClickX, autoClickY);

                    autoClickX++;
                    noOpenFlag = false;
                    break;
                } else if (autoClickX + 1 < game.width && game.openMap[autoClickX][autoClickY] === game.squareOpen && game.openMap[autoClickX + 1][autoClickY] === game.squareOpen
                    && filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 1, autoClickY)).length
                    && squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY) === squareImageName(autoClickX + 1, autoClickY) - surroundFlagCount(autoClickX + 1, autoClickY)
                ) {
                    $.each(filterDifferenceXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 1, autoClickY)), function (key, val) {
                        leftClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noOpenFlag = false;
                    break;
                } else if (autoClickX + 2 < game.width && game.openMap[autoClickX][autoClickY] === game.squareOpen && game.openMap[autoClickX + 2][autoClickY] === game.squareOpen
                    && filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 2, autoClickY)).length
                    && squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY) === squareImageName(autoClickX + 2, autoClickY) - surroundFlagCount(autoClickX + 2, autoClickY)
                ) {
                    $.each(filterDifferenceXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX + 2, autoClickY)), function (key, val) {
                        leftClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noOpenFlag = false;
                    break;
                } else if (autoClickY + 1 < game.height && game.openMap[autoClickX][autoClickY] === game.squareOpen && game.openMap[autoClickX][autoClickY + 1] === game.squareOpen
                    && filterIncludeXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX, autoClickY + 1)).length
                    && (squareImageName(autoClickX, autoClickY) - surroundFlagCount(autoClickX, autoClickY)) === squareImageName(autoClickX, autoClickY + 1) - surroundFlagCount(autoClickX, autoClickY + 1)
                ) {
                    $.each(filterDifferenceXY(surroundCloseXY(autoClickX, autoClickY), surroundCloseXY(autoClickX, autoClickY + 1)), function (key, val) {
                        leftClick(val['x'], val['y']);
                    });

                    autoClickX++;
                    noOpenFlag = false;
                    break;
                } else if (game.openMap[autoClickX][autoClickY] === game.squareClose                ) {

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
function surroundXY(x, y) {
    var squareXY = [];
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (!(x === x + i && y === y + j) && 0 <= x + i && x + i < game.width && 0 <= y + j && y + j < game.height) {
                squareXY.push({
                    x: x + i,
                    y: y + j,
                    imageName: squareImageName(x + i, y + j)
                });
            }
        }
    }

    return squareXY;
}

/**
 *
 * @param x
 * @param y
 * @returns Array
 */
function surroundCloseXY(x, y) {
    var squareXY = surroundXY(x, y);
    var closeXY = [];
    $.each(squareXY, function (key, val) {
        if (val.imageName === '?') {
            closeXY.push({x: val.x, y: val.y});
        }
    });

    return closeXY;
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundOpenCount(x, y) {
    var squareXY = surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName !== '?' && val.imageName !== 'flag') {
            count++;
        }
    });

    return count;
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundCloseCount(x, y) {
    var squareXY = surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName === '?') {
            count++;
        }
    });

    return count;
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundFlagCount(x, y) {
    var squareXY = surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName === 'flag') {
            count++;
        }
    });

    return count;
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundOpenAndFlagCount(x, y) {
    var squareXY = surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName !== '?') {
            count++;
        }
    });

    return count;
}

/**
 *
 * @param x
 * @param y
 * @returns {number}
 */
function surroundCloseAndFlagCount(x, y) {
    var squareXY = surroundXY(x, y);
    var count = 0;
    $.each(squareXY, function (key, val) {
        if (val.imageName === '?' || val.imageName === 'flag') {
            count++;
        }
    });

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

/**
 * a fully includes b OR b fully includes a
 * @param a
 * @param b
 * @returns {Array}
 */
function filterIncludeXY(a, b) {
    var intersectXY = filterIntersectXY(a, b);
    var differenceXY = filterDifferenceXY(a, b);
    if (!a.length || a.length === b.length || !b.length || !intersectXY.length) {
        return [];
    }

    if (intersectXY.length != Math.min(a.length, b.length)) {
        return [];
    }

    return differenceXY;
}