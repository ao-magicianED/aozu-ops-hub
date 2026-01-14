/**
 * Authentication Module
 * Aozu Ops Hub - Firebase Google Authentication
 */

// Auth state
let currentUser = null;

// UI Elements
function getAuthElements() {
    return {
        loginBtn: document.getElementById('login-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        userInfo: document.getElementById('user-info'),
        userName: document.getElementById('user-name'),
        userAvatar: document.getElementById('user-avatar'),
        syncStatus: document.getElementById('sync-status')
    };
}

// Initialize Auth
function initAuth() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const elements = getAuthElements();

    // Handle Redirect Result (for mobile flow)
    auth.getRedirectResult().then(async (result) => {
        if (result.user) {
            // Redirect login successful
            console.log("Redirect login successful");
            // Auth state observer will handle the rest
        }
    }).catch((error) => {
        console.error('Redirect auth error:', error);
        showToast('ログインに失敗しました: ' + error.message);
        if (elements.loginBtn) {
            elements.loginBtn.disabled = false;
            elements.loginBtn.textContent = 'Googleでログイン';
        }
    });

    // Login button handler
    elements.loginBtn?.addEventListener('click', () => {
        try {
            elements.loginBtn.disabled = true;
            elements.loginBtn.textContent = 'ログイン中...';
            // Use Redirect instead of Popup for better mobile support
            auth.signInWithRedirect(provider);
        } catch (error) {
            console.error('Login error:', error);
            showToast('ログイン処理の開始に失敗しました');
            elements.loginBtn.disabled = false;
            elements.loginBtn.textContent = 'Googleでログイン';
        }
    });

    // Logout button handler
    elements.logoutBtn?.addEventListener('click', async () => {
        try {
            await auth.signOut();
            showToast('ログアウトしました');
        } catch (error) {
            console.error('Logout error:', error);
            showToast('ログアウトに失敗しました');
        }
    });

    // Auth state observer
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        updateAuthUI(user);

        if (user) {
            // User logged in - sync data from cloud
            await syncFromCloud();
            showToast(`ようこそ、${user.displayName}さん！`);
        }
    });
}

// Update UI based on auth state
function updateAuthUI(user) {
    const elements = getAuthElements();

    if (user) {
        // Logged in
        if (elements.loginBtn) elements.loginBtn.style.display = 'none';
        if (elements.userInfo) elements.userInfo.style.display = 'flex';
        if (elements.userName) elements.userName.textContent = user.displayName || 'ユーザー';
        if (elements.userAvatar) {
            elements.userAvatar.src = user.photoURL || '';
            elements.userAvatar.alt = user.displayName || 'User';
        }
    } else {
        // Logged out
        if (elements.loginBtn) {
            elements.loginBtn.style.display = 'flex';
            elements.loginBtn.disabled = false;
            elements.loginBtn.textContent = 'Googleでログイン';
        }
        if (elements.userInfo) elements.userInfo.style.display = 'none';
    }
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Get current user ID
function getUserId() {
    return currentUser?.uid || null;
}

// Export for use in other modules
window.initAuth = initAuth;
window.isLoggedIn = isLoggedIn;
window.getUserId = getUserId;
window.currentUser = () => currentUser;
