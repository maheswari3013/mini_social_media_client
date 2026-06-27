/* ==========================================================================
   VIBENET FRONTEND CONTROLLER (SPA JavaScript)
   ========================================================================== */

// STATE MANAGEMENT
const state = {
  token: localStorage.getItem('token') || null,
  user: null,
  posts: [],
  activeView: 'feed',
  activeFeedTab: 'global',
  profileUsername: null,
  profileData: null,
  suggestedUsers: [],
  commentsPostId: null,
  comments: [],
  networkModalUserId: null,
  networkModalTab: 'followers',
  theme: localStorage.getItem('theme') || 'dark'
};

// Target explicit decoupled backend port 3000 in dev, or relative path / absolute URL in production
const API_BASE = (window.location.port === '8000')
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : '/api'; // Note: If deploying client & server separately without a proxy/redirect, change '/api' to your absolute backend URL (e.g., 'https://your-api.onrender.com/api')

// --- UTILITY FUNCTIONS ---

// Theme management helper functions
function applyTheme(theme) {
  state.theme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  const toggleBtn = document.getElementById('btn-theme-toggle');
  if (toggleBtn) {
    if (theme === 'light') {
      // Show moon icon for toggling to dark
      toggleBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    } else {
      // Show sun icon for toggling to light
      toggleBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme} mode.`, 'success');
}

// API Request Wrapper
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        showToast('Session expired. Please sign in again.', 'danger');
      }
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  } catch (err) {
    console.error(`API Error (${method} ${endpoint}):`, err);
    throw err;
  }
}

// Show/Hide Top-Level Screens
function showScreen(screenId) {
  document.getElementById('app-loading').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.add('hidden');

  document.getElementById(screenId).classList.remove('hidden');
}

// Show System Toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Render Initials on Avatar
function setupAvatar(el, userObj) {
  if (!el || !userObj) return;
  el.style.background = userObj.avatar_color || 'var(--primary)';
  el.innerText = userObj.display_name ? userObj.display_name.charAt(0).toUpperCase() : '?';
}

// Format relative timestamps
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}


// Setup password visibility toggle
function setupPasswordToggle(inputId, toggleId) {
  const passwordInput = document.getElementById(inputId);
  const toggleBtn = document.getElementById(toggleId);
  
  if (passwordInput && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Toggle eye SVG icon
      if (type === 'password') {
        toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-inline"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        toggleBtn.setAttribute('title', 'Show Password');
      } else {
        toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-inline"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        toggleBtn.setAttribute('title', 'Hide Password');
      }
    });
  }
}


// --- INITIALIZATION ---
async function init() {
  // Apply theme on load
  applyTheme(state.theme);

  if (state.token) {
    try {
      const user = await apiCall('/auth/me');
      state.user = user;
      setupCurrentUserUI();
      showScreen('app-screen');
      switchView('feed');
      fetchSuggestions();
    } catch (err) {
      console.log("Token validation failed, logging out.");
      handleLogout();
    }
  } else {
    showScreen('auth-screen');
  }

  // Setup theme toggle listener
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Setup password visibility toggles
  setupPasswordToggle('login-password', 'btn-login-password-toggle');
  setupPasswordToggle('register-password', 'btn-register-password-toggle');
}

function setupCurrentUserUI() {
  const myAvatars = document.querySelectorAll('.my-avatar');
  myAvatars.forEach(avatar => {
    setupAvatar(avatar, state.user);
  });
  
  setupAvatar(document.getElementById('sidebar-avatar'), state.user);
  document.getElementById('sidebar-displayname').innerText = state.user.display_name;
  document.getElementById('sidebar-username').innerText = `@${state.user.username}`;
}


// --- AUTHENTICATION HANDLERS ---

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const displayName = document.getElementById('register-displayname').value;
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const errEl = document.getElementById('auth-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  errEl.classList.add('hidden');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await apiCall('/auth/register', 'POST', {
      username,
      password,
      display_name: displayName
    });

    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('token', res.token);
    
    showToast(`Welcome to VibeNet, ${res.user.display_name}!`, 'success');
    setupCurrentUserUI();
    showScreen('app-screen');
    switchView('feed');
    fetchSuggestions();
  } catch (err) {
    errEl.innerText = err.message;
    errEl.classList.remove('hidden');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('auth-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  errEl.classList.add('hidden');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await apiCall('/auth/login', 'POST', { username, password });

    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('token', res.token);

    showToast('Signed in successfully.', 'success');
    setupCurrentUserUI();
    showScreen('app-screen');
    switchView('feed');
    fetchSuggestions();
  } catch (err) {
    errEl.innerText = err.message;
    errEl.classList.remove('hidden');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

// Switch Auth Forms
document.getElementById('go-to-register').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
  document.getElementById('auth-subtitle').innerText = "Join the VibeNet community today";
  document.getElementById('auth-error').classList.add('hidden');
});

document.getElementById('go-to-login').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('auth-subtitle').innerText = "Connect and share your daily vibe with the world";
  document.getElementById('auth-error').classList.add('hidden');
});

// Log Out
function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  showScreen('auth-screen');
  
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('register-displayname').value = '';
  document.getElementById('register-username').value = '';
  document.getElementById('register-password').value = '';
}
document.getElementById('btn-logout').addEventListener('click', handleLogout);


// --- ROUTING / VIEW NAVIGATION ---
function switchView(viewName, extraData = null) {
  state.activeView = viewName;

  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  document.getElementById(`view-${viewName}`).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const navItem = document.getElementById(`nav-${viewName}`);
  if (navItem) navItem.classList.add('active');

  const headerTitle = document.getElementById('header-title');
  const feedTabs = document.getElementById('feed-tabs-container');

  if (viewName === 'feed') {
    headerTitle.innerText = "Home Feed";
    feedTabs.classList.remove('hidden');
    fetchPosts();
  } else if (viewName === 'explore') {
    headerTitle.innerText = "Explore People";
    feedTabs.classList.add('hidden');
    searchUsers('');
  } else if (viewName === 'profile') {
    feedTabs.classList.add('hidden');
    const usernameToLoad = extraData || state.user.username;
    headerTitle.innerText = `@${usernameToLoad}`;
    viewUserProfile(usernameToLoad);
  }
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const view = item.getAttribute('data-view');
    switchView(view);
  });
});

document.getElementById('nav-brand').addEventListener('click', () => switchView('feed'));


// --- COMPOSE POST ACTIONS ---
const btnToggleImage = document.getElementById('btn-toggle-image');
const inputImageUrl = document.getElementById('post-image-url');
const previewContainer = document.getElementById('post-image-preview');
const previewImg = previewContainer.querySelector('img');
const btnClearImage = document.getElementById('btn-clear-image');

btnToggleImage.addEventListener('click', () => {
  inputImageUrl.classList.toggle('hidden');
  if (!inputImageUrl.classList.contains('hidden')) {
    inputImageUrl.focus();
  }
});

inputImageUrl.addEventListener('input', () => {
  const url = inputImageUrl.value.trim();
  if (url) {
    previewImg.src = url;
    previewContainer.classList.remove('hidden');
  } else {
    previewContainer.classList.add('hidden');
  }
});

btnClearImage.addEventListener('click', () => {
  inputImageUrl.value = '';
  previewImg.src = '';
  previewContainer.classList.add('hidden');
  inputImageUrl.classList.add('hidden');
});

document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const textarea = document.getElementById('post-content');
  const content = textarea.value.trim();
  const image_url = inputImageUrl.value.trim();

  if (!content) return;

  try {
    const post = await apiCall('/posts', 'POST', {
      content,
      image_url: image_url || null
    });

    showToast('Your vibe was posted!', 'success');
    
    textarea.value = '';
    inputImageUrl.value = '';
    inputImageUrl.classList.add('hidden');
    previewContainer.classList.add('hidden');
    previewImg.src = '';

    if (state.activeView === 'feed') {
      state.posts.unshift(post);
      renderPosts('posts-feed', state.posts);
    } else {
      switchView('feed');
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

document.getElementById('btn-sidebar-compose').addEventListener('click', () => {
  switchView('feed');
  setTimeout(() => {
    document.getElementById('post-content').focus();
  }, 100);
});


// --- POSTS RENDER & FEED ACTIONS ---

async function fetchPosts() {
  const postsFeed = document.getElementById('posts-feed');
  postsFeed.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

  let endpoint = '/posts';
  if (state.activeFeedTab === 'following') {
    endpoint += '?following=true';
  }

  try {
    const posts = await apiCall(endpoint);
    state.posts = posts;
    renderPosts('posts-feed', posts);
  } catch (err) {
    postsFeed.innerHTML = `<p class="error-msg">Failed to load posts: ${err.message}</p>`;
  }
}

document.getElementById('tab-global-feed').addEventListener('click', () => {
  document.getElementById('tab-global-feed').classList.add('active');
  document.getElementById('tab-following-feed').classList.remove('active');
  state.activeFeedTab = 'global';
  fetchPosts();
});

document.getElementById('tab-following-feed').addEventListener('click', () => {
  document.getElementById('tab-following-feed').classList.add('active');
  document.getElementById('tab-global-feed').classList.remove('active');
  state.activeFeedTab = 'following';
  fetchPosts();
});

function renderPosts(containerId, postsList) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (postsList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">✨</span>
        <p>No vibes found. Be the first to share your vibe!</p>
      </div>
    `;
    return;
  }

  postsList.forEach(post => {
    const isLiked = post.is_liked > 0;
    const postCard = document.createElement('article');
    postCard.className = 'card post-card';
    postCard.setAttribute('data-id', post.id);

    const imageHtml = post.image_url 
      ? `<div class="post-image"><img src="${post.image_url}" alt="Post image" loading="lazy"></div>` 
      : '';

    postCard.innerHTML = `
      <div class="post-avatar-col">
        <div class="avatar post-avatar" data-username="${post.username}"></div>
      </div>
      <div class="post-body-col">
        <div class="post-header">
          <div class="post-meta">
            <span class="display-name" data-username="${post.username}">${post.display_name}</span>
            <span class="username" data-username="${post.username}">@${post.username}</span>
            <span class="bullet">•</span>
            <span class="date">${formatTimeAgo(post.created_at)}</span>
          </div>
        </div>
        <div class="post-content">${escapeHTML(post.content)}</div>
        ${imageHtml}
        <div class="post-actions">
          <button class="action-btn btn-like ${isLiked ? 'liked' : ''}">
            <svg class="icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span class="likes-count">${post.likes_count}</span>
          </button>
          <button class="action-btn btn-comment">
            <svg class="icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            <span class="comments-count">${post.comments_count}</span>
          </button>
        </div>
      </div>
    `;

    setupAvatar(postCard.querySelector('.post-avatar'), post);
    
    postCard.querySelector('.btn-like').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLike(post.id, postCard.querySelector('.btn-like'));
    });

    postCard.querySelector('.btn-comment').addEventListener('click', (e) => {
      e.stopPropagation();
      openComments(post.id);
    });

    postCard.querySelectorAll('[data-username]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const username = el.getAttribute('data-username');
        switchView('profile', username);
      });
    });

    container.appendChild(postCard);
  });
}

// Like/Unlike Toggle Action
async function toggleLike(postId, btnEl) {
  const countEl = btnEl.querySelector('.likes-count');
  let count = parseInt(countEl.innerText);

  if (btnEl.classList.contains('liked')) {
    btnEl.classList.remove('liked');
    countEl.innerText = Math.max(0, count - 1);
  } else {
    btnEl.classList.add('liked');
    countEl.innerText = count + 1;
    const icon = btnEl.querySelector('.icon');
    icon.style.animation = 'none';
    setTimeout(() => {
      icon.style.animation = 'heartPop 0.4s var(--transition-spring)';
    }, 10);
  }

  try {
    const res = await apiCall(`/posts/${postId}/like`, 'POST');
    countEl.innerText = res.likes_count;
    if (res.liked) {
      btnEl.classList.add('liked');
    } else {
      btnEl.classList.remove('liked');
    }
  } catch (err) {
    showToast(err.message, 'danger');
    if (btnEl.classList.contains('liked')) {
      btnEl.classList.remove('liked');
      countEl.innerText = Math.max(0, count);
    } else {
      btnEl.classList.add('liked');
      countEl.innerText = count;
    }
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}


// --- COMMENTS SYSTEM ---

async function openComments(postId) {
  state.commentsPostId = postId;
  const modal = document.getElementById('comments-modal');
  const postSummary = document.getElementById('modal-post-summary');
  const commentsList = document.getElementById('modal-comments-list');

  const post = state.posts.find(p => p.id === postId);
  
  if (post) {
    postSummary.innerHTML = `
      <div class="user-meta" style="font-weight:600; margin-bottom:4px; color:var(--text-main)">${post.display_name} (@${post.username})</div>
      <div>${escapeHTML(post.content)}</div>
    `;
  } else {
    postSummary.innerText = "Viewing post comments...";
  }

  commentsList.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  modal.classList.remove('hidden');

  try {
    const comments = await apiCall(`/posts/${postId}/comments`);
    state.comments = comments;
    renderComments();
  } catch (err) {
    commentsList.innerHTML = `<p class="error-msg">Failed to load comments: ${err.message}</p>`;
  }
}

function renderComments() {
  const container = document.getElementById('modal-comments-list');
  container.innerHTML = '';

  if (state.comments.length === 0) {
    container.innerHTML = `<p class="empty-state-text" style="text-align:center; color:var(--text-subtle); padding: 12px 0;">No comments yet. Share your thoughts!</p>`;
    return;
  }

  state.comments.forEach(comment => {
    const card = document.createElement('div');
    card.className = 'comment-card';

    card.innerHTML = `
      <div class="avatar avatar-sm comment-avatar"></div>
      <div class="comment-content-box">
        <div class="comment-meta">
          <span class="comment-author" style="cursor:pointer">${comment.display_name}</span>
          <span class="comment-date">${formatTimeAgo(comment.created_at)}</span>
        </div>
        <div class="comment-text">${escapeHTML(comment.content)}</div>
      </div>
    `;

    setupAvatar(card.querySelector('.comment-avatar'), comment);
    
    card.querySelector('.comment-author').addEventListener('click', () => {
      closeAllModals();
      switchView('profile', comment.username);
    });

    container.appendChild(card);
  });
}

document.getElementById('comment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('comment-content');
  const content = input.value.trim();

  if (!content || !state.commentsPostId) return;

  try {
    const newComment = await apiCall(`/posts/${state.commentsPostId}/comments`, 'POST', { content });
    
    state.comments.push(newComment);
    input.value = '';
    renderComments();

    const postEl = document.querySelector(`.post-card[data-id="${state.commentsPostId}"]`);
    if (postEl) {
      const commentCountEl = postEl.querySelector('.comments-count');
      if (commentCountEl) {
        commentCountEl.innerText = parseInt(commentCountEl.innerText) + 1;
      }
    }
    
    const cachedPost = state.posts.find(p => p.id === state.commentsPostId);
    if (cachedPost) cachedPost.comments_count += 1;

    showToast('Reply posted.', 'success');
  } catch (err) {
    showToast(err.message, 'danger');
  }
});


// --- PROFILE VIEW ACTIONS ---

async function viewUserProfile(username) {
  const container = document.getElementById('profile-details-container');
  const feedContainer = document.getElementById('profile-posts-feed');

  container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  feedContainer.innerHTML = '';

  try {
    const data = await apiCall(`/users/${username}`);
    state.profileData = data;
    state.profileUsername = username;

    const isOwnProfile = state.user.id === data.user.id;
    
    let actionBtnHtml = '';
    if (isOwnProfile) {
      actionBtnHtml = `<button class="btn btn-secondary btn-sm" id="btn-edit-profile-trigger">Edit Profile</button>`;
    } else {
      const isFollowing = data.is_following;
      actionBtnHtml = `
        <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm" id="btn-follow-trigger">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      `;
    }

    container.innerHTML = `
      <div class="profile-card-header">
        <div class="profile-title-col">
          <h2 id="profile-display-name">${escapeHTML(data.user.display_name)}</h2>
          <span class="profile-username">@${data.user.username}</span>
        </div>
        <div class="avatar avatar-lg profile-avatar" id="profile-card-avatar"></div>
      </div>
      
      <p class="profile-bio" id="profile-card-bio">${data.user.bio ? escapeHTML(data.user.bio) : 'No bio added yet.'}</p>
      
      <div class="profile-stats">
        <div class="stat-item" id="stat-posts"><span>${data.stats.posts}</span> posts</div>
        <div class="stat-item" id="stat-followers"><span>${data.stats.followers}</span> followers</div>
        <div class="stat-item" id="stat-following"><span>${data.stats.following}</span> following</div>
      </div>
      
      <div class="profile-actions" style="margin-top: 4px;">
        ${actionBtnHtml}
      </div>
    `;

    setupAvatar(document.getElementById('profile-card-avatar'), data.user);

    if (isOwnProfile) {
      document.getElementById('btn-edit-profile-trigger').addEventListener('click', openEditProfile);
    } else {
      document.getElementById('btn-follow-trigger').addEventListener('click', (e) => {
        toggleFollow(data.user.id, e.target);
      });
    }

    document.getElementById('stat-followers').addEventListener('click', () => openNetworkModal(data.user.id, 'followers'));
    document.getElementById('stat-following').addEventListener('click', () => openNetworkModal(data.user.id, 'following'));

    fetchUserPosts(data.user.id);
  } catch (err) {
    container.innerHTML = `<p class="error-msg">Failed to load user profile: ${err.message}</p>`;
  }
}

async function fetchUserPosts(userId) {
  const container = document.getElementById('profile-posts-feed');
  container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

  try {
    const posts = await apiCall(`/posts?userId=${userId}`);
    posts.forEach(p => {
      if (!state.posts.some(cached => cached.id === p.id)) {
        state.posts.push(p);
      }
    });
    renderPosts('profile-posts-feed', posts);
  } catch (err) {
    container.innerHTML = `<p class="error-msg">Failed to load posts: ${err.message}</p>`;
  }
}

async function toggleFollow(userId, btnEl) {
  const isFollowing = btnEl.innerText.trim() === 'Following';
  
  if (isFollowing) {
    btnEl.innerText = 'Follow';
    btnEl.className = 'btn btn-primary btn-sm';
  } else {
    btnEl.innerText = 'Following';
    btnEl.className = 'btn btn-secondary btn-sm';
  }

  try {
    const res = await apiCall(`/users/${userId}/follow`, 'POST');
    
    if (res.followed) {
      btnEl.innerText = 'Following';
      btnEl.className = 'btn btn-secondary btn-sm';
    } else {
      btnEl.innerText = 'Follow';
      btnEl.className = 'btn btn-primary btn-sm';
    }

    if (state.profileUsername) {
      const profileDataEl = document.getElementById('stat-followers');
      if (profileDataEl) {
        profileDataEl.querySelector('span').innerText = res.followers_count;
      }
    }
    
    fetchSuggestions();
  } catch (err) {
    showToast(err.message, 'danger');
    if (isFollowing) {
      btnEl.innerText = 'Following';
      btnEl.className = 'btn btn-secondary btn-sm';
    } else {
      btnEl.innerText = 'Follow';
      btnEl.className = 'btn btn-primary btn-sm';
    }
  }
}


// --- EDIT PROFILE MODAL ACTIONS ---

function openEditProfile() {
  const modal = document.getElementById('edit-profile-modal');
  document.getElementById('edit-displayname').value = state.user.display_name;
  document.getElementById('edit-bio').value = state.user.bio || '';
  
  const selectedColorInput = document.getElementById('edit-avatar-color');
  selectedColorInput.value = state.user.avatar_color;

  const pickerContainer = document.getElementById('avatar-color-picker');
  pickerContainer.innerHTML = '';

  const gradients = [
    "linear-gradient(135deg, #3f4c6b 0%, #111e25 100%)",
    "linear-gradient(135deg, #2c3e50 0%, #000000 100%)",
    "linear-gradient(135deg, #485563 0%, #29323c 100%)",
    "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    "linear-gradient(135deg, #757f9a 0%, #4a569d 100%)",
    "linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)",
    "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)"
  ];

  gradients.forEach(gradient => {
    const opt = document.createElement('div');
    opt.className = 'avatar-theme-option';
    opt.style.background = gradient;
    
    if (gradient === state.user.avatar_color) {
      opt.classList.add('selected');
    }

    opt.addEventListener('click', () => {
      pickerContainer.querySelectorAll('.avatar-theme-option').forEach(el => el.classList.remove('selected'));
      opt.classList.add('selected');
      selectedColorInput.value = gradient;
    });

    pickerContainer.appendChild(opt);
  });

  modal.classList.remove('hidden');
}

document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const displayName = document.getElementById('edit-displayname').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  const avatarColor = document.getElementById('edit-avatar-color').value;

  try {
    const updatedUser = await apiCall('/users/profile', 'PUT', {
      display_name: displayName,
      bio,
      avatar_color: avatarColor
    });

    state.user = updatedUser;
    
    setupCurrentUserUI();
    closeAllModals();
    showToast('Profile updated successfully!', 'success');

    if (state.profileUsername === state.user.username) {
      viewUserProfile(state.user.username);
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
});


// --- NETWORK LISTINGS MODAL ---

async function openNetworkModal(userId, tab) {
  state.networkModalUserId = userId;
  state.networkModalTab = tab;

  const modal = document.getElementById('network-modal');
  const listContainer = document.getElementById('network-users-list');
  const title = document.getElementById('network-modal-title');

  title.innerText = tab === 'followers' ? 'Followers' : 'Following';
  listContainer.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  modal.classList.remove('hidden');

  if (tab === 'followers') {
    document.getElementById('network-tab-followers').classList.add('active');
    document.getElementById('network-tab-following').classList.remove('active');
  } else {
    document.getElementById('network-tab-followers').classList.remove('active');
    document.getElementById('network-tab-following').classList.add('active');
  }

  try {
    const res = await apiCall(`/users/${userId}/network`);
    renderNetworkUsers(res[tab]);
  } catch (err) {
    listContainer.innerHTML = `<p class="error-msg">Failed to load: ${err.message}</p>`;
  }
}

function renderNetworkUsers(users) {
  const container = document.getElementById('network-users-list');
  container.innerHTML = '';

  if (users.length === 0) {
    container.innerHTML = `<p class="empty-state-text" style="text-align:center; color:var(--text-subtle); padding: 16px 0;">No users found here.</p>`;
    return;
  }

  users.forEach(u => {
    const row = document.createElement('div');
    row.className = 'user-row';

    row.innerHTML = `
      <div class="user-row-info" data-username="${u.username}">
        <div class="avatar avatar-sm network-user-avatar"></div>
        <div class="user-names">
          <span class="display-name">${escapeHTML(u.display_name)}</span>
          <span class="username">@${u.username}</span>
        </div>
      </div>
    `;

    setupAvatar(row.querySelector('.network-user-avatar'), u);

    row.querySelector('.user-row-info').addEventListener('click', () => {
      closeAllModals();
      switchView('profile', u.username);
    });

    container.appendChild(row);
  });
}

document.getElementById('network-tab-followers').addEventListener('click', () => {
  if (state.networkModalUserId && state.networkModalTab !== 'followers') {
    openNetworkModal(state.networkModalUserId, 'followers');
  }
});

document.getElementById('network-tab-following').addEventListener('click', () => {
  if (state.networkModalUserId && state.networkModalTab !== 'following') {
    openNetworkModal(state.networkModalUserId, 'following');
  }
});


// --- EXPLORE & SEARCH VIEWS ---

async function searchUsers(query) {
  const container = document.getElementById('search-results-list');
  container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

  try {
    const users = await apiCall(`/users-search?q=${encodeURIComponent(query)}`);
    
    container.innerHTML = '';
    if (users.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No people found matching your query.</p>
        </div>
      `;
      return;
    }

    users.forEach(u => {
      const isOwnCard = state.user.id === u.id;
      const card = document.createElement('div');
      card.className = 'card user-card';

      card.innerHTML = `
        <div class="user-row-info" data-username="${u.username}">
          <div class="avatar explore-user-avatar"></div>
          <div class="user-names">
            <span class="display-name">${escapeHTML(u.display_name)}</span>
            <span class="username">@${u.username}</span>
          </div>
        </div>
        <div class="action-col">
          ${isOwnCard ? '' : `<button class="btn btn-secondary btn-sm follow-btn" data-id="${u.id}">View Profile</button>`}
        </div>
      `;

      setupAvatar(card.querySelector('.explore-user-avatar'), u);

      card.querySelectorAll('[data-username]').forEach(el => {
        el.addEventListener('click', () => {
          switchView('profile', u.username);
        });
      });

      if (!isOwnCard) {
        card.querySelector('.follow-btn').addEventListener('click', () => {
          switchView('profile', u.username);
        });
      }

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<p class="error-msg">Search failed: ${err.message}</p>`;
  }
}

let searchTimeout;
document.getElementById('explore-search-input').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const q = e.target.value.trim();
  searchTimeout = setTimeout(() => {
    searchUsers(q);
  }, 300);
});

document.getElementById('sidebar-search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    switchView('explore');
    document.getElementById('explore-search-input').value = q;
    searchUsers(q);
    e.target.value = '';
  }
});


// --- WHO TO FOLLOW SUGGESTIONS ---

async function fetchSuggestions() {
  const container = document.getElementById('sidebar-suggestions-list');
  container.innerHTML = '';

  try {
    const suggestions = await apiCall('/users-suggestions');
    if (suggestions.length === 0) {
      container.innerHTML = `<p class="empty-state-text" style="font-size:12px; color:var(--text-subtle)">No recommendations currently available.</p>`;
      return;
    }

    suggestions.forEach(u => {
      const row = document.createElement('div');
      row.className = 'user-row';

      row.innerHTML = `
        <div class="user-row-info" data-username="${u.username}">
          <div class="avatar avatar-sm suggest-avatar"></div>
          <div class="user-names">
            <span class="display-name">${escapeHTML(u.display_name)}</span>
            <span class="username">@${u.username}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm follow-btn" data-id="${u.id}" style="padding: 4px 12px; font-size: 11px;">Follow</button>
      `;

      setupAvatar(row.querySelector('.suggest-avatar'), u);

      row.querySelector('.user-row-info').addEventListener('click', () => {
        switchView('profile', u.username);
      });

      row.querySelector('.follow-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFollow(u.id, e.target);
      });

      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = `<p class="error-msg">Suggestions failed.</p>`;
  }
}


// --- MODAL DIALOG CLOSE ACTIONS ---

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });
  state.commentsPostId = null;
  state.comments = [];
  state.networkModalUserId = null;
}

document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach(closeEl => {
  closeEl.addEventListener('click', closeAllModals);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
  }
});

// RUN INITIALIZER
init();
