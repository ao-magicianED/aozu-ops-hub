/**
 * Authentication Module
 * Aozu Ops Hub - Firebase Google Authentication
 */

// Auth state
let currentUser = null;

// Detect iOS (Safari, Chrome on iOS, etc.)
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Detect Safari (including iOS Safari)
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

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
    // Set persistence to LOCAL
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((error) => {
            console.error('Persistence error:', error);
        });

    const provider = new firebase.auth.GoogleAuthProvider();
    auth.useDeviceLanguage();

    const elements = getAuthElements();
    const usePopup = isIOS() || isSafari(); // Use popup for iOS/Safari

    // Handle Redirect Result (for non-iOS flow)
    if (!usePopup) {
        auth.getRedirectResult().then((result) => {
            if (result.user) {
                console.log("Redirect login successful:", result.user.uid);
                showToast(`認証成功: ${result.user.displayName}`);
            }
        }).catch((error) => {
            console.error('Redirect auth error:', error);
            showToast('認証エラー: ' + error.code);
            if (elements.loginBtn) {
                elements.loginBtn.disabled = false;
                elements.loginBtn.textContent = 'Googleでログイン';
            }
        });
    }

    // Login button handler
    elements.loginBtn?.addEventListener('click', async () => {
        try {
            elements.loginBtn.disabled = true;

            if (usePopup) {
                // iOS/Safari: Use popup
                elements.loginBtn.textContent = 'ログイン中...';
                showToast('ポップアップでログインします');
                try {
                    await auth.signInWithPopup(provider);
                    showToast('ログイン成功！');
                } catch (popupError) {
                    console.error('Popup error:', popupError);
                    if (popupError.code === 'auth/popup-blocked') {
                        showToast('ポップアップがブロックされました。ブラウザ設定を確認してください。');
                    } else if (popupError.code === 'auth/popup-closed-by-user') {
                        showToast('ログインがキャンセルされました');
                    } else {
                        showToast('ログインエラー: ' + popupError.message);
                    }
                    elements.loginBtn.disabled = false;
                    elements.loginBtn.textContent = 'Googleでログイン';
                }
            } else {
                // Other browsers: Use redirect
                elements.loginBtn.textContent = 'Googleへ移動中...';
                showToast('Google認証画面へ移動します');
                auth.signInWithRedirect(provider);
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('ログイン開始エラー: ' + error.message);
            elements.loginBtn.disabled = false;
            elements.loginBtn.textContent = 'Googleでログイン';
        }
    });

    // Logout button handler
    elements.logoutBtn?.addEventListener('click', async () => {
        try {
            await auth.signOut();
            showToast('ログアウトしました');
            setTimeout(() => location.reload(), 500);
        } catch (error) {
            console.error('Logout error:', error);
            showToast('ログアウト失敗: ' + error.message);
        }
    });

    // Auth state observer
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        updateAuthUI(user);

        if (user) {
            showToast(`ログイン中: ${user.displayName}`);
            try {
                await syncFromCloud();
                showToast(`同期完了！`);
            } catch (e) {
                console.error('Sync trigger error:', e);
                showToast('データ同期エラー');
            }
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
