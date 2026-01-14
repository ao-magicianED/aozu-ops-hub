/**
 * Data Sync Module
 * Aozu Ops Hub - Cloud Data Synchronization
 */

// Debounce timer for saves
let saveTimer = null;
const SAVE_DELAY = 1000; // 1 second debounce

// Data keys to sync
const SYNC_KEYS = {
    CHECKLIST: 'checklist',
    NOTES: 'notes',
    RULES_CHECKED: 'rulesChecked',
    LEARNING_LOGS: 'learningLogs',
    USER_TEMPLATES: 'userTemplates'
};

// Get user document reference
function getUserDocRef() {
    const userId = getUserId();
    if (!userId) return null;
    return db.collection('users').doc(userId);
}

// Sync data from cloud to local
async function syncFromCloud() {
    if (!isLoggedIn()) return;

    updateSyncStatus('syncing');

    try {
        const docRef = getUserDocRef();
        if (!docRef) return;

        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();

            const hasField = (field) => Object.prototype.hasOwnProperty.call(data, field);

            // Merge cloud data with local (cloud takes priority)
            if (hasField('checklist')) {
                localStorage.setItem('aozu_checklist', JSON.stringify(data.checklist));
            }
            if (hasField('notes')) {
                localStorage.setItem('aozu_notes', data.notes);
            }
            if (hasField('rulesChecked')) {
                localStorage.setItem('aozu_rules_checked', JSON.stringify(data.rulesChecked));
            }
            if (hasField('learningLogs')) {
                localStorage.setItem('aozu_learning_logs', JSON.stringify(data.learningLogs));
                // Update state
                if (window.state) {
                    window.state.learningLogs = data.learningLogs;
                }
            }
            if (hasField('userTemplates')) {
                localStorage.setItem('aozu_user_templates', JSON.stringify(data.userTemplates));
                // Update state
                if (window.state) {
                    window.state.userTemplates = data.userTemplates;
                }
            }

            // Refresh the current page to show synced data
            if (typeof renderCurrentPage === 'function') {
                renderCurrentPage();
            }
        } else {
            // No cloud data yet - push local data to cloud
            await syncAllToCloud();
        }

        updateSyncStatus('synced');
    } catch (error) {
        console.error('Sync from cloud error:', error);
        updateSyncStatus('error');
    }
}

// Sync all local data to cloud
async function syncAllToCloud() {
    if (!isLoggedIn()) return;

    try {
        const docRef = getUserDocRef();
        if (!docRef) return;

        const data = {
            checklist: JSON.parse(localStorage.getItem('aozu_checklist') || '{}'),
            notes: localStorage.getItem('aozu_notes') || '',
            rulesChecked: JSON.parse(localStorage.getItem('aozu_rules_checked') || '[]'),
            learningLogs: JSON.parse(localStorage.getItem('aozu_learning_logs') || '[]'),
            userTemplates: JSON.parse(localStorage.getItem('aozu_user_templates') || '[]'),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        await docRef.set(data, { merge: true });
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Sync to cloud error:', error);
        updateSyncStatus('error');
    }
}

// Save specific data to cloud (debounced)
function saveToCloud(key, value) {
    // Always save to localStorage first
    const localKey = 'aozu_' + key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(localKey, stringValue);

    // If not logged in, skip cloud sync
    if (!isLoggedIn()) return;

    // Debounce cloud saves
    clearTimeout(saveTimer);
    updateSyncStatus('syncing');

    saveTimer = setTimeout(async () => {
        try {
            const docRef = getUserDocRef();
            if (!docRef) return;

            await docRef.set({
                [key]: value,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            updateSyncStatus('synced');
        } catch (error) {
            console.error('Save to cloud error:', error);
            updateSyncStatus('error');
        }
    }, SAVE_DELAY);
}

// Load data (from localStorage, which is synced with cloud on login)
function loadData(key, defaultValue = null) {
    const localKey = 'aozu_' + key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const saved = localStorage.getItem(localKey);

    if (saved === null) return defaultValue;

    try {
        return JSON.parse(saved);
    } catch {
        return saved; // Return as string if not JSON
    }
}

// Update sync status indicator
function updateSyncStatus(status) {
    const indicator = document.getElementById('sync-status');
    if (!indicator) return;

    indicator.className = 'sync-status ' + status;

    switch (status) {
        case 'syncing':
            indicator.textContent = '🔄 同期中...';
            indicator.title = 'データを同期しています';
            break;
        case 'synced':
            indicator.textContent = '✅ 同期済み';
            indicator.title = 'クラウドと同期されています';
            break;
        case 'error':
            indicator.textContent = '⚠️ 同期エラー';
            indicator.title = '同期に失敗しました';
            break;
        default:
            indicator.textContent = '';
    }
}

// Export for use in other modules
window.syncFromCloud = syncFromCloud;
window.syncAllToCloud = syncAllToCloud;
window.saveToCloud = saveToCloud;
window.loadData = loadData;
window.SYNC_KEYS = SYNC_KEYS;
