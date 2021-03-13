var isUndefined = require("kaphein-js").isUndefined;
var isString = require("kaphein-js").isString;
var isNumber = require("kaphein-js").isNumber;

var comparsion = require("./comparison");
var relativelyEquals = comparsion.relativelyEquals;
var relativelyGreaterThanOrEqualTo = comparsion.relativelyGreaterThanOrEqualTo;
var relativelyLessThanOrEqualTo = comparsion.relativelyLessThanOrEqualTo;
var relativelyLessThan = comparsion.relativelyLessThan;

var Interval = (function ()
{
    var _epsilon = 1e-6;
    var _minInt = Number.MIN_SAFE_INTEGER;
    var _maxInt = Number.MAX_SAFE_INTEGER;

    /**
     *  @constructor
     *  @param {Interval|number|number[]} value1
     *  @param {number} [value2]
     */
    function Interval(value1)
    {
        switch(arguments.length)
        {
        case 0:
            throw new TypeError("At least one number or an Interval instance must be passed.");
        // break;
        case 1:
            if(value1 instanceof Interval)
            {
                this._min = value1._min;
                this._max = value1._max;
            }
            else if(isNumber(value1))
            {
                this._min = this._max = value1;
            }
            else if(Array.isArray(value1) && value1.length >= 2)
            {
                if(relativelyLessThan(value1[1], value1[0]))
                {
                    throw new RangeError("'max' must be greater than or equal to 'min'.");
                }

                this._min = value1[0];
                this._max = value1[1];
            }
            else
            {
                throw new TypeError("The parameter must be either an Interval instance, number or an array of two numbers.");
            }
            break;
        case 2:
            var value2 = arguments[1];

            if(!isNumber(value1) || !isNumber(value2))
            {
                throw new TypeError("Both 'value1' and 'value2' must be numbers.");
            }

            if(value1 < value2)
            {
                this._min = value1;
                this._max = value2;
            }
            else
            {
                this._min = value2;
                this._max = value1;
            }
            break;
        default:
            throw new Error("An unknown combination of arguments.");
        }
    }

    /**
     *  @param {Interval[]} intervals
     *  @param {boolean} [mergePoints]
     *  @param {number} [epsilon]
     *  @returns {Interval[]}
     */
    Interval.disjoin = function (intervals)
    {
        var disjoinedIntervals = [];

        switch(intervals.length)
        {
        case 0:
            // Does nothing.
            break;
        case 1:
            disjoinedIntervals.push(new Interval(intervals[0]._min, intervals[0]._max));
            break;
        default:
            var j = 0, sortedPointMaxIndex = 0, endOfClosureIndex = 0;
            var neighbor = null;
            var sortedPoints = [];
            var sortedListSet = _createSortedIntervalListSet(intervals, arguments[2]);
            for(var i = 0, len = sortedListSet.length; i < len; )
            {
                j = 0;

                endOfClosureIndex = _findEndOfClosureIndex(sortedListSet, i);
                sortedPoints.length = 0;
                for(j = i; j < endOfClosureIndex; ++j)
                {
                    neighbor = sortedListSet[j];
                    _insertIfNotExistAndSort(
                        sortedPoints,
                        neighbor._min
                    );
                    _insertIfNotExistAndSort(
                        sortedPoints,
                        neighbor._max
                    );
                }

                sortedPointMaxIndex = sortedPoints.length - 1;
                if(arguments[1])
                {
                    disjoinedIntervals.push(new Interval(sortedPoints[0], sortedPoints[sortedPointMaxIndex]));
                }
                else
                {
                    if(disjoinedIntervals.length < 2)
                    {
                        if(sortedPointMaxIndex > 0)
                        {
                            throw new Error("What the hell???");
                        }

                        disjoinedIntervals.push(new Interval(sortedPoints[0], sortedPoints[0]));
                    }
                    else
                    {
                        //TODO : 안전성 검사(e.g. Interval이 1개인 경우)
                        j = 0;
                        do
                        {
                            disjoinedIntervals.push(new Interval(sortedPoints[j], sortedPoints[j + 1]));
                            ++j;
                        }
                        while(j < sortedPointMaxIndex);
                    }
                }

                i = endOfClosureIndex;
            }
        }

        return disjoinedIntervals;
    }

    /**
     *  @param {Interval[]} intervals
     *  @param {number} [minimumValue]
     *  @param {number} [maximumValue]
     *  @param {number} [epsilon]
     *  @returns {Interval[]}
     */
    Interval.merge = function (intervals)
    {
        var epsilon = isNumber(arguments[3]) ? arguments[3] : _epsilon;

        var min = arguments[1];
        if(isUndefined(min))
        {
            min = Number.MIN_VALUE;
        }
        else if(!isNumber(min))
        {
            throw new TypeError("'minimumValue' must be a number.");
        }

        var max = arguments[2];
        if(isUndefined(max))
        {
            max = Number.MIN_VALUE;
        }
        else if(!isNumber(max))
        {
            throw new TypeError("'maximumValue' must be a number.");
        }
        else if(relativelyLessThan(max, min, epsilon))
        {
            throw new RangeError(
                "'maximumValue'"
                + " cannot be less than "
                + "'minimumValue'."
            );
        }

        var disjoined = Interval.disjoin(intervals, true, epsilon);

        // TODO : Verify that this function works as expected.
        for(var i = 0, j = 1; j < disjoined.length; ++i, ++j)
        {
            if(relativelyEquals(disjoined[i]._max, disjoined[j]._min, _epsilon))
            {
                throw new Error(
                    "'Interval.merge' method"
                    + " does wrong behaviour."
                    + " It doesn't merge intervals well."
                );
            }
        }

        return disjoined;
    }

    /**
     *  @param {Interval[]} intervals
     *  @param {number} [minimumValue]
     *  @param {number} [maximumValue]
     *  @param {number} [epsilon]
     *  @returns {Interval[]}
     */
    Interval.negate = function (intervals)
    {
        var min = 0;
        var max = 0;

        var negatedIntervals = [];

        //Must be sorted in lowest minimum value order.
        var epsilon = isNumber(arguments[3]) ? arguments[3] : _epsilon;
        var disjoinedIntervals = Interval.disjoin(intervals, true, epsilon);
        var intervalCount = disjoinedIntervals.length;
        var i, j = 0;

        if(intervalCount > 0)
        {
            min = disjoinedIntervals[j]._min;
            if(Number.isSafeInteger(min))
            {
                negatedIntervals.push(new Interval(
                    Number.isSafeInteger(arguments[1]) ? arguments[1] : Number.MIN_SAFE_INTEGER,
                    min - 1
                ));
            }
            else
            {
                negatedIntervals.push(new Interval(
                    isNumber(arguments[1]) ? arguments[1] : -Number.MAX_VALUE,
                    min - epsilon
                ));
            }

            i = 0;
            ++j;
        }

        for(; j < intervalCount; ++j, ++i)
        {
            max = disjoinedIntervals[i]._max;
            min = disjoinedIntervals[j]._min;
            negatedIntervals.push(new Interval(
                max + (Number.isSafeInteger(max) ? 1 : epsilon),
                min - (Number.isSafeInteger(min) ? 1 : epsilon)
            ));
        }

        if(i < intervalCount)
        {
            max = disjoinedIntervals[i]._max;
            if(Number.isSafeInteger(max))
            {
                negatedIntervals.push(new Interval(
                    max + 1,
                    Number.isSafeInteger(arguments[2]) ? arguments[2] : Number.MAX_SAFE_INTEGER
                ));
            }
            else
            {
                negatedIntervals.push(new Interval(
                    max + epsilon,
                    isNumber(arguments[2]) ? arguments[2] : Number.MAX_VALUE
                ));
            }
        }

        return negatedIntervals;
    }

    /**
     *  @param {Interval[]} intervals
     *  @param {number} [targetIndex]
     *  @param {number} [epsilon]
     *  @returns {Interval[]}
     */
    Interval.findClosure = function (intervals)
    {
        var i;

        var sortedListSet = _createSortedIntervalListSet(intervals, arguments[2]);

        var targetIndex = (isUndefined(arguments[1]) ? 0 : arguments[1]);
        var len = sortedListSet.length;
        var visitFlags = [];
        for(i = 0; i < len; ++i)
        {
            visitFlags.push(false);
        }

        var closureStartIndex = targetIndex;
        var closureInclusiveEndIndex = targetIndex;
        var targetIndices = [targetIndex];
        for(; targetIndices.length > 0; )
        {
            i = targetIndices.pop();
            if(!visitFlags[i])
            {
                visitFlags[i] = true;

                var lhs = sortedListSet[i];
                for(var j = 0; j < len; ++j)
                {
                    if(j !== i && lhs.intersectsWith(sortedListSet[j]))
                    {
                        targetIndices.push(j);

                        closureStartIndex = (closureStartIndex > j ? j : closureStartIndex);
                        closureInclusiveEndIndex = (closureInclusiveEndIndex < j ? j : closureInclusiveEndIndex);
                    }
                }
            }
        }

        var closure = [];
        for(i = closureStartIndex; i <= closureInclusiveEndIndex; ++i)
        {
            closure.push(sortedListSet[i]);
        }

        return closure;
    }

    Interval.prototype = /** @memberof Interval */({
        constructor : Interval,

        /**
         *  @returns {number}
         */
        getMinimum : function getMinimum()
        {
            return this._min;
        },

        /**
         *  @returns {number}
         */
        getMaximum : function getMaximum()
        {
            return this._max;
        },

        /**
         *  @param {Interval|number} rhs
         *  @param {number} [epsilon]
         */
        equals : function equals(rhs)
        {
            var result = this === rhs;

            if(!result)
            {
                var epsilon = isNumber(arguments[1]) ? arguments[1] : _epsilon;

                if(rhs instanceof Interval)
                {
                    result = relativelyEquals(this._min, rhs._min, epsilon)
                        && relativelyEquals(this._max, rhs._max, epsilon)
                    ;
                }
                else if(isNumber(rhs))
                {
                    result = relativelyEquals(this._min, this._max, epsilon)
                        && relativelyEquals(this._min, rhs, epsilon)
                    ;
                }
            }

            return result;
        },

        /**
         *  @param {Interval|number} rhs
         *  @param {number} [epsilon]
         */
        compareTo : function compareTo(rhs)
        {
            var epsilon = isNumber(arguments[1]) ? arguments[1] : _epsilon;

            var result = -1;
            if(this.equals(rhs, epsilon))
            {
                result = 0;
            }
            else
            {
                var target = _coerceArgumentToInterval(rhs);
                var diff = this._min - target._min;

                result = (
                    relativelyEquals(diff, 0, epsilon)
                        ? 0
                        : diff
                );
            }

            return result;
        },

        /**
         *  @param {Interval|number} rhs
         *  @param {number} [epsilon]
         */
        intersectsWith : function intersectsWith(rhs)
        {
            var epsilon = isNumber(arguments[1]) ? arguments[1] : _epsilon;

            var result = false;
            var target = _coerceArgumentToInterval(rhs);
            if(relativelyLessThan(this._min, target._min, epsilon))
            {
                result = relativelyGreaterThanOrEqualTo(this._max, target._min, epsilon) && relativelyGreaterThanOrEqualTo(target._max, this._min, epsilon);
            }
            else
            {
                result = relativelyGreaterThanOrEqualTo(target._max, this._min, epsilon) && relativelyGreaterThanOrEqualTo(this._max, target._min, epsilon);
            }

            return result;
        },

        /**
         *  @param {Interval|number|number[]|string} rhs
         *  @param {number} [epsilon]
         */
        contains : function contains(rhs)
        {
            var epsilon = isNumber(arguments[1]) ? arguments[1] : _epsilon;

            var i;
            var len;

            var result = true;

            if(rhs instanceof Interval)
            {
                result = relativelyGreaterThanOrEqualTo(rhs._min, this._min, epsilon)
                    && relativelyLessThanOrEqualTo(rhs._max, this._max, epsilon)
                ;
            }
            else if(isNumber(rhs))
            {
                result = Interval_isValueInInterval(this, rhs, epsilon);
            }
            else if(Array.isArray(rhs))
            {
                for(i = 0, len = rhs.length; result && i < len; ++i)
                {
                    result = this.contains(rhs[i], epsilon);
                }
            }
            else if(isString(rhs))
            {
                for(i = 0; result && i < rhs.length; ++i)
                {
                    result = Interval_isValueInInterval(this, rhs.charCodeAt(i), epsilon);
                }
            }
            else
            {
                throw new TypeError("The parameter must be either an Interval instance, an array, a string or a number.");
            }

            return result;
        },

        /**
         *  @param {number} [minimumValue]
         *  @param {number} [maximumValue]
         *  @param {number} [epsilon]
         *  @returns {Interval[]}
         */
        negate : function negate()
        {
            var epsilon = isNumber(arguments[2]) ? arguments[2] : _epsilon;

            var negatedIntervals = [];

            if(Number.isSafeInteger(this._min))
            {
                negatedIntervals.push(new Interval(
                    Number.isSafeInteger(arguments[0]) ? arguments[0] : _minInt,
                    this._min - 1
                ));
            }
            else
            {
                negatedIntervals.push(new Interval(
                    isNumber(arguments[0]) ? arguments[0] : -Number.MAX_VALUE,
                    this._min - epsilon
                ));
            }

            if(Number.isSafeInteger(this._max))
            {
                negatedIntervals.push(new Interval(
                    Number.isSafeInteger(arguments[1]) ? arguments[1] : _maxInt,
                    this._max + 1
                ));
            }
            else
            {
                negatedIntervals.push(new Interval(
                    isNumber(arguments[1]) ? arguments[1] : Number.MAX_VALUE,
                    this._max + epsilon
                ));
            }

            return negatedIntervals;
        },

        /**
         *  @param {Interval} other
         *  @param {number} [epsilon]
         */
        exclude : function exclude(other)
        {
            if(!(other instanceof Interval))
            {
                throw new TypeError("'other' must be an instance of 'Interval'.");
            }

            var epsilon = isNumber(arguments[1]) ? arguments[1] : _epsilon;

            var disjoinedIntevals = Interval.disjoin([this, other], false, epsilon);
            var results = [];

            for(var i = 0; i < disjoinedIntevals.length; ++i)
            {
                var interval = disjoinedIntevals[i];
                if(!other.contains(interval, epsilon))
                {
                    results.push(interval);
                }
            }

            return results;
        },

        /**
         *  @return {[number, number]}
         */
        toArray : function toArray()
        {
            return [this._min, this._max];
        },

        /**
         *  @returns {string}
         */
        toString : function toString()
        {
            return "["
                + _intToString(this._min)
                + ","
                + _intToString(this._max)
                + "]"
            ;
        }
    });

    /**
     *  @param {Interval} thisRef
     *  @param {number} value
     *  @param {number} [epsilon]
     */
    function Interval_isValueInInterval(thisRef, value)
    {
        var epsilon = isNumber(arguments[2]) ? arguments[2] : _epsilon;

        return (
            relativelyGreaterThanOrEqualTo(value, thisRef._min, epsilon)
            && relativelyLessThanOrEqualTo(value, thisRef._max, epsilon)
        );
    }

    /**
     *  @param {*} o
     */
    function _assertIsInterval(o)
    {
        if(!(o instanceof Interval))
        {
            throw new TypeError("The parameter must be an instance of Interval.");
        }
    }

    function _defaultComparer(lhs, rhs)
    {
        return lhs - rhs;
    }

    /**
     *  @param {Interval[]} sortedArray
     *  @param {Interval} o
     *  @param {Function} comparer
     *  @param {Object} [thisArg]
     *  @returns {boolean}
     */
    function _insertIfNotExistAndSort(sortedArray, o, comparer)
    {
        var thisArg = arguments[3];
        comparer = "function" === typeof comparer ? comparer : _defaultComparer;

        var len = sortedArray.length;
        var result = true;
        if(len < 1)
        {
            sortedArray.push(o);
        }
        else
        {
            var loop = true;
            for(var i = 0; loop && i < len; )
            {
                var cp = comparer.call(thisArg, sortedArray[i], o);
                if(cp === 0)
                {
                    result = false;
                    loop = false;
                }
                else if(cp > 0)
                {
                    sortedArray.splice(i, 0, o);
                    loop = false;
                }
                else
                {
                    ++i;
                }
            }

            if(loop)
            {
                sortedArray.push(o);
            }
        }

        return result;
    }

    /**
     *  @param {Interval} l
     *  @param {Interval} r
     *  @returns {number}
     */
    function _intervalComparerForSort(l, r)
    {
        var diff = l._min - r._min;
        if(relativelyEquals(diff, 0, this.epsilon))
        {
            return (l.equals(r) ? 0 : -1);
        }

        return diff;
    }

    /**
     *  @param {Interval[]} intervals
     *  @param {number} [epsilon]
     */
    function _createSortedIntervalListSet(intervals)
    {
        var comparerParams = {
            epsilon : (isNumber(arguments[1]) ? arguments[1] : _epsilon)
        };
        /**  @type {Interval[]} */var sortedIntervals = [];
        for(var i = 0, len = intervals.length; i < len; ++i)
        {
            _insertIfNotExistAndSort(
                sortedIntervals,
                intervals[i],
                _intervalComparerForSort,
                comparerParams
            );
        }

        return sortedIntervals;
    }

    /**
     *  @param {Interval|number} o
     */
    function _coerceArgumentToInterval(o)
    {
        var result = o;
        if(isNumber(o))
        {
            result = new Interval(o, o);
        }

        _assertIsInterval(result);

        return result;
    }

    /**
     *  @param {Interval[]} sortedListSet
     *  @param {number} startIndex
     *  @returns {number}
     */
    function _findEndOfClosureIndex(sortedListSet, startIndex)
    {
        var endOfClosureIndex = startIndex + 1;
        for(
            var i = startIndex, len = sortedListSet.length;
            i < endOfClosureIndex && i < len;
            ++i
        )
        {
            var current = sortedListSet[i];

            var loopJ = true;
            var endOfNeighborIndex = i + 1;
            for(var j = endOfNeighborIndex; loopJ && j < len; )
            {
                var other = sortedListSet[j];

                if(current._max < other._min)
                {
                    endOfNeighborIndex = j;
                    loopJ = false;
                }
                else
                {
                    ++j;
                }
            }
            if(loopJ)
            {
                endOfNeighborIndex = len;
            }

            endOfClosureIndex = (
                endOfClosureIndex < endOfNeighborIndex
                    ? endOfNeighborIndex
                    : endOfClosureIndex
            );
        }

        return endOfClosureIndex;
    }

    /**
     *  @param {number} v
     */
    function _intToString(v)
    {
        var str = "";

        if(v === _maxInt)
        {
            str = "INT_MAX";
        }
        else if(v === _minInt)
        {
            str = "INT_MIN";
        }
        else
        {
            str = v.toString();
        }

        return str;
    }

    return Interval;
})();

module.exports = {
    Interval : Interval
};
