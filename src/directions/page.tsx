import {APIProvider, Map, useMap, useMapsLibrary} from "@vis.gl/react-google-maps";
import {useEffect, useState} from "react";
import {Trip} from "../types/types.ts";

interface IntroProps {
    trips: Trip[];
}

export default function Intro({trips}: IntroProps) {
    const position = {
        lat: 0.520373121,
        lng: -1.287611459
    }
    return <div style={{height: "100vh", width: "100%"}}>
        <APIProvider apiKey={"AIzaSyA_rbrP-bvnNwTOiP08M_1zRKgp9oTfAAM"}>
            <Map
                center={position}
                zoom={3}
                mapId={"wewewe"}
                zoomControl={true}
                mapTypeControl={true}
            >

            </Map>
        </APIProvider>
    </div>
}

interface DirectionsProps {
    trips: Trip[];
}

function Directions({trips}: DirectionsProps) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');

    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
    const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);

    interface TripStop {
        name: string;
        lat: number;
        lon: number;
    }

    const transformStopsToLatLng = (stops: TripStop[]): google.maps.LatLngLiteral[] => {
        return stops.map(stop => ({
            lat: stop.lat,
            lng: stop.lon,
        }));
    };

    useEffect(() => {
        if (!routesLibrary || !map) return;

        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({map}));
    }, [routesLibrary, map]);

    useEffect(() => {
        if (!directionsService || !directionsRenderer) return;

        const fetchRoutes = async () => {
            for (const trip of trips) {
                const locations = transformStopsToLatLng(trip.stops);
                directionsService.route(
                    {
                        origin: locations[0],
                        destination: locations[locations.length - 1],
                        waypoints: locations.slice(1, -1).map(location => ({location, stopover: true})),
                        travelMode: google.maps.TravelMode.DRIVING,
                        provideRouteAlternatives: true,
                    },
                    (response, status) => {
                        if (status === google.maps.DirectionsStatus.OK) {
                            directionsRenderer.setDirections(response);
                            // @ts-ignore
                            setRoutes(prevRoutes => [...prevRoutes, ...response.routes]);
                        } else {
                            console.error('Error fetching directions', response);
                        }
                    }
                );
            }
        };

        fetchRoutes();
    }, [directionsService, directionsRenderer, trips]);

    console.log(routes);
    return null;
}