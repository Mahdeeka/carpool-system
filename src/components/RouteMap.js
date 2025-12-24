import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './RouteMap.css';

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function RouteMap({ 
  origin,           // { address, lat, lng } or just address string
  destination,      // { address, lat, lng } or just address string
  waypoints = [],   // Array of { address, lat, lng } or address strings
  showDirections = true,
  height = '300px',
  onRouteCalculated
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const mapReadyRef = useRef(false);

  // Serialize locations so effects only rerun when values actually change
  const originKey = useMemo(() => {
    if (!origin) return '';
    if (typeof origin === 'string') return origin;
    return `${origin.lat || ''},${origin.lng || ''}|${origin.address || ''}`;
  }, [origin]);

  const destinationKey = useMemo(() => {
    if (!destination) return '';
    if (typeof destination === 'string') return destination;
    return `${destination.lat || ''},${destination.lng || ''}|${destination.address || ''}`;
  }, [destination]);

  const waypointsKey = useMemo(() => {
    if (!waypoints || waypoints.length === 0) return '';
    return waypoints.map(wp => {
      if (typeof wp === 'string') return wp;
      return `${wp.lat || ''},${wp.lng || ''}|${wp.address || ''}`;
    }).join(';');
  }, [waypoints]);

  // Track mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Cleanup markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    markersRef.current = [];
  }, []);

  const getLatLng = useCallback(async (location) => {
    if (!location) return null;
    
    // If already has lat/lng
    if (typeof location === 'object' && location.lat != null && location.lng != null) {
      return new window.google.maps.LatLng(location.lat, location.lng);
    }
    
    // Geocode the address
    const address = typeof location === 'string' ? location : (location.address || location);
    if (!address || address.trim() === '') return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=il&language=he&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return new window.google.maps.LatLng(lat, lng);
      } else {
        console.warn('Geocoding failed:', data.status, address);
        return null;
      }
    } catch (err) {
      return null;
    }
  }, []);

  const showMarkers = useCallback(async () => {
    if (!mapInstanceRef.current || !isMounted.current) return;

    clearMarkers();

    const bounds = new window.google.maps.LatLngBounds();

    // Origin marker
    if (origin) {
      const originLatLng = await getLatLng(origin);
      if (originLatLng && isMounted.current) {
        const marker = new window.google.maps.Marker({
          position: originLatLng,
          map: mapInstanceRef.current,
          title: 'נקודת התחלה',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }
        });
        markersRef.current.push(marker);
        bounds.extend(originLatLng);
      }
    }

    // Destination marker
    if (destination) {
      const destLatLng = await getLatLng(destination);
      if (destLatLng && isMounted.current) {
        const marker = new window.google.maps.Marker({
          position: destLatLng,
          map: mapInstanceRef.current,
          title: 'יעד',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }
        });
        markersRef.current.push(marker);
        bounds.extend(destLatLng);
      }
    }

    // Waypoint markers
    for (const wp of waypoints) {
      const wpLatLng = await getLatLng(wp);
      if (wpLatLng && isMounted.current) {
        const marker = new window.google.maps.Marker({
          position: wpLatLng,
          map: mapInstanceRef.current,
          title: 'תחנה',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }
        });
        markersRef.current.push(marker);
        bounds.extend(wpLatLng);
      }
    }

    if (markersRef.current.length > 0 && mapInstanceRef.current && isMounted.current) {
      mapInstanceRef.current.fitBounds(bounds);
      if (markersRef.current.length === 1) {
        mapInstanceRef.current.setZoom(14);
      }
    }
  }, [origin, destination, waypoints, getLatLng, clearMarkers]);

  const formatDuration = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} שעות ${minutes} דקות`;
    }
    return `${minutes} דקות`;
  }, []);

  // Calculate straight-line distance (Haversine formula) as fallback
  const calculateStraightDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Estimate driving time (assuming average speed of 60 km/h in city, 80 km/h highway)
    // Use a factor of 1.3-1.5 for road distance vs straight line
    const roadDistance = distance * 1.4;
    const avgSpeed = roadDistance > 20 ? 80 : 60; // Highway vs city
    const estimatedMinutes = Math.round((roadDistance / avgSpeed) * 60);
    
    return {
      distance: roadDistance.toFixed(1),
      duration: estimatedMinutes
    };
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!window.google || !showDirections || !isMounted.current) {
      showMarkers();
      if (isMounted.current) setIsLoading(false);
      return;
    }

    // If Directions API is not available, use fallback calculation
    const useFallback = !window.google.maps.DirectionsService;
    
    if (useFallback) {
      console.warn('DirectionsService is not available. Using fallback distance calculation.');
    }

    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const originLatLng = await getLatLng(origin);
      const destLatLng = await getLatLng(destination);

      if (!isMounted.current) return;

      if (!originLatLng) {
        setError('לא ניתן למצוא את מיקום האיסוף');
        setIsLoading(false);
        showMarkers();
        return;
      }

      if (!destLatLng) {
        setError('לא ניתן למצוא את מיקום היעד');
        setIsLoading(false);
        showMarkers();
        return;
      }


      // Prepare waypoints
      const waypointLatLngs = [];
      for (const wp of waypoints) {
        const wpLatLng = await getLatLng(wp);
        if (wpLatLng) {
          waypointLatLngs.push({
            location: wpLatLng,
            stopover: true
          });
        }
      }

      if (!isMounted.current) return;

      // If Directions API is not available, use fallback
      if (useFallback) {
        const originLat = originLatLng.lat();
        const originLng = originLatLng.lng();
        const destLat = destLatLng.lat();
        const destLng = destLatLng.lng();
        
        const fallback = calculateStraightDistance(originLat, originLng, destLat, destLng);
        
        const info = {
          distance: fallback.distance + ' ק"מ (משוער)',
          duration: formatDuration(fallback.duration * 60),
          legs: [{
            start: typeof origin === 'string' ? origin : origin.address,
            end: typeof destination === 'string' ? destination : destination.address,
            distance: fallback.distance + ' ק"מ',
            duration: formatDuration(fallback.duration * 60)
          }]
        };
        
        setRouteInfo(info);
        onRouteCalculated?.(info);
        setIsLoading(false);
        
        // Draw a straight line on the map
        if (mapInstanceRef.current) {
          const line = new window.google.maps.Polyline({
            path: [originLatLng, destLatLng],
            geodesic: true,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.6,
            strokeWeight: 3
          });
          line.setMap(mapInstanceRef.current);
          
          // Fit bounds
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(originLatLng);
          bounds.extend(destLatLng);
          mapInstanceRef.current.fitBounds(bounds);
        }
        
        showMarkers();
        return;
      }

      const request = {
        origin: originLatLng,
        destination: destLatLng,
        waypoints: waypointLatLngs,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'il'
      };

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(request, (result, status) => {
        if (!isMounted.current) return;
        
        setIsLoading(false);

        if (status === 'OK' && directionsRendererRef.current && result.routes && result.routes.length > 0) {
          try {
            directionsRendererRef.current.setDirections(result);

            // Calculate total distance and duration
            const route = result.routes[0];
            let totalDistance = 0;
            let totalDuration = 0;

            route.legs.forEach(leg => {
              totalDistance += leg.distance.value;
              totalDuration += leg.duration.value;
            });

            const info = {
              distance: (totalDistance / 1000).toFixed(1) + ' ק"מ',
              duration: formatDuration(totalDuration),
              legs: route.legs.map(leg => ({
                start: leg.start_address,
                end: leg.end_address,
                distance: leg.distance.text,
                duration: leg.duration.text
              }))
            };

            setRouteInfo(info);
            onRouteCalculated?.(info);
          } catch (err) {
            setError('שגיאה בהצגת המסלול');
            showMarkers();
          }
        } else {
          
          // If REQUEST_DENIED, use fallback calculation instead of showing error
          if (status === 'REQUEST_DENIED') {
            console.warn('Directions API denied. Using fallback distance calculation.');
            const originLat = originLatLng.lat();
            const originLng = originLatLng.lng();
            const destLat = destLatLng.lat();
            const destLng = destLatLng.lng();
            
            const fallback = calculateStraightDistance(originLat, originLng, destLat, destLng);
            
            const info = {
              distance: fallback.distance + ' ק"מ (משוער)',
              duration: formatDuration(fallback.duration * 60),
              legs: [{
                start: typeof origin === 'string' ? origin : origin.address,
                end: typeof destination === 'string' ? destination : destination.address,
                distance: fallback.distance + ' ק"מ',
                duration: formatDuration(fallback.duration * 60)
              }]
            };
            
            setRouteInfo(info);
            onRouteCalculated?.(info);
            
            // Draw a straight line on the map
            if (mapInstanceRef.current) {
              const line = new window.google.maps.Polyline({
                path: [originLatLng, destLatLng],
                geodesic: true,
                strokeColor: '#3b82f6',
                strokeOpacity: 0.6,
                strokeWeight: 3
              });
              line.setMap(mapInstanceRef.current);
              
              // Fit bounds
              const bounds = new window.google.maps.LatLngBounds();
              bounds.extend(originLatLng);
              bounds.extend(destLatLng);
              mapInstanceRef.current.fitBounds(bounds);
            }
            
            showMarkers();
            return;
          }
          
          // For other errors, show error message
          let errorMsg = 'לא ניתן לחשב מסלול';
          switch (status) {
            case 'ZERO_RESULTS':
              errorMsg = 'לא נמצא מסלול בין המיקומים';
              break;
            case 'NOT_FOUND':
              errorMsg = 'אחד מהמיקומים לא נמצא';
              break;
            case 'OVER_QUERY_LIMIT':
              errorMsg = 'חרגת ממגבלת השאילתות';
              break;
            default:
              errorMsg = `שגיאה בחישוב המסלול: ${status}`;
          }
          
          setError(errorMsg);
          showMarkers();
        }
      });
    } catch (err) {
      if (!isMounted.current) return;
      setError('שגיאה בחישוב המסלול');
      setIsLoading(false);
      showMarkers();
    }
  }, [origin, destination, waypoints, showDirections, getLatLng, showMarkers, formatDuration, onRouteCalculated, calculateStraightDistance]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapReadyRef.current) {
      setIsLoading(false);
      return;
    }

    // Check if Google Maps is fully loaded
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.warn('Google Maps not yet available, waiting...');
      setIsLoading(false);
      setError('Map is loading...');
      return;
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 32.0853, lng: 34.7818 }, // Israel center
        zoom: 8,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;

      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });

      directionsRendererRef.current = directionsRenderer;
      mapReadyRef.current = true;
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load map');
      setIsLoading(false);
      return;
    }

    return () => {
      clearMarkers();
      if (directionsRendererRef.current) {
        try { directionsRendererRef.current.setMap(null); } catch (e) {}
        directionsRendererRef.current = null;
      }
      if (mapInstanceRef.current) {
        try { window.google.maps.event.clearInstanceListeners(mapInstanceRef.current); } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [clearMarkers]);

  // Recalculate route only when keys change (prevents flashing)
  useEffect(() => {
    if (!mapReadyRef.current || !mapInstanceRef.current) return;

    if (origin && destination) {
      calculateRoute();
    } else {
      setIsLoading(false);
      showMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originKey, destinationKey, waypointsKey]);

  return (
    <div className="route-map-container">
      <div 
        ref={mapRef} 
        className="route-map" 
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
        <div className="route-error">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span>⚠️ {error}</span>
            {error.includes('REQUEST_DENIED') && (
              <a 
                href="https://console.cloud.google.com/apis/library/directions-backend.googleapis.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '13px' }}
              >
                לחץ כאן להפעלת Directions API
              </a>
            )}
          </div>
        </div>
      )}

      {routeInfo && (
        <div className="route-info">
          <div className="route-summary">
            <div className="route-stat">
              <span className="stat-icon">🚗</span>
              <span className="stat-value">{routeInfo.distance}</span>
            </div>
            <div className="route-stat">
              <span className="stat-icon">⏱️</span>
              <span className="stat-value">{routeInfo.duration}</span>
            </div>
          </div>
          
          {routeInfo.legs.length > 1 && (
            <div className="route-legs">
              {routeInfo.legs.map((leg, index) => (
                <div key={index} className="route-leg">
                  <span className="leg-number">{index + 1}</span>
                  <div className="leg-details">
                    <span className="leg-endpoints">
                      {leg.start} → {leg.end}
                    </span>
                    <span className="leg-stats">
                      {leg.distance} • {leg.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RouteMap;

