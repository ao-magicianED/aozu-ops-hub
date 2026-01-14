/**
 * Authentication Module
 * Aozu Ops Hub - Firebase Google Authentication
 */

// Auth state
let currentUser = null;

// Detect mobile device (more robust detection)
function isMobile() {
    // Check for touch capability
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Check for mobile user agents
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check screen width
    const smallScreen = window.innerWidth <= 768;

    // Consider mobile if any of these are true
    return hasTouch || mobileUA || smallScreen;
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

    // ALWAYS use popup on mobile devices to avoid redirect issues
    const usePopup = isMobile();
    console.log('Mobile detected:', usePopup);

    // Handle Redirect Result (for desktop only)
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
                // Mobile: Use popup (works better than redirect on iOS)
                elements.loginBtn.textContent = 'ログイン中...';
                showToast('ポップアップでログインします (モバイル)');
                try {
                    const result = await auth.signInWithPopup(provider);
                    if (result.user) {
                        showToast('ログイン成功！');
                    }
                } catch (popupError) {
                    console.error('Popup error:', popupError);

                    // Handle specific popup errors
                    if (popupError.code === 'auth/popup-blocked') {
                        showToast('ポップアップがブロックされました。設定を確認してください。');
                    } else if (popupError.code === 'auth/popup-closed-by-user') {
                        showToast('ログインがキャンセルされました');
                    } else if (popupError.code === 'auth/cancelled-popup-request') {
                        // This is usually okay, another popup is already open
                        showToast('別のログイン処理が進行中です');
                    } else {
                        showToast('ログインエラー: ' + (popupError.message || popupError.code));
                    }
                    elements.loginBtn.disabled = false;
                    elements.loginBtn.textContent = 'Googleでログイン';
                }
            } else {
                // Desktop: Use redirect
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
