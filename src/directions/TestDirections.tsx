import React, {useEffect, useRef, useState} from 'react';
import {GoogleMap, useJsApiLoader, DirectionsRenderer, Marker} from '@react-google-maps/api';
import {Trip} from "../types/types.ts";

interface MapComponentProps {
    trips: Trip[];
}

const generateColors = (numColors: number): string[] => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 360) / numColors;
        colors.push(`hsl(${hue}, 100%, 50%)`);
    }
    return colors;
};

const MapComponent: React.FC<MapComponentProps> = ({trips}) => {
    const {isLoaded} = useJsApiLoader({
        googleMapsApiKey: 'AIzaSyA_rbrP-bvnNwTOiP08M_1zRKgp9oTfAAM',
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const directionsRendererRefs = useRef<google.maps.DirectionsRenderer[]>([]);
    const [selectedTripIndex, setSelectedTripIndex] = useState<number | null>(null);

    const colors = generateColors(trips.length); // Generate dynamic colors based on the number of trips

    useEffect(() => {
        if (isLoaded && mapRef.current && selectedTripIndex !== null) {
            directionsRendererRefs.current.forEach(renderer => renderer.setMap(null)); // Clear previous renderers
            directionsRendererRefs.current = [];

            const trip = trips[selectedTripIndex];
            const numberOfRoutes = Math.ceil(trip.stops.length / 24);
            directionsRendererRefs.current = Array.from({length: numberOfRoutes}, () => {
                const renderer = new google.maps.DirectionsRenderer({
                    polylineOptions: {
                        strokeColor: colors[selectedTripIndex], // Use the dynamic color for each trip
                        strokeWeight: 5,
                    },
                });
                renderer.setMap(mapRef.current);
                return renderer;
            });

            if (trip.stops.length <= 25) {
                // Handle trips with 25 or fewer stops
                const directionsService = new google.maps.DirectionsService();
                const routeRequest = {
                    origin: new google.maps.LatLng(trip.stops[0].lat, trip.stops[0].lon),
                    destination: new google.maps.LatLng(trip.stops[trip.stops.length - 1].lat, trip.stops[trip.stops.length - 1].lon),
                    travelMode: google.maps.TravelMode.DRIVING,
                    waypoints: trip.stops.slice(1, -1).map(stop => ({
                        location: new google.maps.LatLng(stop.lat, stop.lon),
                        stopover: true,
                    })),
                };

                directionsService.route(routeRequest, (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        if (directionsRendererRefs.current[0]) {
                            directionsRendererRefs.current[0].setDirections(result);
                        }
                    } else {
                        console.error(`Error fetching directions for trip ${selectedTripIndex + 1}: ${status}`);
                    }
                });
            } else {
                // Handle trips with more than 25 stops
                for (let routeIndex = 0; routeIndex < numberOfRoutes; routeIndex++) {
                    const start = routeIndex * 24;
                    const end = Math.min(start + 24, trip.stops.length - 1);
                    const waypoints = trip.stops.slice(start + 1, end).map(stop => ({
                        location: new google.maps.LatLng(stop.lat, stop.lon),
                        stopover: true,
                    }));

                    const directionsService = new google.maps.DirectionsService();
                    const routeRequest = {
                        origin: new google.maps.LatLng(trip.stops[start].lat, trip.stops[start].lon),
                        destination: new google.maps.LatLng(trip.stops[end].lat, trip.stops[end].lon),
                        travelMode: google.maps.TravelMode.DRIVING,
                        waypoints: waypoints,
                    };

                    directionsService.route(routeRequest, (result, status) => {
                        if (status === google.maps.DirectionsStatus.OK) {
                            if (directionsRendererRefs.current[routeIndex]) {
                                directionsRendererRefs.current[routeIndex].setDirections(result);
                            }
                        } else {
                            console.error(`Error fetching directions for route ${routeIndex + 1} of trip ${selectedTripIndex + 1}: ${status}`);
                        }
                    });
                }
            }
        }
    }, [isLoaded, selectedTripIndex, trips, colors]);

    if (!isLoaded) return <div>Loading...</div>;

    return (
        <div style={{display: 'flex'}}>
            <div style={{width: '20%', padding: '10px'}}>
                <h3>Trips List</h3>
                <ul>
                    {trips.map((trip, index) => (
                        <li key={index} style={{cursor: 'pointer', color: colors[index]}}
                            onClick={() => setSelectedTripIndex(index)}>
                            {trip.code}
                        </li>
                    ))}
                </ul>
            </div>
            <div style={{height: '1000px', width: '90%'}}>
                <div>
                    <h3>Trip Info</h3>
                    {selectedTripIndex !== null && (
                        <div style={{display: 'flex', flexDirection: 'column', flexWrap: 'wrap', height: '150px'}}>
                            <div style={{flex: 1}}>
                                <p>Vehicle: {trips[selectedTripIndex].vehicle}</p>
                                <p>Territory: {trips[selectedTripIndex].territory}</p>
                                <p>Country Code: {trips[selectedTripIndex].countryCode}</p>
                                <p>Trip Value: {trips[selectedTripIndex].tripValue}</p>
                            </div>
                            <div style={{flex: 1}}>
                                <p>Vehicle Cost: {trips[selectedTripIndex].vehicleCost}</p>
                                <p>Distance Covered: {trips[selectedTripIndex].distanceCovered}</p>
                                <p>Code: {trips[selectedTripIndex].code}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div style={{height: '1000px', width: '90%'}}>
                    <GoogleMap
                        mapContainerStyle={{height: '100%', width: '100%'}}
                        center={{lat: 0.520373121, lng: -1.287611459}}
                        zoom={8}
                        onLoad={map => (mapRef.current = map)}
                    >
                        {selectedTripIndex !== null && (
                            <>
                                <Marker
                                    position={{
                                        lat: trips[selectedTripIndex].stops[0].lat,
                                        lng: trips[selectedTripIndex].stops[0].lon
                                    }}
                                    icon={{
                                        path: google.maps.SymbolPath.CIRCLE,
                                        scale: 20,
                                        fillColor: 'green',
                                        fillOpacity: 1,
                                        strokeWeight: 1,
                                    }}
                                />
                                {trips[selectedTripIndex].stops.slice(1).map((stop, index) => (
                                    <Marker
                                        key={index}
                                        position={{lat: stop.lat, lng: stop.lon}}
                                        label={"Stop " + index}
                                        icon={{
                                            path: google.maps.SymbolPath.CIRCLE,
                                            scale: 7,
                                            fillColor: colors[selectedTripIndex],
                                            fillOpacity: 1,
                                            strokeWeight: 1,
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </GoogleMap>
                </div>
            </div>

        </div>
    );
};

export default React.memo(MapComponent);
