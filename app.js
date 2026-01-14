/**
 * Aozu Ops Hub - Main Application
 * 社内向け運用ナレッジサイト
 */

// ===== State Management =====
const state = {
    currentPage: 'home',
    rules: [],
    sop: [],
    templates: [],
    userTemplates: [], // User-added templates
    cancellation: {},
    learningLogs: [],
    searchQuery: '',
    filters: {
        platform: 'all',
        category: 'all',
        tplPlatform: 'all',
        insightCategory: 'all'
    }
};

// Make state globally accessible for sync module
window.state = state;

// ===== LocalStorage Keys =====
const STORAGE_KEYS = {
    CHECKLIST: 'aozu_checklist',
    NOTES: 'aozu_notes',
    RULES_CHECKED: 'aozu_rules_checked',
    LEARNING_LOGS: 'aozu_learning_logs',
    USER_TEMPLATES: 'aozu_user_templates'
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    initNavigation();
    initSearch();
    initChecklist();
    initNotes();
    initCalculator();
    initLearningForm();
    initTemplateForm();
    initInsightTabs();
    renderCurrentPage();

    // Initialize authentication
    if (typeof initAuth === 'function') {
        initAuth();
    }
});

// ===== Data Loading =====
async function loadAllData() {
    try {
        const [rules, sop, templates, cancellation] = await Promise.all([
            fetchJSON('data/rules.json'),
            fetchJSON('data/sop.json'),
            fetchJSON('data/templates.json'),
            fetchJSON('data/cancellation.json')
        ]);

        state.rules = rules || [];
        state.sop = sop || [];
        state.templates = templates || [];
        state.cancellation = cancellation || {};

        // Load learning logs from localStorage
        const savedLogs = localStorage.getItem(STORAGE_KEYS.LEARNING_LOGS);
        state.learningLogs = savedLogs ? JSON.parse(savedLogs) : [];

        // Load user templates from localStorage
        const savedTemplates = localStorage.getItem(STORAGE_KEYS.USER_TEMPLATES);
        state.userTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function fetchJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        return await response.json();
    } catch (error) {
        console.warn(`Could not load ${path}:`, error);
        return null;
    }
}

// ===== Navigation =====
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav');

    // Handle hash on load
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'sop', 'templates', 'calculator', 'learning', 'insights', 'ai'].includes(hash)) {
        state.currentPage = hash;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);

            // Close mobile menu
            nav.classList.remove('open');
        });
    });

    // Mobile menu toggle
    mobileMenuBtn?.addEventListener('click', () => {
        nav.classList.toggle('open');
    });

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash) {
            state.currentPage = hash;
            renderCurrentPage();
            updateActiveNav();
        }
    });

    updateActiveNav();
}

function navigateTo(page) {
    state.currentPage = page;
    window.location.hash = page;
    renderCurrentPage();
    updateActiveNav();
}

function updateActiveNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === state.currentPage);
    });
}

function renderCurrentPage() {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show current page
    const currentPageEl = document.getElementById(`page-${state.currentPage}`);
    if (currentPageEl) {
        currentPageEl.classList.add('active');
    }

    // Render page-specific content
    switch (state.currentPage) {
        case 'home':
            renderRules();
            break;
        case 'sop':
            renderSOP();
            initSOPFilters();
            break;
        case 'templates':
            renderTemplates();
            initTemplateFilters();
            break;
        case 'calculator':
            renderPolicyTable();
            break;
        case 'learning':
            renderLearningLogs();
            break;
        case 'insights':
            renderUserInsights();
            filterInsights();
            break;
    }
}

// ===== Search =====
function initSearch() {
    const searchInput = document.getElementById('global-search');

    searchInput?.addEventListener('input', debounce((e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderCurrentPage();
    }, 300));
}

// ===== Rules =====
function renderRules() {
    const container = document.getElementById('rules-container');
    if (!container) return;

    const checkedRules = JSON.parse(localStorage.getItem(STORAGE_KEYS.RULES_CHECKED) || '[]');

    let filteredRules = state.rules;
    if (state.searchQuery) {
        filteredRules = state.rules.filter(rule =>
            rule.title.toLowerCase().includes(state.searchQuery) ||
            rule.description.toLowerCase().includes(state.searchQuery)
        );
    }

    container.innerHTML = filteredRules.map(rule => `
        <div class="rule-item ${checkedRules.includes(rule.id) ? 'checked' : ''}">
            <label>
                <input type="checkbox" 
                    data-rule-id="${rule.id}" 
                    ${checkedRules.includes(rule.id) ? 'checked' : ''}>
                <div>
                    <div class="rule-title">${escapeHTML(rule.title)}</div>
                    <div class="rule-desc">${escapeHTML(rule.description)}</div>
                </div>
            </label>
        </div>
    `).join('');

    // Add event listeners
    container.querySelectorAll('input[data-rule-id]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const ruleId = e.target.dataset.ruleId;
            let checked = JSON.parse(localStorage.getItem(STORAGE_KEYS.RULES_CHECKED) || '[]');

            if (e.target.checked) {
                checked.push(ruleId);
            } else {
                checked = checked.filter(id => id !== ruleId);
            }

            localStorage.setItem(STORAGE_KEYS.RULES_CHECKED, JSON.stringify(checked));
            // Sync to cloud
            if (typeof saveToCloud === 'function') {
                saveToCloud('rulesChecked', checked);
            }
            e.target.closest('.rule-item').classList.toggle('checked', e.target.checked);
        });
    });
}

// ===== Checklist =====
function initChecklist() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST) || '{}');

    document.querySelectorAll('#daily-checklist input[data-check]').forEach(checkbox => {
        const key = checkbox.dataset.check;
        checkbox.checked = saved[key] || false;

        checkbox.addEventListener('change', () => {
            saved[key] = checkbox.checked;
            localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(saved));
            // Sync to cloud
            if (typeof saveToCloud === 'function') {
                saveToCloud('checklist', saved);
            }
        });
    });

    // Reset button
    document.getElementById('reset-checklist')?.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEYS.CHECKLIST);
        document.querySelectorAll('#daily-checklist input[data-check]').forEach(cb => {
            cb.checked = false;
        });
        showToast('チェックリストをリセットしました');
    });
}

// ===== Notes =====
function initNotes() {
    const textarea = document.getElementById('personal-notes');
    if (!textarea) return;

    // Load saved notes
    textarea.value = localStorage.getItem(STORAGE_KEYS.NOTES) || '';

    // Auto-save on input
    textarea.addEventListener('input', debounce(() => {
        localStorage.setItem(STORAGE_KEYS.NOTES, textarea.value);
        // Sync to cloud
        if (typeof saveToCloud === 'function') {
            saveToCloud('notes', textarea.value);
        }
    }, 500));
}

// ===== SOP =====
function renderSOP() {
    const container = document.getElementById('sop-container');
    if (!container) return;

    let filteredSOP = state.sop;

    // Apply platform filter
    if (state.filters.platform !== 'all') {
        filteredSOP = filteredSOP.filter(sop =>
            sop.id.toLowerCase() === state.filters.platform.toLowerCase()
        );
    }

    // Apply search
    if (state.searchQuery) {
        filteredSOP = filteredSOP.filter(sop =>
            sop.platform.toLowerCase().includes(state.searchQuery) ||
            sop.tips?.some(tip => tip.toLowerCase().includes(state.searchQuery)) ||
            sop.checkOrder?.some(item => item.toLowerCase().includes(state.searchQuery))
        );
    }

    container.innerHTML = filteredSOP.map(sop => `
        <div class="sop-card" data-sop-id="${sop.id}">
            <div class="sop-header" onclick="toggleSOP('${sop.id}')">
                <div class="sop-title">
                    <span class="sop-icon">${sop.icon || '📋'}</span>
                    <span>${escapeHTML(sop.platform)}</span>
                </div>
                <span class="sop-toggle">▼</span>
            </div>
            <div class="sop-content">
                ${sop.loginUrl ? `
                    <div class="sop-section">
                        <h4>ログインURL</h4>
                        <a href="${sop.loginUrl}" target="_blank" class="sop-link">
                            🔗 ${sop.loginUrl}
                        </a>
                    </div>
                ` : ''}
                
                ${sop.hostApp ? `
                    <div class="sop-section">
                        <h4>ホスト用アプリ</h4>
                        <a href="${sop.hostApp}" target="_blank" class="sop-link">
                            📱 App Store でダウンロード
                        </a>
                    </div>
                ` : ''}
                
                ${sop.credentialNote ? `
                    <div class="sop-section">
                        <div class="credential-note">🔐 ${escapeHTML(sop.credentialNote)}</div>
                    </div>
                ` : ''}
                
                ${sop.tips && sop.tips.length > 0 ? `
                    <div class="sop-section">
                        <h4>よくある詰まり・注意点</h4>
                        <ul class="sop-list">
                            ${sop.tips.map(tip => `<li>${escapeHTML(tip)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${sop.checkOrder && sop.checkOrder.length > 0 ? `
                    <div class="sop-section">
                        <h4>確認順</h4>
                        <ul class="sop-list">
                            ${sop.checkOrder.map((item, i) => `<li>${i + 1}. ${escapeHTML(item)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function toggleSOP(id) {
    const card = document.querySelector(`.sop-card[data-sop-id="${id}"]`);
    card?.classList.toggle('expanded');
}

function initSOPFilters() {
    document.querySelectorAll('#page-sop .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.filters.platform = btn.dataset.platform;

            // Update active state
            document.querySelectorAll('#page-sop .filter-btn').forEach(b =>
                b.classList.remove('active')
            );
            btn.classList.add('active');

            renderSOP();
        });
    });
}

// ===== Templates =====
function renderTemplates() {
    const container = document.getElementById('templates-container');
    if (!container) return;

    // Combine built-in and user templates
    let allTemplates = [...state.templates, ...state.userTemplates];

    // Apply category filter
    if (state.filters.category !== 'all') {
        allTemplates = allTemplates.filter(tpl =>
            tpl.category === state.filters.category
        );
    }

    // Apply platform filter
    if (state.filters.tplPlatform !== 'all') {
        allTemplates = allTemplates.filter(tpl =>
            tpl.platform?.includes(state.filters.tplPlatform)
        );
    }

    // Apply search
    if (state.searchQuery) {
        allTemplates = allTemplates.filter(tpl =>
            tpl.title.toLowerCase().includes(state.searchQuery) ||
            tpl.body.toLowerCase().includes(state.searchQuery) ||
            tpl.category.toLowerCase().includes(state.searchQuery)
        );
    }

    if (allTemplates.length === 0) {
        container.innerHTML = '<div class="logs-empty">テンプレートが見つかりません</div>';
        return;
    }

    container.innerHTML = allTemplates.map(tpl => `
        <div class="template-card ${tpl.userAdded ? 'user-added' : ''}" data-template-id="${tpl.id}">
            <div class="template-header">
                <div class="template-title">${escapeHTML(tpl.title)}</div>
                <div class="template-tags">
                    <span class="template-tag category">${escapeHTML(tpl.category)}</span>
                    ${tpl.platform?.map(p => `<span class="template-tag">${escapeHTML(p)}</span>`).join('') || ''}
                </div>
                ${tpl.userAdded ? `<button class="template-delete" onclick="deleteTemplate('${tpl.id}')" title="削除">×</button>` : ''}
            </div>
            <div class="template-body">${escapeHTML(tpl.body)}</div>
            <div class="template-footer">
                <button class="copy-btn" onclick="copyTemplate('${tpl.id}', false, ${tpl.userAdded || false})">
                    📋 コピー
                </button>
                ${tpl.emoji_version ? `
                    <button class="copy-btn" onclick="copyTemplate('${tpl.id}', true, ${tpl.userAdded || false})">
                        😊 絵文字版コピー
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function copyTemplate(id, useEmoji = false, isUserTemplate = false) {
    const templateList = isUserTemplate ? state.userTemplates : state.templates;
    const template = templateList.find(t => t.id === id);
    if (!template) return;

    const text = useEmoji && template.emoji_version ? template.emoji_version : template.body;

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 コピーしました！');

        // Visual feedback
        const btn = document.querySelector(`.template-card[data-template-id="${id}"] .copy-btn`);
        if (btn) {
            btn.classList.add('copied');
            const originalText = btn.textContent;
            btn.textContent = '✓ コピー済み';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.textContent = originalText;
            }, 2000);
        }
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('コピーに失敗しました');
    });
}

function deleteTemplate(id) {
    if (!confirm('このテンプレートを削除しますか？')) return;

    state.userTemplates = state.userTemplates.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.USER_TEMPLATES, JSON.stringify(state.userTemplates));
    // Sync to cloud
    if (typeof saveToCloud === 'function') {
        saveToCloud('userTemplates', state.userTemplates);
    }
    renderTemplates();
    showToast('テンプレートを削除しました');
}

function initTemplateFilters() {
    // Category filters
    document.querySelectorAll('#page-templates .filter-btn[data-category]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.filters.category = btn.dataset.category;

            document.querySelectorAll('#page-templates .filter-btn[data-category]').forEach(b =>
                b.classList.remove('active')
            );
            btn.classList.add('active');

            renderTemplates();
        });
    });

    // Platform sub-filters
    document.querySelectorAll('#page-templates .filter-btn[data-tpl-platform]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.filters.tplPlatform = btn.dataset.tplPlatform;

            document.querySelectorAll('#page-templates .filter-btn[data-tpl-platform]').forEach(b =>
                b.classList.remove('active')
            );
            btn.classList.add('active');

            renderTemplates();
        });
    });
}

function initTemplateForm() {
    const toggleBtn = document.getElementById('toggle-template-form');
    const form = document.getElementById('template-form');
    const cancelBtn = document.getElementById('cancel-template-form');

    toggleBtn?.addEventListener('click', () => {
        form?.classList.toggle('hidden');
        toggleBtn.textContent = form?.classList.contains('hidden') ? '📝 入力フォームを開く' : '❌ フォームを閉じる';
    });

    cancelBtn?.addEventListener('click', () => {
        form?.classList.add('hidden');
        toggleBtn.textContent = '📝 入力フォームを開く';
        form?.reset();
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get selected platforms
        const platformCheckboxes = form.querySelectorAll('input[name="platform"]:checked');
        const platforms = Array.from(platformCheckboxes).map(cb => cb.value);

        if (platforms.length === 0) {
            showToast('プラットフォームを選択してください');
            return;
        }

        const newTemplate = {
            id: 'user-' + Date.now().toString(),
            title: document.getElementById('new-tpl-title').value,
            category: document.getElementById('new-tpl-category').value,
            platform: platforms,
            body: document.getElementById('new-tpl-body').value,
            emoji_version: document.getElementById('new-tpl-emoji').value || null,
            userAdded: true
        };

        state.userTemplates.push(newTemplate);
        localStorage.setItem(STORAGE_KEYS.USER_TEMPLATES, JSON.stringify(state.userTemplates));
        // Sync to cloud
        if (typeof saveToCloud === 'function') {
            saveToCloud('userTemplates', state.userTemplates);
        }

        form.reset();
        form.classList.add('hidden');
        toggleBtn.textContent = '📝 入力フォームを開く';

        renderTemplates();
        showToast('✨ テンプレートを追加しました！');
    });
}

// ===== Calculator =====
function initCalculator() {
    const calcBtn = document.getElementById('calculate-btn');
    const daysInput = document.getElementById('days-before');
    const platformSelect = document.getElementById('platform-select');

    calcBtn?.addEventListener('click', () => {
        calculateRefund();
    });

    daysInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateRefund();
        }
    });

    platformSelect?.addEventListener('change', () => {
        renderPolicyTable();
    });
}

function calculateRefund() {
    const days = parseInt(document.getElementById('days-before').value);
    const platform = document.getElementById('platform-select').value;
    const resultDiv = document.getElementById('calc-result');

    if (isNaN(days) || days < 0) {
        showToast('日数を入力してください');
        return;
    }

    const policy = state.cancellation[platform];
    if (!policy) {
        showToast('ポリシーが見つかりません');
        return;
    }

    // Find applicable policy
    let refundPercent = 0;
    let chargePercent = 100;
    let matchedRange = '';

    for (const rule of policy.policy) {
        const [minStr, maxStr] = parseRange(rule.range);

        if (days >= minStr && days <= maxStr) {
            refundPercent = rule.refund;
            chargePercent = rule.charge;
            matchedRange = rule.range;
            break;
        }
    }

    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `
        <div class="calc-result-label">返金申請に入力する %</div>
        <div class="calc-result-value">${refundPercent}%</div>
        <div class="calc-result-note">
            ${matchedRange ? `該当: ${matchedRange}` : ''}<br>
            キャンセル料（ゲスト負担）: ${chargePercent}%<br>
            返金%（申請用）: ${refundPercent}%
        </div>
    `;
}

function parseRange(rangeStr) {
    // Parse ranges like "30日前〜15日前" or "前日〜当日"
    if (rangeStr.includes('当日') || rangeStr === '前日〜当日') {
        return [0, 1];
    }
    if (rangeStr.includes('前日')) {
        return [1, 1];
    }

    const matches = rangeStr.match(/(\d+)/g);
    if (matches && matches.length >= 2) {
        return [parseInt(matches[1]), parseInt(matches[0])];
    }
    if (matches && matches.length === 1) {
        return [parseInt(matches[0]), parseInt(matches[0])];
    }

    return [0, 0];
}

function renderPolicyTable() {
    const container = document.getElementById('policy-table-container');
    const platform = document.getElementById('platform-select')?.value || 'spacee';

    if (!container) return;

    const policy = state.cancellation[platform];
    if (!policy) {
        container.innerHTML = '<p>ポリシーデータがありません</p>';
        return;
    }

    container.innerHTML = `
        <p style="margin-bottom: 1rem; color: var(--text-secondary);">
            ${policy.note || ''}
        </p>
        <table class="policy-table">
            <thead>
                <tr>
                    <th>期間</th>
                    <th>キャンセル料（ゲスト負担）</th>
                    <th>返金%（申請用）</th>
                </tr>
            </thead>
            <tbody>
                ${policy.policy.map(rule => `
                    <tr>
                        <td>${escapeHTML(rule.range)}</td>
                        <td>${rule.charge}%</td>
                        <td><strong>${rule.refund}%</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== Learning Log =====
function initLearningForm() {
    const form = document.getElementById('learning-form');
    const dateInput = document.getElementById('log-date');
    const exportBtn = document.getElementById('export-logs');

    // Set default date to today
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const entry = {
            id: Date.now().toString(),
            date: document.getElementById('log-date').value,
            platform: document.getElementById('log-platform').value,
            category: document.getElementById('log-category').value,
            incident: document.getElementById('log-incident').value,
            action: document.getElementById('log-action').value,
            prevention: document.getElementById('log-prevention').value,
            published: document.getElementById('log-publish').checked
        };

        state.learningLogs.unshift(entry);
        localStorage.setItem(STORAGE_KEYS.LEARNING_LOGS, JSON.stringify(state.learningLogs));
        // Sync to cloud
        if (typeof saveToCloud === 'function') {
            saveToCloud('learningLogs', state.learningLogs);
        }

        form.reset();
        dateInput.value = new Date().toISOString().split('T')[0];

        renderLearningLogs();
        showToast('💾 学びを追加しました');
    });

    exportBtn?.addEventListener('click', exportLearningLogs);
}

function renderLearningLogs() {
    const container = document.getElementById('learning-logs');
    if (!container) return;

    let logs = state.learningLogs;

    // Apply search
    if (state.searchQuery) {
        logs = logs.filter(log =>
            log.incident.toLowerCase().includes(state.searchQuery) ||
            log.action.toLowerCase().includes(state.searchQuery) ||
            log.platform.toLowerCase().includes(state.searchQuery)
        );
    }

    if (logs.length === 0) {
        container.innerHTML = '<div class="logs-empty">まだ記録がありません</div>';
        return;
    }

    container.innerHTML = logs.map(log => `
        <div class="log-entry ${log.published ? 'published' : ''}" data-log-id="${log.id}">
            <button class="log-delete" onclick="deleteLog('${log.id}')" title="削除">×</button>
            <div class="log-header">
                <span class="log-date">
                    ${escapeHTML(log.date)}
                    ${log.published ? '<span class="log-publish-badge">💡 公開中</span>' : ''}
                </span>
                <span class="log-platform">${escapeHTML(log.platform)}</span>
            </div>
            <div class="log-incident">📌 ${escapeHTML(log.incident)}</div>
            <div class="log-section">
                <strong>対応:</strong>
                <p>${escapeHTML(log.action)}</p>
            </div>
            ${log.prevention ? `
                <div class="log-section">
                    <strong>再発防止:</strong>
                    <p>${escapeHTML(log.prevention)}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function deleteLog(id) {
    if (!confirm('この記録を削除しますか？')) return;

    state.learningLogs = state.learningLogs.filter(log => log.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEARNING_LOGS, JSON.stringify(state.learningLogs));
    // Sync to cloud
    if (typeof saveToCloud === 'function') {
        saveToCloud('learningLogs', state.learningLogs);
    }
    renderLearningLogs();
    showToast('削除しました');
}

function exportLearningLogs() {
    const dataStr = JSON.stringify(state.learningLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('📤 エクスポートしました');
}

// ===== Insights =====
function initInsightTabs() {
    document.querySelectorAll('.tab-btn[data-insight-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.filters.insightCategory = btn.dataset.insightCat;

            document.querySelectorAll('.tab-btn[data-insight-cat]').forEach(b =>
                b.classList.remove('active')
            );
            btn.classList.add('active');

            renderUserInsights();
            filterInsights();
        });
    });
}

function filterInsights() {
    const category = state.filters.insightCategory;

    document.querySelectorAll('.insights-section[data-insight-category]').forEach(section => {
        const sectionCategory = section.dataset.insightCategory;

        if (category === 'all') {
            section.classList.remove('hidden');
        } else {
            section.classList.toggle('hidden', sectionCategory !== category);
        }
    });
}

function renderUserInsights() {
    const container = document.getElementById('user-insights-container');
    if (!container) return;

    // Get published learning logs
    let publishedLogs = state.learningLogs.filter(log => log.published);

    // Apply category filter
    if (state.filters.insightCategory !== 'all') {
        publishedLogs = publishedLogs.filter(log => log.category === state.filters.insightCategory);
    }

    if (publishedLogs.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="section-card">
            <h3 class="section-title">✨ 最近の学び（自分で追加）</h3>
            ${publishedLogs.map(log => `
                <div class="user-insight-card">
                    <div class="insight-header">
                        <div class="insight-title">${escapeHTML(log.incident)}</div>
                        <div class="insight-meta">
                            <span class="insight-badge platform">${escapeHTML(log.platform)}</span>
                            <span class="insight-badge category">${getCategoryIcon(log.category)} ${escapeHTML(log.category)}</span>
                        </div>
                    </div>
                    <div class="insight-content">
                        <strong>対応:</strong> ${escapeHTML(log.action)}
                    </div>
                    ${log.prevention ? `
                        <div class="insight-example">
                            💡 再発防止: ${escapeHTML(log.prevention)}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function getCategoryIcon(category) {
    const icons = {
        '民泊': '🏡',
        'レンタルスペース': '🏢',
        '共通': '📋'
    };
    return icons[category] || '📋';
}

// ===== Utilities =====
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Make functions globally available
window.toggleSOP = toggleSOP;
window.copyTemplate = copyTemplate;
window.deleteTemplate = deleteTemplate;
window.deleteLog = deleteLog;

// Copy prompt function for AI page
function copyPrompt(button) {
    const promptCard = button.closest('.prompt-card');
    const promptBody = promptCard.querySelector('.prompt-body');
    const text = promptBody.textContent;

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 プロンプトをコピーしました！');

        button.classList.add('copied');
        const originalText = button.textContent;
        button.textContent = '✓ コピー済み';
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('コピーに失敗しました');
    });
}
window.copyPrompt = copyPrompt;
