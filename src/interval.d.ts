declare class Interval
{
    public static disjoin(
        intervals : Interval[],
        mergePoints? : boolean,
        epsilon? : number
    ) : Interval[];

    public static merge(
        intervals : Interval[],
        minimumValue : number,
        maximumValue : number,
        epsilon? : number,
    ) : Interval[];

    public static negate(
        intervals : Interval[],
        minimumValue : number,
        maximumValue : number,
        epsilon? : number,
    ) : Interval[];

    public static findClosure(
        intervals : Interval[],
        targetIndex? : number,
        epsilon? : number,
    ) : Interval[];

    public constructor();

    public constructor(
        src : Interval
    );

    public constructor(
        position : number
    );

    public constructor(
        min : number,
        max : number
    );

    public getMinimum() : number;

    public getMaximum() : number;

    public equals(
        rhs : any
    ) : boolean;

    public compareTo(
        rhs : Interval | number
    ) : number;

    public intersectsWith(
        rhs : Interval | number
    ) : boolean;

    public contains(
        rhs : Interval | number | number[] | string
    ) : boolean;

    public negate(
        minimumValue? : number,
        maximumValue? : number,
        epsilon? : number
    ) : Interval[];

    public exclude(
        other : Interval,
        epsilon? : number
    ) : Interval[];

    public toArray() : [number, number];

    /**
     *  @override
     */
    public toString() : string;
}

export {
    Interval,
};
