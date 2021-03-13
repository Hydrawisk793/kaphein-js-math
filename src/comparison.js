module.exports = (function ()
{
    /**
     *  @param {number} l
     *  @param {number} r
     *  @param {number} [epsilon]
     */
    function relativelyEquals(l, r)
    {
        var epsilon = ("number" === typeof arguments[2] ? arguments[2] : 1e-9);

        var absLSubtractR = Math.abs(l - r);

        return absLSubtractR <= epsilon || absLSubtractR <= epsilon * Math.max(Math.abs(l), Math.abs(r));
    }

    /**
     *  @param {number} l
     *  @param {number} r
     *  @param {number} [epsilon]
     */
    function relativelyLessThan(l, r)
    {
        return !relativelyEquals(l, r, arguments[2]) && l < r;
    }

    /**
     *  @param {number} l
     *  @param {number} r
     *  @param {number} [epsilon]
     */
    function relativelyLessThanOrEqualTo(l, r)
    {
        return relativelyEquals(l, r, arguments[2]) || l < r;
    }

    /**
     *  @param {number} l
     *  @param {number} r
     *  @param {number} [epsilon]
     */
    function relativelyGreaterThan(l, r)
    {
        return !relativelyEquals(l, r, arguments[2]) && l > r;
    }

    /**
     *  @param {number} l
     *  @param {number} r
     *  @param {number} [epsilon]
     */
    function relativelyGreaterThanOrEqualTo(l, r)
    {
        return relativelyEquals(l, r, arguments[2]) || l > r;
    }

    return {
        relativelyEquals : relativelyEquals,
        relativelyLessThan : relativelyLessThan,
        relativelyLessThanOrEqualTo : relativelyLessThanOrEqualTo,
        relativelyGreaterThan : relativelyGreaterThan,
        relativelyGreaterThanOrEqualTo : relativelyGreaterThanOrEqualTo
    };
})();
