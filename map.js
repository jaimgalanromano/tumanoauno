// ============================================================
// Mapa — Leaflet con markers personalizados
// ============================================================

const MapModule = (() => {
  let map = null;
  let markers = [];
  let currentPosition = null;
  let currentCity = '';
  let onMarkerClickCallback = null;
  
  // Inicializar mapa
  function init(lat = CONFIG.DEFAULT_LAT, lng = CONFIG.DEFAULT_LNG, zoom = CONFIG.DEFAULT_ZOOM) {
    if (map) {
      map.setView([lat, lng], zoom);
      return;
    }
    
    map = L.map('map').setView([lat, lng], zoom);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 10
    }).addTo(map);
    
    // Agregar controles de zoom personalizados (los de Leaflet son feos)
    map.zoomControl.remove();
  }
  
  // Obtener ubicación del usuario
  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocalización no soportada');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          resolve(currentPosition);
        },
        (error) => {
          let msg = 'No se pudo obtener tu ubicación';
          if (error.code === 1) msg = 'Permiso denegado. Usaremos Buenos Aires por defecto.';
          reject(msg);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
  
  // Centrar mapa en una ubicación
  function centerOn(lat, lng, zoom = 14) {
    if (map) {
      map.setView([lat, lng], zoom);
    }
  }
  
  // Obtener nombre de ciudad desde coordenadas (reverse geocoding)
  async function getCityName(lat, lng) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
      const data = await response.json();
      
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.municipality;
        const state = data.address.state;
        return city ? `${city}, ${state || ''}` : 'Ubicación desconocida';
      }
      return 'Ubicación desconocida';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Ubicación desconocida';
    }
  }
  
  // Limpiar markers
  function clearMarkers() {
    markers.forEach(marker => {
      if (map) map.removeLayer(marker);
    });
    markers = [];
  }
  
  // Crear popup HTML para un post
  function createPopupContent(post) {
    const typeClass = post.type === 'ofrezco' ? 'badge-ofrezco' : 'badge-necesito';
    const typeText = post.type === 'ofrezco' ? '🙌 Ofrezco' : '🤝 Necesito';
    const categoryClass = post.category === 'producto' ? 'badge-producto' : 'badge-servicio';
    const categoryText = post.category === 'producto' ? '📦 Producto' : '⚙️ Servicio';
    
    // Determinar color de barra de tiempo
    let fillClass = '';
    if (post.remainingPercent < 20) fillClass = 'critical';
    else if (post.remainingPercent < 50) fillClass = 'urgent';
    
    return `
      <div class="minicard">
        <div class="minicard-top">
          <img src="${post.userPhoto || 'https://ui-avatars.com/api/?background=7EC8E3&color=fff&name=' + encodeURIComponent(post.userName)}" class="minicard-photo" onerror="this.src='https://ui-avatars.com/api/?background=7EC8E3&color=fff&name=U'">
          <span class="minicard-name">${Auth.sanitize(post.userName)}</span>
        </div>
        <div class="minicard-badges">
          <span class="minicard-badge ${typeClass}">${typeText}</span>
          <span class="minicard-badge ${categoryClass}">${categoryText}</span>
        </div>
        <div class="minicard-desc">${Auth.sanitize(post.description)}</div>
        <div class="minicard-countdown">
          <div class="countdown-bar">
            <div class="countdown-fill ${fillClass}" style="width: ${post.remainingPercent}%"></div>
          </div>
          <div class="countdown-text">⏳ ${post.remainingTime}</div>
        </div>
        <div class="minicard-action" data-post-id="${post.id}">🔍 Ver más</div>
      </div>
    `;
  }
  
  // Crear marker personalizado
  function createCustomMarker(lat, lng, type) {
    const markerColor = type === 'ofrezco' ? '#4BA8CC' : '#e0873a';
    const iconHtml = `
      <div class="custom-marker" style="background: ${markerColor}">
        <div class="custom-marker-inner">${type === 'ofrezco' ? '🙌' : '🤝'}</div>
      </div>
    `;
    
    const icon = L.divIcon({
      html: iconHtml,
      className: 'custom-div-icon',
      iconSize: [34, 34],
      popupAnchor: [0, -17]
    });
    
    return L.marker([lat, lng], { icon });
  }
  
  // Renderizar posts en el mapa
  function renderPosts(posts, onMarkerClick) {
    clearMarkers();
    onMarkerClickCallback = onMarkerClick;
    
    if (!posts || posts.length === 0) return;
    
    posts.forEach(post => {
      if (!post.lat || !post.lng) return;
      
      const marker = createCustomMarker(post.lat, post.lng, post.type);
      const popupContent = createPopupContent(post);
      
      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        // Attach event listener to "Ver más" button after popup opens
        setTimeout(() => {
          const btn = document.querySelector('.minicard-action');
          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              const postId = btn.dataset.postId;
              const foundPost = posts.find(p => p.id === postId);
              if (foundPost && onMarkerClickCallback) {
                onMarkerClickCallback(foundPost);
                marker.closePopup();
              }
            };
          }
        }, 50);
      });
      
      marker.addTo(map);
      markers.push(marker);
    });
  }
  
  // Fit bounds para mostrar todos los markers
  function fitBounds() {
    if (markers.length === 0) {
      if (currentPosition) {
        centerOn(currentPosition.lat, currentPosition.lng, 12);
      }
      return;
    }
    
    const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
    map.fitBounds(bounds, { padding: [30, 30] });
  }
  
  // Obtener instancia del mapa
  function getMap() { return map; }
  
  // Zoom in/out
  function zoomIn() { if (map) map.zoomIn(); }
  function zoomOut() { if (map) map.zoomOut(); }
  
  return {
    init,
    getUserLocation,
    getCityName,
    centerOn,
    renderPosts,
    clearMarkers,
    fitBounds,
    getMap,
    zoomIn,
    zoomOut,
    currentPosition: () => currentPosition
  };
})();