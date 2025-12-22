import React, { useEffect, useRef, useState, useCallback } from 'react';
import './RouteWithDetour.css';

const GOOGLE_API_KEY = 'AIzaSyDnWINn8Mh5rx7KvlIgIZA37c0DQo9eimk';

function RouteWithDetour({
  origin,
  destination,
  pickupLocation, // Passenger's pickup location
  height = '400px'
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [detourInfo, setDetourInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getLatLng = useCallback(async (location) => {
    if (!location) return null;
    
    if (typeof location === 'object' && location.lat != null && location.lng != null) {
      return { lat: location.lat, lng: location.lng };
    }
    
    const address = typeof location === 'string' ? location : (location.address || location);
    if (!address || address.trim() === '') return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=il&language=he&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng: lng };
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
    return null;
  }, []);

  const formatDuration = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} שעות ${minutes} דקות`;
    }
    return `${minutes} דקות`;
  }, []);

  const calculateStraightDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1.4; // Factor for road distance
  }, []);

  const calculateFallbackRoute = useCallback((originCoords, destCoords, pickupCoords) => {
    if (!mapInstanceRef.current) return;

    setIsLoading(false);

    // Calculate original route distance
    const originalDistance = calculateStraightDistance(
      originCoords.lat, originCoords.lng,
      destCoords.lat, destCoords.lng
    );
    const originalDuration = (originalDistance / 60) * 60; // Rough estimate: 60 km/h average

    setRouteInfo({
      distance: originalDistance.toFixed(1),
      duration: originalDuration
    });

    // Draw original route
    const originalLine = new window.google.maps.Polyline({
      path: [
        new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
        new window.google.maps.LatLng(destCoords.lat, destCoords.lng)
      ],
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.6,
      strokeWeight: 4
    });
    originalLine.setMap(mapInstanceRef.current);

    // Add origin and destination markers
    new window.google.maps.Marker({
      position: originCoords,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#22c55e',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      title: 'נקודת התחלה'
    });

    new window.google.maps.Marker({
      position: destCoords,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      title: 'יעד'
    });

    // If pickup location exists, calculate detour
    if (pickupCoords) {
      const detourDistance = calculateStraightDistance(
        originCoords.lat, originCoords.lng,
        pickupCoords.lat, pickupCoords.lng
      ) + calculateStraightDistance(
        pickupCoords.lat, pickupCoords.lng,
        destCoords.lat, destCoords.lng
      );
      const detourDuration = (detourDistance / 60) * 60;
      const additionalDistance = detourDistance - originalDistance;
      const additionalDuration = detourDuration - originalDuration;

      setDetourInfo({
        distance: detourDistance.toFixed(1),
        duration: detourDuration,
        additionalDistance: additionalDistance.toFixed(1),
        additionalDuration: additionalDuration
      });

      // Draw detour route
      const detourLine = new window.google.maps.Polyline({
        path: [
          new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
          new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng),
          new window.google.maps.LatLng(destCoords.lat, destCoords.lng)
        ],
        geodesic: true,
        strokeColor: '#f59e0b',
        strokeOpacity: 0.8,
        strokeWeight: 5
      });
      detourLine.setMap(mapInstanceRef.current);

      // Add pickup marker
      new window.google.maps.Marker({
        position: pickupCoords,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
        title: 'מיקום איסוף נוסע',
        zIndex: 10
      });
    }

    // Fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(originCoords);
    bounds.extend(destCoords);
    if (pickupCoords) bounds.extend(pickupCoords);
    mapInstanceRef.current.fitBounds(bounds);
  }, [calculateStraightDistance]);

  // Calculate routes
  const calculateRoutes = useCallback(async () => {
    if (!window.google || !mapRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const originCoords = await getLatLng(origin);
      const destCoords = await getLatLng(destination);
      const pickupCoords = pickupLocation ? await getLatLng(pickupLocation) : null;

      if (!originCoords || !destCoords) {
        setError('לא ניתן למצוא את המיקומים');
        setIsLoading(false);
        return;
      }

      // Initialize map
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: originCoords,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      // If Directions API is not available, use fallback
      const useFallback = !window.google.maps.DirectionsService;
      
      if (useFallback) {
        console.warn('Directions API not available, using fallback calculation');
        // Use fallback calculation
        calculateFallbackRoute(originCoords, destCoords, pickupCoords);
        return;
      }

      const directionsService = new window.google.maps.DirectionsService();

      // Calculate original route
      directionsService.route({
        origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
        destination: new window.google.maps.LatLng(destCoords.lat, destCoords.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'il'
      }, async (originalResult, originalStatus) => {
        if (originalStatus !== 'OK' || !originalResult.routes || originalResult.routes.length === 0) {
          setError('לא ניתן לחשב את המסלול המקורי');
          setIsLoading(false);
          return;
        }

        const originalRoute = originalResult.routes[0];
        let originalDistance = 0;
        let originalDuration = 0;
        originalRoute.legs.forEach(leg => {
          originalDistance += leg.distance.value;
          originalDuration += leg.duration.value;
        });

        setRouteInfo({
          distance: (originalDistance / 1000).toFixed(1),
          duration: originalDuration
        });

        // If pickup location is provided, calculate detour route
        if (pickupCoords) {
          // Calculate route: origin -> pickup -> destination
          directionsService.route({
            origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
            destination: new window.google.maps.LatLng(destCoords.lat, destCoords.lng),
            waypoints: [{
              location: new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng),
              stopover: true
            }],
            travelMode: window.google.maps.TravelMode.DRIVING,
            region: 'il',
            optimizeWaypoints: false
          }, (detourResult, detourStatus) => {
            setIsLoading(false);

            // If REQUEST_DENIED or other error, use fallback
            if (detourStatus === 'REQUEST_DENIED' || (detourStatus !== 'OK')) {
              console.warn('Directions API error:', detourStatus, 'Using fallback calculation');
              calculateFallbackRoute(originCoords, destCoords, pickupCoords);
              return;
            }

            if (detourStatus === 'OK' && detourResult.routes && detourResult.routes.length > 0) {
              const detourRoute = detourResult.routes[0];
              let detourDistance = 0;
              let detourDuration = 0;
              detourRoute.legs.forEach(leg => {
                detourDistance += leg.distance.value;
                detourDuration += leg.duration.value;
              });

              const additionalDistance = detourDistance - originalDistance;
              const additionalDuration = detourDuration - originalDuration;

              setDetourInfo({
                distance: (detourDistance / 1000).toFixed(1),
                duration: detourDuration,
                additionalDistance: (additionalDistance / 1000).toFixed(1),
                additionalDuration: additionalDuration
              });

              // Render detour route
              if (!directionsRendererRef.current) {
                directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
                  map: mapInstanceRef.current,
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: '#f59e0b',
                    strokeWeight: 5,
                    strokeOpacity: 0.8
                  }
                });
              }

              directionsRendererRef.current.setDirections(detourResult);

              // Add pickup marker
              new window.google.maps.Marker({
                position: pickupCoords,
                map: mapInstanceRef.current,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#f59e0b',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 3,
                },
                title: 'מיקום איסוף נוסע',
                zIndex: 10
              });
            } else {
              // Fallback: show original route with pickup marker
              if (!directionsRendererRef.current) {
                directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
                  map: mapInstanceRef.current,
                  suppressMarkers: false
                });
              }
              directionsRendererRef.current.setDirections(originalResult);

              new window.google.maps.Marker({
                position: pickupCoords,
                map: mapInstanceRef.current,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#f59e0b',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 3,
                },
                title: 'מיקום איסוף נוסע'
              });

              // Calculate straight-line detour estimate
              const straightDistance = calculateStraightDistance(
                originCoords.lat, originCoords.lng,
                pickupCoords.lat, pickupCoords.lng
              ) + calculateStraightDistance(
                pickupCoords.lat, pickupCoords.lng,
                destCoords.lat, destCoords.lng
              ) - (originalDistance / 1000);

              setDetourInfo({
                distance: ((originalDistance / 1000) + straightDistance).toFixed(1),
                duration: originalDuration + (straightDistance * 60), // Rough estimate
                additionalDistance: straightDistance.toFixed(1),
                additionalDuration: straightDistance * 60
              });
            }
          });
        } else {
          // No pickup location, just show original route
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
              map: mapInstanceRef.current,
              suppressMarkers: false
            });
          }
          directionsRendererRef.current.setDirections(originalResult);
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error('Route calculation error:', err);
      setError('שגיאה בחישוב המסלול');
      setIsLoading(false);
    }
  }, [origin, destination, pickupLocation, getLatLng, formatDuration, calculateFallbackRoute, calculateStraightDistance]);

  useEffect(() => {
    if (!window.google) {
      const checkInterval = setInterval(() => {
        if (window.google) {
          clearInterval(checkInterval);
          calculateRoutes();
        }
      }, 500);
      return () => clearInterval(checkInterval);
    } else {
      calculateRoutes();
    }
  }, [calculateRoutes]);

  return (
    <div className="route-with-detour-container">
      <div 
        ref={mapRef} 
        className="route-with-detour-map" 
        style={{ height }}
      >
        {isLoading && (
          <div className="map-loading">
            <div className="map-spinner"></div>
            <span>טוען מפה...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="route-with-detour-error">
          ⚠️ {error}
        </div>
      )}

      {(routeInfo || detourInfo) && (
        <div className="route-with-detour-info">
          {routeInfo && (
            <div className="route-original">
              <h4>מסלול מקורי</h4>
              <div className="route-stats">
                <div className="route-stat">
                  <span className="stat-icon">🚗</span>
                  <span className="stat-value">{routeInfo.distance} ק"מ</span>
                </div>
                <div className="route-stat">
                  <span className="stat-icon">⏱️</span>
                  <span className="stat-value">{formatDuration(routeInfo.duration)}</span>
                </div>
              </div>
            </div>
          )}

          {detourInfo && (
            <div className="route-detour">
              <h4>מסלול עם סטייה</h4>
              <div className="route-stats">
                <div className="route-stat">
                  <span className="stat-icon">🚗</span>
                  <span className="stat-value">{detourInfo.distance} ק"מ</span>
                </div>
                <div className="route-stat">
                  <span className="stat-icon">⏱️</span>
                  <span className="stat-value">{formatDuration(detourInfo.duration)}</span>
                </div>
              </div>
              
              {detourInfo.additionalDistance && parseFloat(detourInfo.additionalDistance) > 0 && (
                <div className="detour-additional">
                  <div className="additional-stat">
                    <span className="additional-label">נוסף:</span>
                    <span className="additional-value">+{detourInfo.additionalDistance} ק"מ</span>
                  </div>
                  <div className="additional-stat">
                    <span className="additional-label">זמן נוסף:</span>
                    <span className="additional-value">+{formatDuration(detourInfo.additionalDuration)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RouteWithDetour;

