// ============================================================
// API — Comunicación con Google Apps Script
// ============================================================

const API = (() => {
  
  // URL base del Google Apps Script (reemplazar con tu deployment ID)
  const BASE_URL = 'https://script.google.com/macros/s/AKfycbwbabkHpbxhqkbXfkDBcB4UkaJujnb6WUrHKbv5qDl7gSo7UWO0rthQ-pu5JusPHyhZ/exec';
  
  async function request(action, data = {}, method = 'POST') {
    const url = BASE_URL;
    const body = JSON.stringify({ action, ...data });
    
    try {
      const response = await fetch(url, {
        method: method,
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      return { success: false, error: 'Error de conexión. Revisá tu internet.' };
    }
  }
  
  // Obtener todos los posts activos
  async function getPosts(userId = null) {
    let url = `${BASE_URL}?action=getPosts`;
    if (userId) url += `&userId=${encodeURIComponent(userId)}`;
    
    try {
      const response = await fetch(url);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('getPosts error:', error);
      return { success: false, error: 'Error al cargar publicaciones' };
    }
  }
  
  // Crear nuevo post
  async function createPost(postData) {
    return await request('createPost', postData);
  }
  
  // Eliminar post
  async function deletePost(postId, userId) {
    return await request('deletePost', { postId, userId });
  }
  
  // Obtener cantidad de posts del usuario hoy
  async function getUserPostsCount(userId) {
    const url = `${BASE_URL}?action=getUserPostsCount&userId=${encodeURIComponent(userId)}`;
    try {
      const response = await fetch(url);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('getUserPostsCount error:', error);
      return { success: false, count: 0 };
    }
  }
  
  return { getPosts, createPost, deletePost, getUserPostsCount };
})();