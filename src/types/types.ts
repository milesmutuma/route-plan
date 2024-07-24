export interface TripStop {
    name: string;
    lat: number;
    lon: number;
}

export interface Trip {
    stops: TripStop[];
    vehicle: string;
    territory: string;
    countryCode: string;
    tripValue: number;
    vehicleCost: number;
    distanceCovered: number;
    code: number
}