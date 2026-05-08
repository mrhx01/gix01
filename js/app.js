(function () {
    // DOM elements
    const dynamicFiltersDiv = document.getElementById('dynamicFilters');
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const tokenInput = document.getElementById('githubToken');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultStatsSpan = document.getElementById('resultStats');
    const paginationWrapper = document.getElementById('paginationWrapper');
    const viewBtns = document.querySelectorAll('.view-btn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const modalOverlay = document.getElementById('statsModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalUsernameSpan = document.getElementById('modalUsername');
    const modalContentDiv = document.getElementById('modalContent');
    const trendingDiv = document.getElementById('trendingRepos');
    const exportLink = document.getElementById('exportResultsLink');

    let currentResource = 'repositories';
    let currentPage = 1;
    let totalCount = 0;
    let isLoading = false;
    let lastSearchState = null;
    let currentView = 'grid';
    let lastResultsData = null; // store last items for export
    const PER_PAGE = 20;

    // ---------- Token persistence ----------
    function saveToken(token) { if (token) localStorage.setItem('gix01_token', token); else localStorage.removeItem('gix01_token'); }
    function loadToken() { const saved = localStorage.getItem('gix01_token'); if (saved) tokenInput.value = saved; }
    tokenInput.addEventListener('change', () => { saveToken(tokenInput.value.trim()); });
    tokenInput.addEventListener('blur', () => { saveToken(tokenInput.value.trim()); });
    loadToken();

    // Theme
    function setTheme() { const saved = localStorage.getItem('gix01_theme'); if (saved === 'light') document.body.classList.add('light'); else document.body.classList.remove('light'); }
    darkModeToggle.addEventListener('click', () => { document.body.classList.toggle('light'); localStorage.setItem('gix01_theme', document.body.classList.contains('light') ? 'light' : 'dark'); setTheme(); });
    setTheme();

    // Helper: ensure number inputs have min=0
    function enforceNumberMinZero() {
        document.querySelectorAll('input[type="number"]').forEach(inp => { inp.setAttribute('min', '0'); inp.addEventListener('input', function () { if (this.value < 0) this.value = 0; }); });
    }

    // Render filters (with min=0)
    function renderFilters() {
        const type = currentResource;
        let html = `<div class="filter-grid">`;
        html += `<div class="input-field"><label>🔎 Main keyword</label><input type="text" id="mainQuery" placeholder="react, tailwind, data science"></div>`;
        if (type === 'repositories') {
            html += `<div class="input-field"><label>⭐ Min stars</label><input type="number" id="minStars" placeholder="≥ 100" min="0" value=""></div>
                 <div class="input-field"><label>🍴 Min forks</label><input type="number" id="minForks" placeholder="≥ 10" min="0" value=""></div>
                 <div class="input-field"><label>📜 License</label><select id="license"><option value="">Any</option><option value="mit">MIT</option><option value="apache-2.0">Apache-2.0</option><option value="gpl-3.0">GPL-3.0</option></select></div>
                 <div class="input-field"><label>💻 Language</label><input type="text" id="language" placeholder="python, rust"></div>
                 <div class="input-field"><label><input type="checkbox" id="excludeForks"> 🚫 Exclude forks</label><label><input type="checkbox" id="excludeArchived"> 📦 Exclude archived</label></div>`;
        } else if (type === 'users') {
            html += `<div class="input-field"><label>👥 Min followers</label><input type="number" id="minFollowers" placeholder="≥ 500" min="0" value=""></div>
                 <div class="input-field"><label>📍 Location</label><input type="text" id="location" placeholder="San Francisco"></div>
                 <div class="input-field"><label>🏢 Company</label><input type="text" id="company" placeholder="Google"></div>
                 <div class="input-field"><label>📦 Min repos</label><input type="number" id="minRepos" placeholder="≥ 5" min="0" value=""></div>`;
        } else if (type === 'issues') {
            html += `<div class="input-field"><label>🏷️ State</label><select id="issueState"><option value="">Any</option><option value="open">Open</option><option value="closed">Closed</option></select></div>
                 <div class="input-field"><label>🏷️ Label</label><input type="text" id="label" placeholder="bug"></div>
                 <div class="input-field"><label>👤 Author</label><input type="text" id="author" placeholder="username"></div>
                 <div class="input-field"><label>📁 Repo</label><input type="text" id="repo" placeholder="facebook/react"></div>`;
        } else if (type === 'code') {
            html += `<div class="input-field"><label>📄 Extension</label><input type="text" id="extension" placeholder=".js"></div>
                 <div class="input-field"><label>📂 Path</label><input type="text" id="path" placeholder="src"></div>
                 <div class="input-field"><label>💻 Language</label><input type="text" id="codeLang" placeholder="TypeScript"></div>
                 <div class="input-field"><label>📦 Repo filter</label><input type="text" id="repoFilter" placeholder="vercel/next.js"></div>`;
        }
        const sortFields = (type === 'repositories') ? ['best', 'stars', 'forks', 'updated'] : (type === 'users') ? ['best', 'followers', 'repositories', 'joined'] : (type === 'issues') ? ['best', 'comments', 'created', 'updated'] : [];
        if (sortFields.length && type !== 'code') {
            html += `<div class="input-field"><label>📊 Sort by</label><select id="sortSelect">${sortFields.map(f => `<option value="${f}" ${f === 'best' ? 'selected' : ''}>${f.charAt(0).toUpperCase() + f.slice(1)}</option>`).join('')}</select></div>`;
            html += `<div class="input-field"><label>⚡ Order</label><select id="orderSelect"><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>`;
        } else { html += `<input type="hidden" id="sortSelect" value="best"><input type="hidden" id="orderSelect" value="desc">`; }
        html += `<div class="input-field" style="grid-column: span 1;"><label>✨ Custom qualifiers (anything)</label><input type="text" id="customQualifier" placeholder="user:google sort:stars language:python"></div>`;
        html += `</div>`;
        dynamicFiltersDiv.innerHTML = html;
        enforceNumberMinZero();
        const sortSel = document.getElementById('sortSelect');
        const orderSel = document.getElementById('orderSelect');
        if (sortSel && orderSel && sortSel.value === 'best') orderSel.disabled = true;
        if (sortSel) sortSel.addEventListener('change', () => { if (orderSel) orderSel.disabled = sortSel.value === 'best'; });
    }

    function buildQuery() {
        const main = document.getElementById('mainQuery')?.value.trim() || '';
        const custom = document.getElementById('customQualifier')?.value.trim() || '';
        let parts = [];
        if (main) parts.push(main);
        const type = currentResource;
        if (type === 'repositories') {
            let stars = document.getElementById('minStars')?.value; if (stars && !isNaN(parseInt(stars)) && parseInt(stars) >= 0) parts.push(`stars:>=${parseInt(stars)}`);
            let forks = document.getElementById('minForks')?.value; if (forks && !isNaN(parseInt(forks)) && parseInt(forks) >= 0) parts.push(`forks:>=${parseInt(forks)}`);
            let lic = document.getElementById('license')?.value; if (lic) parts.push(`license:${lic}`);
            let lang = document.getElementById('language')?.value.trim(); if (lang) parts.push(`language:${lang}`);
            if (document.getElementById('excludeForks')?.checked) parts.push(`fork:false`);
            if (document.getElementById('excludeArchived')?.checked) parts.push(`archived:false`);
        } else if (type === 'users') {
            let f = document.getElementById('minFollowers')?.value; if (f && !isNaN(parseInt(f)) && parseInt(f) >= 0) parts.push(`followers:>=${parseInt(f)}`);
            let loc = document.getElementById('location')?.value.trim(); if (loc) parts.push(`location:"${loc}"`);
            let comp = document.getElementById('company')?.value.trim(); if (comp) parts.push(`company:"${comp}"`);
            let reposMin = document.getElementById('minRepos')?.value; if (reposMin && !isNaN(parseInt(reposMin)) && parseInt(reposMin) >= 0) parts.push(`repos:>=${parseInt(reposMin)}`);
        } else if (type === 'issues') {
            let state = document.getElementById('issueState')?.value; if (state && state !== '') parts.push(`state:${state}`);
            let label = document.getElementById('label')?.value.trim(); if (label) parts.push(`label:"${label}"`);
            let author = document.getElementById('author')?.value.trim(); if (author) parts.push(`author:${author}`);
            let repo = document.getElementById('repo')?.value.trim(); if (repo) parts.push(`repo:${repo}`);
        } else if (type === 'code') {
            let ext = document.getElementById('extension')?.value.trim(); if (ext) parts.push(`extension:${ext.replace(/^\./, '')}`);
            let path = document.getElementById('path')?.value.trim(); if (path) parts.push(`path:${path}`);
            let clang = document.getElementById('codeLang')?.value.trim(); if (clang) parts.push(`language:${clang}`);
            let rfilter = document.getElementById('repoFilter')?.value.trim(); if (rfilter) parts.push(`repo:${rfilter}`);
        }
        if (custom) parts.push(custom);
        let final = parts.join(' ');
        if (!final.trim()) return '';
        return final;
    }

    function showModalMessage(title, content, isError = false) {
        modalUsernameSpan.innerText = title;
        modalContentDiv.innerHTML = `<div class="error-msg" style="background:var(--danger)20;">${content}</div>`;
        modalOverlay.classList.add('active');
    }

    async function searchGitHub(resetPage = true, pageOverride = null) {
        const query = buildQuery();
        if (!query) { resultsContainer.innerHTML = `<div class="error-msg">⚠️ Please enter keyword, filter, or custom qualifier.</div>`; return; }
        const sortEl = document.getElementById('sortSelect');
        let sort = sortEl ? sortEl.value : 'best';
        let order = document.getElementById('orderSelect')?.value || 'desc';
        if (sort === 'best') order = 'desc';
        let page = pageOverride !== null ? pageOverride : (resetPage ? 1 : currentPage);
        if (resetPage) currentPage = 1;
        else currentPage = page;
        const token = tokenInput.value.trim();
        lastSearchState = { resource: currentResource, query, sort, order, token, page: currentPage };
        isLoading = true;
        resultsContainer.innerHTML = `<div style="text-align:center;"><div class="loader-small" style="width:40px;height:40px;"></div><p>Searching GitHub...</p></div>`;
        paginationWrapper.style.display = 'none';
        try {
            let endpoint = '';
            if (currentResource === 'repositories') endpoint = 'https://api.github.com/search/repositories';
            else if (currentResource === 'users') endpoint = 'https://api.github.com/search/users';
            else if (currentResource === 'issues') endpoint = 'https://api.github.com/search/issues';
            else endpoint = 'https://api.github.com/search/code';
            const url = new URL(endpoint);
            url.searchParams.append('q', query);
            url.searchParams.append('per_page', PER_PAGE);
            url.searchParams.append('page', currentPage);
            if (sort !== 'best' && currentResource !== 'code') { url.searchParams.append('sort', sort); url.searchParams.append('order', order); }
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            if (token) headers['Authorization'] = `token ${token}`;
            const resp = await fetch(url, { headers });
            if (!resp.ok) throw new Error(`API Error ${resp.status}: ${resp.status === 403 ? 'Rate limit. Add token or wait.' : ''}`);
            const data = await resp.json();
            totalCount = data.total_count || 0;
            const items = data.items || [];
            lastResultsData = items;
            if (totalCount === 0) { resultsContainer.innerHTML = `<div class="error-msg">😕 No results for "${query.substring(0, 60)}"</div>`; resultStatsSpan.innerText = '0 results'; return; }
            await renderResultsByType(items, currentResource);
            resultStatsSpan.innerText = `${totalCount.toLocaleString()} items (${items.length} shown)`;
            renderPagination(totalCount);
        } catch (err) { resultsContainer.innerHTML = `<div class="error-msg">❌ ${err.message}</div>`; } finally { isLoading = false; }
    }

    async function enrichUserCard(userLogin, cardElement, token) {
        try {
            const headers = token ? { 'Authorization': `token ${token}` } : {};
            const userUrl = `https://api.github.com/users/${userLogin}`;
            const resp = await fetch(userUrl, { headers });
            if (resp.ok) {
                const userData = await resp.json();
                const statsSpan = cardElement.querySelector('.user-stats-row');
                if (statsSpan) {
                    statsSpan.innerHTML = `👥 ${userData.followers?.toLocaleString() || 0} followers &nbsp;| 📦 ${userData.public_repos?.toLocaleString() || 0} repos`;
                }
            }
        } catch (e) { console.warn(e); }
    }

    async function renderResultsByType(items, type) {
        if (type === 'users') {
            let userCardsHtml = [];
            const token = tokenInput.value.trim();
            for (let user of items) {
                userCardsHtml.push(`
            <div class="user-card" data-username="${user.login}">
              <div class="user-header">
                <img class="user-avatar" src="${user.avatar_url}" alt="avatar" onerror="this.src='https://github.com/identicons/${user.login}.png'">
                <div>
                  <div class="user-login"><a href="${user.html_url}" target="_blank" style="color:var(--accent);">${user.login}</a></div>
                  <div class="user-stats-row">👥 loading... &nbsp;| 📦 loading...</div>
                </div>
              </div>
              <button class="detail-btn" data-user="${user.login}">📊 Load deep stats (contributions, streak & graph)</button>
            </div>
          `);
            }
            resultsContainer.innerHTML = `<div class="result-cards ${currentView}">${userCardsHtml.join('')}</div>`;
            for (let user of items) {
                const cardDiv = resultsContainer.querySelector(`.user-card[data-username="${user.login}"]`);
                if (cardDiv) {
                    enrichUserCard(user.login, cardDiv, token);
                    const btn = cardDiv.querySelector('.detail-btn');
                    btn.addEventListener('click', () => showUserStatsModal(user.login, token));
                }
            }
        } else {
            let itemsHtml = '';
            if (type === 'repositories') itemsHtml = items.map(r => `<div class="card"><div class="card-title"><a href="${r.html_url}" target="_blank" style="color:var(--accent);">${r.full_name}</a></div><div class="card-description">${(r.description || '').substring(0, 120)}</div><div>⭐ ${r.stargazers_count} 🍴 ${r.forks_count} 💻 ${r.language || '?'}</div></div>`).join('');
            else if (type === 'issues') itemsHtml = items.map(i => `<div class="card"><div class="card-title"><a href="${i.html_url}" target="_blank" style="color:var(--accent);">${i.title}</a></div><div>#${i.number} · ${i.state} · comments: ${i.comments}</div><div>repo: ${i.repository?.full_name}</div></div>`).join('');
            else if (type === 'code') itemsHtml = items.map(c => `<div class="card"><div class="card-title"><a href="${c.html_url}" target="_blank" style="color:var(--accent);">${c.repository?.full_name}/${c.path}</a></div><div>📄 ${c.name}</div></div>`).join('');
            resultsContainer.innerHTML = `<div class="result-cards ${currentView}">${itemsHtml}</div>`;
        }
    }

    async function showUserStatsModal(username, token) {
        if (!token || token.trim() === '') {
            showModalMessage('🔐 Token Required', `Deep statistics require a GitHub Personal Access Token.<br><br>👉 <a href="https://github.com/settings/tokens" target="_blank" style="color:var(--accent);">Get your token here</a> and paste it in the field above.`, true);
            return;
        }
        modalUsernameSpan.innerText = `📊 ${username} · GitHub Analytics`;
        modalContentDiv.innerHTML = `<div style="text-align:center"><div class="loader-small"></div> Fetching contributions, streak & activity...</div>`;
        modalOverlay.classList.add('active');
        try {
            const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
            let reposUrl = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;
            let reposResp = await fetch(reposUrl, { headers });
            let repos = await reposResp.json();
            let totalStars = Array.isArray(repos) ? repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0) : 0;
            let eventsUrl = `https://api.github.com/users/${username}/events/public?per_page=100`;
            let evResp = await fetch(eventsUrl, { headers });
            let events = await evResp.json();
            let pushEvents = Array.isArray(events) ? events.filter(e => e.type === 'PushEvent') : [];
            let commitCount = pushEvents.reduce((acc, e) => acc + (e.payload?.size || 0), 0);
            let pushDays = new Set();
            pushEvents.forEach(ev => { if (ev.created_at) pushDays.add(ev.created_at.split('T')[0]); });
            let dates = Array.from(pushDays).sort();
            let longestStreak = 0, currentStreak = 0;
            for (let i = 0; i < dates.length; i++) {
                if (i === 0) currentStreak = 1;
                else {
                    let prev = new Date(dates[i - 1]), curr = new Date(dates[i]);
                    let diff = (curr - prev) / (1000 * 3600 * 24);
                    if (diff === 1) currentStreak++;
                    else { longestStreak = Math.max(longestStreak, currentStreak); currentStreak = 1; }
                }
            }
            longestStreak = Math.max(longestStreak, currentStreak);
            let weekdayActivity = [0, 0, 0, 0, 0, 0, 0];
            pushEvents.forEach(ev => { if (ev.created_at) { let day = new Date(ev.created_at).getDay(); weekdayActivity[day]++; } });
            const chartId = `modal-chart-${Date.now()}`;
            modalContentDiv.innerHTML = `
          <div class="stat-row"><span>⭐ Total stars (all repos)</span><strong>${totalStars.toLocaleString()}</strong></div>
          <div class="stat-row"><span>📦 Public repos</span><strong>${repos.length}</strong></div>
          <div class="stat-row"><span>💾 Recent push commits</span><strong>${commitCount}</strong></div>
          <div class="stat-row"><span>🔥 Longest streak (days with pushes)</span><strong>${longestStreak} days</strong></div>
          <canvas id="${chartId}" width="300" height="150" style="width:100%; max-height:180px; margin-top:1rem;"></canvas>
          <div style="font-size:0.65rem; text-align:center;">Weekly push activity (Sun - Sat)</div>
        `;
            const ctx = document.getElementById(chartId).getContext('2d');
            new Chart(ctx, { type: 'bar', data: { labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], datasets: [{ label: 'Push events', data: weekdayActivity, backgroundColor: '#5f7ef2' }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } } });
        } catch (err) {
            modalContentDiv.innerHTML = `<div class="error-msg">Failed to load stats: ${err.message}. Make sure token has 'user' scope.</div>`;
        }
    }

    function renderPagination(total) {
        let maxTotal = Math.min(total, 1000);
        let totalPages = Math.ceil(maxTotal / PER_PAGE);
        if (totalPages <= 1) { paginationWrapper.style.display = 'none'; return; }
        paginationWrapper.style.display = 'flex';
        paginationWrapper.innerHTML = `<div class="pagination-bar"><button class="page-btn" id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''}>◀ Prev</button><span>Page ${currentPage} / ${totalPages}</span><button class="page-btn" id="nextPageBtn" ${currentPage === totalPages ? 'disabled' : ''}>Next ▶</button></div>`;
        document.getElementById('prevPageBtn')?.addEventListener('click', () => changePage(currentPage - 1));
        document.getElementById('nextPageBtn')?.addEventListener('click', () => changePage(currentPage + 1));
    }
    async function changePage(newPage) { if (isLoading) return; if (!lastSearchState) return searchGitHub(true); let totalLimit = Math.min(totalCount, 1000); let maxPage = Math.ceil(totalLimit / PER_PAGE); if (newPage < 1 || newPage > maxPage) return; currentPage = newPage; await searchGitHub(false, newPage); }

    function resetAll() {
        currentResource = 'repositories';
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.type-btn[data-type="repositories"]').classList.add('active');
        renderFilters();
        resultsContainer.innerHTML = `<div class="empty-msg">✨ Filters cleared.</div>`;
        resultStatsSpan.innerText = 'Reset';
        paginationWrapper.style.display = 'none';
        currentPage = 1;
        lastSearchState = null;
        lastResultsData = null;
    }
    function initTabs() {
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentResource = btn.dataset.type;
                renderFilters();
                resultsContainer.innerHTML = `<div class="empty-msg">Switched to ${currentResource}. Adjust filters & search.</div>`;
                currentPage = 1;
                lastSearchState = null;
                lastResultsData = null;
            });
        });
    }
    document.getElementById('toggleTokenVisibility').addEventListener('click', function () {
        const type = tokenInput.getAttribute('type') === 'password' ? 'text' : 'password';
        tokenInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🙈';
    });
    function setViewMode(mode) {
        currentView = mode;
        const container = document.querySelector('.result-cards');
        if (container) { container.classList.remove('grid', 'horizontal', 'compact'); container.classList.add(mode); }
        document.querySelectorAll('.view-btn').forEach(btn => { if (btn.dataset.view === mode) btn.classList.add('active'); else btn.classList.remove('active'); });
        localStorage.setItem('gix01_view', mode);
    }
    viewBtns.forEach(btn => btn.addEventListener('click', () => { setViewMode(btn.dataset.view); if (document.querySelector('.result-cards')) setViewMode(btn.dataset.view); }));
    const savedView = localStorage.getItem('gix01_view');
    if (savedView && ['grid', 'horizontal', 'compact'].includes(savedView)) setViewMode(savedView);
    else setViewMode('grid');
    modalCloseBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });

    // Export results as JSON
    function exportResults() {
        if (!lastResultsData || lastResultsData.length === 0) {
            showModalMessage('📭 No data', 'No search results to export. Perform a search first.', true);
            return;
        }
        const dataStr = JSON.stringify(lastResultsData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gix01_results_${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    exportLink.addEventListener('click', (e) => { e.preventDefault(); exportResults(); });

    // Trending repos (CIA feature)
    async function fetchTrending() {
        try {
            const token = tokenInput.value.trim();
            const headers = token ? { 'Authorization': `token ${token}` } : {};
            const date = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
            const url = `https://api.github.com/search/repositories?q=created:>${date}&sort=stars&order=desc&per_page=6`;
            const resp = await fetch(url, { headers });
            const data = await resp.json();
            const repos = data.items || [];
            trendingDiv.innerHTML = repos.map(r => `<span class="trending-badge" data-repo="${r.full_name}">🔥 ${r.full_name} (⭐ ${r.stargazers_count})</span>`).join('');
            document.querySelectorAll('.trending-badge').forEach(badge => {
                badge.addEventListener('click', () => {
                    const repoName = badge.dataset.repo;
                    const mainQuery = document.getElementById('mainQuery');
                    if (mainQuery) mainQuery.value = `repo:${repoName}`;
                    searchGitHub(true);
                });
            });
        } catch (e) { trendingDiv.innerHTML = `<span style="font-size:0.7rem;">trending unavailable</span>`; }
    }

    renderFilters();
    initTabs();
    searchBtn.addEventListener('click', () => searchGitHub(true));
    resetBtn.addEventListener('click', resetAll);
    fetchTrending();
})();