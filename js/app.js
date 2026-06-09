// ============================================================
// App — Lógica principal de la aplicación
// ============================================================

const App = (() => {
  let currentPosts = [];
  let currentUser = null;
  
  // ── DOM Elements ──────────────────────────────────────────
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');
  const btnGoogleLogin = document.getElementById('btn-google-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnFab = document.getElementById('btn-fab');
  const userAvatar = document.getElementById('user-avatar');
  const userMenu = document.getElementById('user-menu');
  const userAvatarWrap = document.getElementById('user-avatar-wrap');
  const cityLabel = document.getElementById('city-label');
  const citySelect = document.getElementById('city-select');
  const btnDonar = document.getElementById('btn-donar');
  const donarModal = document.getElementById('donar-modal');
  const donarModalClose = document.getElementById('donar-modal-close');
  const btnCopyCvu = document.getElementById('btn-copy-cvu');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  
  // Form elements
  const formModal = document.getElementById('form-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnPublicar = document.getElementById('btn-publicar');
  const formDescripcion = document.getElementById('form-descripcion');
  const formCelular = document.getElementById('form-celular');
  const charCount = document.getElementById('char-count');
  const locationText = document.getElementById('location-text');
  const locationStatus = document.getElementById('location-status');
  const formUserPhoto = document.getElementById('form-user-photo');
  const formUserName = document.getElementById('form-user-name');
  const toggleOfrezco = document.getElementById('toggle-ofrezco');
  const toggleNecesito = document.getElementById('toggle-necesito');
  const toggleProducto = document.getElementById('toggle-producto');
  const toggleServicio = document.getElementById('toggle-servicio');
  const btnPublicarText = document.getElementById('btn-publicar-text');
  const btnPublicarSpinner = document.getElementById('btn-publicar-spinner');
  
  // Card modal
  const cardModal = document.getElementById('card-modal');
  const cardModalClose = document.getElementById('card-modal-close');
  const cardModalContent = document.getElementById('card-modal-content');
  
  // Toast
  const toastEl = document.getElementById('toast');
  
  // ── Helper Functions ──────────────────────────────────────
  function showToast(message, type = 'info') {
    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;
    toastEl.classList.remove('hidden');
    setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 3000);
  }
  
  // ── Login / Logout ────────────────────────────────────────
  function onLoginSuccess(user) {
    currentUser = user;
    loginScreen.classList.remove('active');
    appScreen.classList.add('active');
    
    userAvatar.src = user.photo || 'https://ui-avatars.com/api/?background=7EC8E3&color=fff&name=' + encodeURIComponent(user.name);
    formUserPhoto.src = user.photo || 'https://ui-avatars.com/api/?background=7EC8E3&color=fff&name=' + encodeURIComponent(user.name);
    formUserName.textContent = user.name;
    
    // Cargar datos iniciales
    loadPosts();
    initLocationAndMap();
  }
  
  function onLogout() {
    currentUser = null;
    loginScreen.classList.add('active');
    appScreen.classList.remove('active');
    MapModule.clearMarkers();
    currentPosts = [];
  }
  
  // ── Posts ─────────────────────────────────────────────────
  async function loadPosts() {
    if (!currentUser) return;
    
    const result = await API.getPosts();
    if (result.success && result.posts) {
      currentPosts = result.posts;
      MapModule.renderPosts(currentPosts, openCardDetail);
    } else {
      showToast(result.error || 'Error al cargar publicaciones', 'error');
    }
  }
  
  async function publishPost(postData) {
    const result = await API.createPost({
      ...postData,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhoto: currentUser.photo
    });
    
    if (result.success) {
      showToast('¡Publicación creada con éxito!', 'success');
      closeFormModal();
      loadPosts();
    } else {
      showToast(result.error || 'Error al publicar', 'error');
    }
    return result.success;
  }
  
  function openCardDetail(post) {
    const isOwner = currentUser && post.userId === currentUser.id;
    const typeClass = post.type === 'ofrezco' ? 'badge-ofrezco' : 'badge-necesito';
    const typeText = post.type === 'ofrezco' ? '🙌 Ofrezco' : '🤝 Necesito';
    const categoryClass = post.category === 'producto' ? 'badge-producto' : 'badge-servicio';
    const categoryText = post.category === 'producto' ? '📦 Producto' : '⚙️ Servicio';
    
    let fillClass = '';
    if (post.remainingPercent < 20) fillClass = 'critical';
    else if (post.remainingPercent < 50) fillClass = 'urgent';
    
    const whatsappUrl = post.phone ? `https://wa.me/54${post.phone}?text=Hola%20${encodeURIComponent(post.userName)}%2C%20vi%20tu%20publicaci%C3%B3n%20en%20Tu%20Mano%20a%20Uno%3A%20${encodeURIComponent(post.description)}` : '#';
    
    cardModalContent.innerHTML = `
      <div class="card-detail-header">
        <img src="${post.userPhoto || 'https://ui-avatars.com/api/?background=7EC8E3&color=fff&name=' + encodeURIComponent(post.userName)}" class="card-detail-photo" onerror="this.src='https://ui-avatars.com/api/?background=7EC8E3&color=fff&name=U'">
        <div>
          <div class="card-detail-name">${Auth.sanitize(post.userName)}</div>
          <div class="card-detail-date">Publicado: ${new Date(post.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
      <div>
        <span class="card-detail-badge ${typeClass}">${typeText}</span>
        <span class="card-detail-badge ${categoryClass}">${categoryText}</span>
      </div>
      <div class="card-detail-desc">${Auth.sanitize(post.description)}</div>
      <div class="card-detail-countdown">
        <div class="countdown-bar">
          <div class="countdown-fill ${fillClass}" style="width: ${post.remainingPercent}%"></div>
        </div>
        <div>⏳ Expira en: ${post.remainingTime}</div>
      </div>
      ${post.phone && !isOwner ? `<a href="${whatsappUrl}" target="_blank" class="btn-whatsapp">📱 Contactar por WhatsApp</a>` : ''}
      ${post.phone && isOwner ? `<p class="form-hint">📞 Tu contacto: +54 ${post.phone}</p>` : ''}
      ${!post.phone ? '<p class="form-hint">⚠️ Este usuario no compartió número de contacto</p>' : ''}
    `;
    
    cardModal.classList.remove('hidden');
  }
  
  // ── Location & Map ────────────────────────────────────────
  async function initLocationAndMap() {
    try {
      const position = await MapModule.getUserLocation();
      if (position) {
        MapModule.centerOn(position.lat, position.lng, 13);
        const cityName = await MapModule.getCityName(position.lat, position.lng);
        cityLabel.textContent = cityName;
      }
    } catch (error) {
      console.warn(error);
      cityLabel.textContent = 'Buenos Aires, Argentina';
      MapModule.centerOn(CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LNG, CONFIG.DEFAULT_ZOOM);
    }
  }
  
  // ── Form Modal ────────────────────────────────────────────
  let currentLocation = null;
  let currentLocationName = '';
  let currentFormType = 'ofrezco';
  let currentFormCategory = 'producto';
  
  function openFormModal() {
    currentLocation = null;
    currentLocationName = '';
    locationText.textContent = 'Obteniendo tu ubicación...';
    locationStatus.classList.remove('error');
    btnPublicar.disabled = true;
    formDescripcion.value = '';
    formCelular.value = '';
    charCount.textContent = '0/300';
    
    // Obtener ubicación actual
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          currentLocationName = await MapModule.getCityName(currentLocation.lat, currentLocation.lng);
          locationText.textContent = `📍 ${currentLocationName}`;
          locationStatus.classList.remove('error');
          validateForm();
        },
        (error) => {
          let msg = 'No se pudo obtener tu ubicación';
          if (error.code === 1) msg = 'Permiso denegado. No podrás publicar sin ubicación.';
          locationText.textContent = msg;
          locationStatus.classList.add('error');
          btnPublicar.disabled = true;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      locationText.textContent = 'Geolocalización no soportada';
      locationStatus.classList.add('error');
      btnPublicar.disabled = true;
    }
    
    formModal.classList.remove('hidden');
  }
  
  function closeFormModal() {
    formModal.classList.add('hidden');
  }
  
  function validateForm() {
    const hasDesc = formDescripcion.value.trim().length >= 10;
    const hasLocation = currentLocation !== null;
    btnPublicar.disabled = !(hasDesc && hasLocation);
  }
  
  async function handlePublish() {
    if (btnPublicar.disabled) return;
    
    btnPublicarText.classList.add('hidden');
    btnPublicarSpinner.classList.remove('hidden');
    btnPublicar.disabled = true;
    
    const postData = {
      type: currentFormType,
      category: currentFormCategory,
      description: formDescripcion.value.trim(),
      phone: formCelular.value.trim(),
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      locationName: currentLocationName,
      durationHours: CONFIG.CARD_DURATION_HOURS
    };
    
    const success = await publishPost(postData);
    
    btnPublicarText.classList.remove('hidden');
    btnPublicarSpinner.classList.add('hidden');
    
    if (!success) {
      btnPublicar.disabled = false;
    }
  }
  
  // ── Donar Modal ───────────────────────────────────────────
  function openDonarModal() {
    donarModal.classList.remove('hidden');
  }
  
  function closeDonarModal() {
    donarModal.classList.add('hidden');
  }
  
  async function copyCVU() {
    const cvuValue = document.getElementById('cvu-value').textContent;
    try {
      await navigator.clipboard.writeText(cvuValue);
      const copyText = document.getElementById('cvu-copy-text');
      const originalText = copyText.textContent;
      copyText.textContent = '¡Copiado!';
      setTimeout(() => {
        copyText.textContent = originalText;
      }, 2000);
      showToast('CVU copiado al portapapeles', 'success');
    } catch (err) {
      showToast('No se pudo copiar', 'error');
    }
  }
  
  // ── User Menu ──────────────────────────────────────────────
  function toggleUserMenu(e) {
    e.stopPropagation();
    userMenu.classList.toggle('hidden');
  }
  
  function closeUserMenu() {
    userMenu.classList.add('hidden');
  }
  
  // ── City Select ───────────────────────────────────────────
  function populateCitySelect() {
    const cities = [
      { name: 'Buenos Aires', lat: -34.6118, lng: -58.3960 },
      { name: 'Córdoba', lat: -31.4201, lng: -64.1888 },
      { name: 'Rosario', lat: -32.9468, lng: -60.6393 },
      { name: 'Mendoza', lat: -32.8895, lng: -68.8458 },
      { name: 'La Plata', lat: -34.9205, lng: -57.9536 },
      { name: 'Mar del Plata', lat: -38.0055, lng: -57.5426 }
    ];
    
    citySelect.innerHTML = '<option value="">Tu ciudad</option>' +
      cities.map(city => `<option value="${city.lat},${city.lng}">${city.name}</option>`).join('');
    
    citySelect.addEventListener('change', (e) => {
      if (e.target.value) {
        const [lat, lng] = e.target.value.split(',').map(Number);
        MapModule.centerOn(lat, lng, 12);
        const selectedCity = cities.find(c => c.lat === lat);
        if (selectedCity) cityLabel.textContent = selectedCity.name;
      } else {
        initLocationAndMap();
      }
    });
  }
  
  // ── Toggle Handlers ───────────────────────────────────────
  function setupToggles() {
    toggleOfrezco.addEventListener('click', () => {
      toggleOfrezco.classList.add('active');
      toggleNecesito.classList.remove('active');
      currentFormType = 'ofrezco';
    });
    
    toggleNecesito.addEventListener('click', () => {
      toggleNecesito.classList.add('active');
      toggleOfrezco.classList.remove('active');
      currentFormType = 'necesito';
    });
    
    toggleProducto.addEventListener('click', () => {
      toggleProducto.classList.add('active');
      toggleServicio.classList.remove('active');
      currentFormCategory = 'producto';
    });
    
    toggleServicio.addEventListener('click', () => {
      toggleServicio.classList.add('active');
      toggleProducto.classList.remove('active');
      currentFormCategory = 'servicio';
    });
  }
  
  // ── Event Listeners ───────────────────────────────────────
  function bindEvents() {
    btnGoogleLogin.addEventListener('click', () => Auth.signIn());
    btnLogout.addEventListener('click', () => Auth.logout());
    btnFab.addEventListener('click', openFormModal);
    modalCloseBtn.addEventListener('click', closeFormModal);
    btnPublicar.addEventListener('click', handlePublish);
    formDescripcion.addEventListener('input', () => {
      const len = formDescripcion.value.length;
      charCount.textContent = `${len}/300`;
      validateForm();
    });
    formCelular.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 14);
    });
    
    userAvatarWrap.addEventListener('click', toggleUserMenu);
    document.addEventListener('click', (e) => {
      if (!userAvatarWrap.contains(e.target)) closeUserMenu();
    });
    
    cardModalClose.addEventListener('click', () => cardModal.classList.add('hidden'));
    cardModal.addEventListener('click', (e) => {
      if (e.target === cardModal) cardModal.classList.add('hidden');
    });
    
    btnDonar.addEventListener('click', openDonarModal);
    donarModalClose.addEventListener('click', closeDonarModal);
    donarModal.addEventListener('click', (e) => {
      if (e.target === donarModal) closeDonarModal();
    });
    btnCopyCvu.addEventListener('click', copyCVU);
    
    zoomInBtn.addEventListener('click', () => MapModule.zoomIn());
    zoomOutBtn.addEventListener('click', () => MapModule.zoomOut());
    
    formModal.addEventListener('click', (e) => {
      if (e.target === formModal) closeFormModal();
    });
  }
  
  // ── Init ───────────────────────────────────────────────────
  async function init() {
    MapModule.init();
    bindEvents();
    setupToggles();
    populateCitySelect();
    
    await Auth.init();
    const restored = Auth.restoreSession();
    if (restored) {
      const user = Auth.getUser();
      if (user) onLoginSuccess(user);
    }
  }
  
  // Public API
  return {
    init,
    onLoginSuccess,
    onLogout,
    showToast
  };
})();

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());