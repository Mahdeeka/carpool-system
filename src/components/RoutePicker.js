import React, { useEffect, useRef, useState, useCallback } from 'react';
import './RoutePicker.css';

const GOOGLE_API_KEY = 'AIzaSyDnWINn8Mh5rx7KvlIgIZA37c0DQo9eimk';

function RoutePicker({
  origin,
  destination,
  selectedPickup,
  onPickupSelect,
  height = '400px',
  showInstructions = true
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const routePolylineRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const [routeData, setRouteData] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(selectedPickup);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get coordinates from location
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

  // Calculate route
  const calculateRoute = useCallback(async () => {
    if (!window.google || !mapRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const originCoords = await getLatLng(origin);
      const destCoords = await getLatLng(destination);

      if (!originCoords || !destCoords) {
        setError('לא ניתן למצוא את המיקומים');
        setIsLoading(false);
        return;
      }

      // Initialize map if not already done
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: originCoords,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      // Try to get route using Directions API
      if (window.google.maps.DirectionsService) {
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: true, // We'll add custom markers
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });

        directionsRendererRef.current = directionsRenderer;

        directionsService.route({
          origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
          destination: new window.google.maps.LatLng(destCoords.lat, destCoords.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
          region: 'il'
        }, (result, status) => {
          if (status === 'OK' && result.routes && result.routes.length > 0) {
            directionsRenderer.setDirections(result);
            const route = result.routes[0];
            
            // Extract route path for clicking
            const path = route.overview_path || [];
            if (path.length > 0) {
              // Draw clickable polyline
              if (routePolylineRef.current) {
                routePolylineRef.current.setMap(null);
              }
              
              routePolylineRef.current = new window.google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 8,
                clickable: true,
                zIndex: 1
              });
              
              routePolylineRef.current.setMap(mapInstanceRef.current);
              
              // Add click listener to route
              routePolylineRef.current.addListener('click', (e) => {
                handleRouteClick(e.latLng);
              });
            }

            // Calculate route info
            let totalDistance = 0;
            let totalDuration = 0;
            route.legs.forEach(leg => {
              totalDistance += leg.distance.value;
              totalDuration += leg.duration.value;
            });

            setRouteData({
              distance: (totalDistance / 1000).toFixed(1),
              duration: totalDuration,
              path: path
            });

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

            // Fit bounds
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(originCoords);
            bounds.extend(destCoords);
            mapInstanceRef.current.fitBounds(bounds);
          } else {
            // Fallback: draw straight line
            drawFallbackRoute(originCoords, destCoords);
          }
        });
      } else {
        // Fallback: draw straight line
        drawFallbackRoute(originCoords, destCoords);
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError('שגיאה בחישוב המסלול');
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, getLatLng]);

  const drawFallbackRoute = (originCoords, destCoords) => {
    if (!mapInstanceRef.current) return;

    // Draw straight line
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }

    routePolylineRef.current = new window.google.maps.Polyline({
      path: [
        new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
        new window.google.maps.LatLng(destCoords.lat, destCoords.lng)
      ],
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.6,
      strokeWeight: 5,
      clickable: true,
      zIndex: 1
    });

    routePolylineRef.current.setMap(mapInstanceRef.current);
    routePolylineRef.current.addListener('click', (e) => {
      handleRouteClick(e.latLng);
    });

    // Add markers
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
      }
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
      }
    });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(originCoords);
    bounds.extend(destCoords);
    mapInstanceRef.current.fitBounds(bounds);
  };

  const handleRouteClick = async (latLng) => {
    const lat = latLng.lat();
    const lng = latLng.lng();

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=he&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      
      let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (data.status === 'OK' && data.results.length > 0) {
        address = data.results[0].formatted_address;
      }

      const location = {
        address,
        lat,
        lng
      };

      setPickupLocation(location);
      onPickupSelect?.(location);

      // Add/update pickup marker
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setPosition(latLng);
      } else {
        pickupMarkerRef.current = new window.google.maps.Marker({
          position: latLng,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#f59e0b',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
          title: 'מיקום איסוף',
          zIndex: 10,
          draggable: true
        });

        pickupMarkerRef.current.addListener('dragend', (e) => {
          handleRouteClick(e.latLng);
        });
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  };

  // Initialize map and calculate route
  useEffect(() => {
    if (!window.google) {
      const checkInterval = setInterval(() => {
        if (window.google) {
          clearInterval(checkInterval);
          calculateRoute();
        }
      }, 500);
      return () => clearInterval(checkInterval);
    } else {
      calculateRoute();
    }
  }, [calculateRoute]);

  // Update pickup marker when selectedPickup changes
  useEffect(() => {
    if (selectedPickup && selectedPickup.lat && selectedPickup.lng && mapInstanceRef.current) {
      const latLng = new window.google.maps.LatLng(selectedPickup.lat, selectedPickup.lng);
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setPosition(latLng);
      } else {
        pickupMarkerRef.current = new window.google.maps.Marker({
          position: latLng,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#f59e0b',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
          title: 'מיקום איסוף',
          zIndex: 10,
          draggable: true
        });

        pickupMarkerRef.current.addListener('dragend', (e) => {
          handleRouteClick(e.latLng);
        });
      }
      setPickupLocation(selectedPickup);
    }
  }, [selectedPickup]);

  return (
    <div className="route-picker-container">
      {showInstructions && (
        <div className="route-picker-instructions">
          <p>📍 לחץ על המסלול הכחול כדי לבחור את מיקום האיסוף שלך</p>
          <p>או גרור את הסימון הצהוב למקום הרצוי</p>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="route-picker-map" 
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
        <div className="route-picker-error">
          ⚠️ {error}
        </div>
      )}

      {pickupLocation && (
        <div className="route-picker-selected">
          <strong>מיקום איסוף נבחר:</strong>
          <span>{pickupLocation.address}</span>
        </div>
      )}

      {routeData && (
        <div className="route-picker-info">
          <div className="route-stat">
            <span className="stat-icon">🚗</span>
            <span className="stat-value">{routeData.distance} ק"מ</span>
          </div>
          <div className="route-stat">
            <span className="stat-icon">⏱️</span>
            <span className="stat-value">
              {Math.floor(routeData.duration / 60)} דקות
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoutePicker;

