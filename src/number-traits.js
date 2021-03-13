module.exports = (function ()
{
    /**
     *  @param {number} n
     */
    function isPositiveZero(n)
    {
        return 1 / n === Infinity;
    }

    /**
     *  @param {number} n
     */
    function isNegativeZero(n)
    {
        return 1 / n === -Infinity;
    }

    return {
        isPositiveZero : isPositiveZero,
        isNegativeZero : isNegativeZero
    };
})();
