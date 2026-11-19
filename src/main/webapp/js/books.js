/**
 * ============================================================================
 * books.js - Client-Side Book Management & Discovery Controller
 * ============================================================================
 * University Academic Project: Student Peer-to-Peer Book Exchange System (Book4u)
 * Technology: Vanilla JavaScript (ES6+ Fetch API, DOM API)
 * ============================================================================
 */

function getAppPath() {
    const path = window.location.pathname;
    const segments = path.split('/');
    if (segments.length > 1 && segments[1] !== '' && !segments[1].endsWith('.html') && segments[1] !== 'api') {
        return '/' + segments[1];
    }
    return '';
}

const APP_CONTEXT = getAppPath();

/**
 * Escapes HTML characters for safe DOM rendering.
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Displays an alert box.
 */
function showBookAlert(elementId, message, type = 'danger') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.innerHTML = message;
    el.style.display = 'flex';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideBookAlert(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.style.display = 'none';
}

function getModeBadgeClass(mode) {
    if (mode === 'GIVEAWAY') return 'badge-giveaway';
    if (mode === 'LENDING') return 'badge-lending';
    return 'badge-swap';
}

function getStatusBadgeClass(status) {
    if (status === 'RESERVED') return 'status-reserved';
    if (status === 'ON_LOAN') return 'status-on-loan';
    if (status === 'UNAVAILABLE') return 'status-unavailable';
    return 'status-available';
}

// ============================================================================
// 1. EXPLORE BOOKS CATALOG CONTROLLER
// ============================================================================
async function loadExploreCatalog() {
    const grid = document.getElementById('explore-book-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Loading academic book catalog...</p>';

    const query = document.getElementById('search-query') ? document.getElementById('search-query').value.trim() : '';
    const subject = document.getElementById('filter-subject') ? document.getElementById('filter-subject').value : '';
    const condition = document.getElementById('filter-condition') ? document.getElementById('filter-condition').value : '';
    const mode = document.getElementById('filter-mode') ? document.getElementById('filter-mode').value : '';

    const params = new URLSearchParams();
    params.append('excludeSelf', 'true');
    if (query) params.append('query', query);
    if (subject && subject !== 'ALL') params.append('subject', subject);
    if (condition && condition !== 'ALL') params.append('condition', condition);
    if (mode && mode !== 'ALL') params.append('mode', mode);

    try {
        const response = await fetch(`${APP_CONTEXT}/api/books?${params.toString()}`);
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const data = await response.json();
        const countEl = document.getElementById('catalog-count');
        if (countEl) countEl.innerText = `${data.count || 0} books available`;

        renderExploreCards(data.books);

    } catch (err) {
        console.error('Failed to load explore books:', err);
        grid.innerHTML = `
            <div class="empty-state-box">
                <span class="empty-state-icon">⚠️</span>
                <h3>Unable to Connect to Server</h3>
                <p>Ensure Tomcat is running and MySQL database is connected.</p>
            </div>
        `;
    }
}

function renderExploreCards(books) {
    const grid = document.getElementById('explore-book-grid');
    if (!grid) return;

    if (!books || books.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-box">
                <span class="empty-state-icon">🔍</span>
                <h3>No Textbooks Found</h3>
                <p>No volumes match your current search query or filter criteria. Try adjusting keywords or clearing filters.</p>
                <button type="button" class="btn btn-outline" onclick="resetExploreFilters()">Reset All Filters</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    books.forEach(book => {
        const card = document.createElement('article');
        card.className = 'book-card';

        // Select an editorial jacket color theme based on subject
        let themeClass = 'jacket-theme-cs';
        const subj = (book.subject || '').toLowerCase();
        if (subj.includes('db') || subj.includes('sql') || subj.includes('data')) {
            themeClass = 'jacket-theme-dbms';
        } else if (subj.includes('algo') || subj.includes('dsa') || subj.includes('structure')) {
            themeClass = 'jacket-theme-algo';
        } else if (subj.includes('math') || subj.includes('physics') || subj.includes('discrete')) {
            themeClass = 'jacket-theme-math';
        }

        const hasCover = book.imageUrl && book.imageUrl.trim() !== '' && !book.imageUrl.includes('placeholder');
        const jacketStyle = hasCover ? `background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${escapeHtml(book.imageUrl)}');` : '';

        card.innerHTML = `
            <div class="book-jacket-plate ${themeClass}" style="${jacketStyle}">
                <div class="book-jacket-subject-tag">${escapeHtml(book.subject || 'Academic Volume')}</div>
                <div>
                    <h4 class="book-jacket-title">${escapeHtml(book.title)}</h4>
                    <p class="book-jacket-author">${escapeHtml(book.author)}</p>
                </div>
            </div>

            <div class="book-card-body">
                <div class="book-card-top">
                    <span class="mode-badge ${getModeBadgeClass(book.sharingMode)}">${escapeHtml(book.sharingMode)}</span>
                    <span class="status-pill ${getStatusBadgeClass(book.status)}">${escapeHtml(book.status)}</span>
                </div>

                <h3 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
                <p class="book-author">by ${escapeHtml(book.author)}</p>

                <div class="book-meta">
                    <div class="book-meta-row">
                        <span class="book-meta-label">Discipline:</span>
                        <span class="book-meta-value">${escapeHtml(book.subject)}</span>
                    </div>
                    <div class="book-meta-row">
                        <span class="book-meta-label">Condition:</span>
                        <span class="book-meta-value">${escapeHtml(book.conditionGrade)}</span>
                    </div>
                    <div class="book-meta-row">
                        <span class="book-meta-label">Custodian:</span>
                        <span class="book-meta-value">${escapeHtml(book.ownerName || 'Verified Peer')}</span>
                    </div>
                </div>

                ${book.description ? `<p class="book-desc">${escapeHtml(book.description)}</p>` : ''}

                <div class="book-card-actions">
                    <a href="${APP_CONTEXT}/book-details.html?id=${book.id}" class="btn btn-outline btn-sm">View Details</a>
                    <a href="${APP_CONTEXT}/book-details.html?id=${book.id}&action=request" class="btn btn-primary btn-sm">Request</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function resetExploreFilters() {
    const q = document.getElementById('search-query');
    if (q) q.value = '';
    const s = document.getElementById('filter-subject');
    if (s) s.value = 'ALL';
    const c = document.getElementById('filter-condition');
    if (c) c.value = 'ALL';
    const m = document.getElementById('filter-mode');
    if (m) m.value = 'ALL';
    loadExploreCatalog();
}

function initExplorePage() {
    const form = document.getElementById('search-filter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        loadExploreCatalog();
    });

    ['filter-subject', 'filter-condition', 'filter-mode'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => loadExploreCatalog());
    });

    const clearBtn = document.getElementById('btn-clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', resetExploreFilters);
    }

    loadExploreCatalog();
}

// ============================================================================
// 2. MY BOOKS MANAGEMENT CONTROLLER
// ============================================================================
let activeMyBooksStatus = 'ALL';

async function loadMyBooks(status = 'ALL') {
    const grid = document.getElementById('my-books-grid');
    if (!grid) return;

    activeMyBooksStatus = status;
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Loading your book listings...</p>';

    const params = new URLSearchParams();
    params.append('myBooks', 'true');
    if (status && status !== 'ALL') {
        params.append('status', status);
    }

    try {
        const response = await fetch(`${APP_CONTEXT}/api/books?${params.toString()}`);
        if (response.status === 401) {
            window.location.href = `${APP_CONTEXT}/login.html?authRequired=true`;
            return;
        }

        const data = await response.json();
        renderMyBooksCards(data.books);

    } catch (err) {
        console.error('Failed to load My Books:', err);
        grid.innerHTML = `
            <div class="empty-state-box">
                <span class="empty-state-icon">⚠️</span>
                <h3>Connection Error</h3>
                <p>Could not fetch your book listings. Please check server status.</p>
            </div>
        `;
    }
}

function renderMyBooksCards(books) {
    const grid = document.getElementById('my-books-grid');
    if (!grid) return;

    if (!books || books.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-box">
                <span class="empty-state-icon">📚</span>
                <h3>No Listings Found</h3>
                <p>You have not offered any textbooks under this category yet.</p>
                <a href="${APP_CONTEXT}/add-book.html" class="btn btn-primary">+ List a Volume</a>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    books.forEach(book => {
        const card = document.createElement('article');
        card.className = 'book-card';

        // Select an editorial jacket color theme based on subject
        let themeClass = 'jacket-theme-cs';
        const subj = (book.subject || '').toLowerCase();
        if (subj.includes('db') || subj.includes('sql') || subj.includes('data')) {
            themeClass = 'jacket-theme-dbms';
        } else if (subj.includes('algo') || subj.includes('dsa') || subj.includes('structure')) {
            themeClass = 'jacket-theme-algo';
        } else if (subj.includes('math') || subj.includes('physics') || subj.includes('discrete')) {
            themeClass = 'jacket-theme-math';
        }

        const hasCover = book.imageUrl && book.imageUrl.trim() !== '' && !book.imageUrl.includes('placeholder');
        const jacketStyle = hasCover ? `background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${escapeHtml(book.imageUrl)}');` : '';

        card.innerHTML = `
            <div class="book-jacket-plate ${themeClass}" style="${jacketStyle}">
                <div class="book-jacket-subject-tag">${escapeHtml(book.subject || 'Academic Volume')}</div>
                <div>
                    <h4 class="book-jacket-title">${escapeHtml(book.title)}</h4>
                    <p class="book-jacket-author">${escapeHtml(book.author)}</p>
                </div>
            </div>

            <div class="book-card-body">
                <div class="book-card-top">
                    <span class="mode-badge ${getModeBadgeClass(book.sharingMode)}">${escapeHtml(book.sharingMode)}</span>
                    <span class="status-pill ${getStatusBadgeClass(book.status)}">${escapeHtml(book.status)}</span>
                </div>

                <h3 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
                <p class="book-author">by ${escapeHtml(book.author)}</p>

                <div class="book-meta">
                    <div class="book-meta-row">
                        <span class="book-meta-label">Discipline:</span>
                        <span class="book-meta-value">${escapeHtml(book.subject)}</span>
                    </div>
                    <div class="book-meta-row">
                        <span class="book-meta-label">Condition:</span>
                        <span class="book-meta-value">${escapeHtml(book.conditionGrade)}</span>
                    </div>
                    <div class="book-meta-row">
                        <span class="book-meta-label">Listed:</span>
                        <span class="book-meta-value">${book.createdAt ? new Date(book.createdAt).toLocaleDateString() : '--'}</span>
                    </div>
                </div>

                <div class="book-card-actions">
                    <a href="${APP_CONTEXT}/book-details.html?id=${book.id}" class="btn btn-outline btn-sm">View</a>
                    <a href="${APP_CONTEXT}/edit-book.html?id=${book.id}" class="btn btn-outline btn-sm" style="color: var(--color-forest);">Edit</a>
                    <button type="button" class="btn btn-outline btn-sm" style="color: var(--color-accent-terracotta); border-color: rgba(164, 74, 63, 0.3);" onclick="confirmDeleteBook(${book.id}, '${escapeHtml(book.title)}')">Delete</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function initMyBooksPage() {
    const tabs = document.querySelectorAll('.filter-tabs-bar .tab-btn');
    if (tabs.length === 0) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const status = this.getAttribute('data-status');
            loadMyBooks(status);
        });
    });

    // Check status banners
    const params = new URLSearchParams(window.location.search);
    if (params.get('added') === 'true') {
        showBookAlert('my-books-alert', '✅ New textbook listing added successfully!', 'success');
    } else if (params.get('updated') === 'true') {
        showBookAlert('my-books-alert', '✅ Book listing details updated successfully!', 'success');
    }

    loadMyBooks('ALL');
}

async function confirmDeleteBook(bookId, title) {
    if (!confirm(`Are you sure you want to permanently delete your listing for "${title}"?\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${APP_CONTEXT}/api/books/delete?id=${bookId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showBookAlert('my-books-alert', '🗑️ Listing deleted successfully.', 'success');
            loadMyBooks(activeMyBooksStatus);
        } else {
            showBookAlert('my-books-alert', `⚠️ ${data.error || 'Failed to delete listing.'}`, 'danger');
        }
    } catch (err) {
        showBookAlert('my-books-alert', 'Server error while deleting book.', 'danger');
    }
}

// ============================================================================
// 3. ADD BOOK CONTROLLER
// ============================================================================
function initAddBookPage() {
    const form = document.getElementById('add-book-form');
    if (!form) return;

    const modeSelect = document.getElementById('book-mode');
    const lendingGroup = document.getElementById('lending-duration-wrapper');

    if (modeSelect && lendingGroup) {
        modeSelect.addEventListener('change', () => {
            lendingGroup.style.display = (modeSelect.value === 'LENDING') ? 'block' : 'none';
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideBookAlert('add-book-alert');

        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const subject = document.getElementById('book-subject').value.trim();
        const isbn = document.getElementById('book-isbn') ? document.getElementById('book-isbn').value.trim() : null;
        const edition = document.getElementById('book-edition') ? document.getElementById('book-edition').value.trim() : null;
        const courseCode = document.getElementById('book-course') ? document.getElementById('book-course').value.trim() : null;
        const conditionGrade = document.getElementById('book-condition').value;
        const sharingMode = document.getElementById('book-mode').value;
        const description = document.getElementById('book-desc') ? document.getElementById('book-desc').value.trim() : null;
        const imageUrl = document.getElementById('book-image') ? document.getElementById('book-image').value.trim() : null;
        const swapPreferences = document.getElementById('book-swap') ? document.getElementById('book-swap').value.trim() : null;

        let lendingMaxDurationDays = null;
        if (sharingMode === 'LENDING') {
            const daysInput = document.getElementById('book-lending-days');
            lendingMaxDurationDays = daysInput ? parseInt(daysInput.value, 10) : null;
            if (!lendingMaxDurationDays || lendingMaxDurationDays <= 0) {
                showBookAlert('add-book-alert', 'Please enter a valid loan duration in days (> 0).', 'danger');
                return;
            }
        }

        if (!title || !author || !subject) {
            showBookAlert('add-book-alert', 'Please complete all required fields (*).', 'danger');
            return;
        }

        const btn = document.getElementById('btn-submit-book');
        btn.disabled = true;
        btn.innerText = 'Publishing Listing...';

        try {
            const response = await fetch(`${APP_CONTEXT}/api/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, author, subject, isbn, edition, courseCode,
                    conditionGrade, sharingMode, description, imageUrl,
                    lendingMaxDurationDays, swapPreferences
                })
            });

            const data = await response.json();

            if (response.status === 401) {
                window.location.href = `${APP_CONTEXT}/login.html?authRequired=true`;
                return;
            }

            if (response.ok && data.success) {
                window.location.href = `${APP_CONTEXT}/my-books.html?added=true`;
            } else {
                showBookAlert('add-book-alert', `⚠️ ${data.error || 'Failed to list book.'}`, 'danger');
                btn.disabled = false;
                btn.innerText = 'Publish Book Listing';
            }
        } catch (err) {
            showBookAlert('add-book-alert', 'Server error while publishing listing.', 'danger');
            btn.disabled = false;
            btn.innerText = 'Publish Book Listing';
        }
    });
}

// ============================================================================
// 4. EDIT BOOK CONTROLLER
// ============================================================================
async function initEditBookPage() {
    const form = document.getElementById('edit-book-form');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('id');

    if (!bookId) {
        showBookAlert('edit-book-alert', 'Missing book ID parameter.', 'danger');
        return;
    }

    try {
        const response = await fetch(`${APP_CONTEXT}/api/books?id=${bookId}`);
        if (!response.ok) throw new Error('Failed to fetch book');

        const data = await response.json();
        if (!data.success || !data.book) {
            showBookAlert('edit-book-alert', 'Book listing not found.', 'danger');
            return;
        }

        if (!data.isOwner) {
            showBookAlert('edit-book-alert', '🔒 Unauthorized: You do not own this book listing.', 'danger');
            document.getElementById('btn-save-edit').disabled = true;
            return;
        }

        const b = data.book;
        document.getElementById('edit-book-id').value = b.id;
        document.getElementById('edit-title').value = b.title || '';
        document.getElementById('edit-author').value = b.author || '';
        document.getElementById('edit-subject').value = b.subject || '';
        if (document.getElementById('edit-isbn')) document.getElementById('edit-isbn').value = b.isbn || '';
        if (document.getElementById('edit-edition')) document.getElementById('edit-edition').value = b.edition || '';
        if (document.getElementById('edit-course')) document.getElementById('edit-course').value = b.courseCode || '';
        document.getElementById('edit-condition').value = b.conditionGrade || 'GOOD';
        document.getElementById('edit-mode').value = b.sharingMode || 'SWAP';
        document.getElementById('edit-status').value = b.status || 'AVAILABLE';
        if (document.getElementById('edit-desc')) document.getElementById('edit-desc').value = b.description || '';
        if (document.getElementById('edit-image')) document.getElementById('edit-image').value = b.imageUrl || '';
        if (document.getElementById('edit-swap')) document.getElementById('edit-swap').value = b.swapPreferences || '';

        const lendingGroup = document.getElementById('edit-lending-duration-wrapper');
        const modeSelect = document.getElementById('edit-mode');
        if (lendingGroup && modeSelect) {
            lendingGroup.style.display = (b.sharingMode === 'LENDING') ? 'block' : 'none';
            if (b.lendingMaxDurationDays) {
                document.getElementById('edit-lending-days').value = b.lendingMaxDurationDays;
            }
            modeSelect.addEventListener('change', () => {
                lendingGroup.style.display = (modeSelect.value === 'LENDING') ? 'block' : 'none';
            });
        }

    } catch (err) {
        showBookAlert('edit-book-alert', 'Failed to load existing book details.', 'danger');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideBookAlert('edit-book-alert');

        const id = parseInt(document.getElementById('edit-book-id').value, 10);
        const title = document.getElementById('edit-title').value.trim();
        const author = document.getElementById('edit-author').value.trim();
        const subject = document.getElementById('edit-subject').value.trim();
        const isbn = document.getElementById('edit-isbn') ? document.getElementById('edit-isbn').value.trim() : null;
        const edition = document.getElementById('edit-edition') ? document.getElementById('edit-edition').value.trim() : null;
        const courseCode = document.getElementById('edit-course') ? document.getElementById('edit-course').value.trim() : null;
        const conditionGrade = document.getElementById('edit-condition').value;
        const sharingMode = document.getElementById('edit-mode').value;
        const status = document.getElementById('edit-status').value;
        const description = document.getElementById('edit-desc') ? document.getElementById('edit-desc').value.trim() : null;
        const imageUrl = document.getElementById('edit-image') ? document.getElementById('edit-image').value.trim() : null;
        const swapPreferences = document.getElementById('edit-swap') ? document.getElementById('edit-swap').value.trim() : null;

        let lendingMaxDurationDays = null;
        if (sharingMode === 'LENDING') {
            const daysInput = document.getElementById('edit-lending-days');
            lendingMaxDurationDays = daysInput ? parseInt(daysInput.value, 10) : null;
        }

        const btn = document.getElementById('btn-save-edit');
        btn.disabled = true;
        btn.innerText = 'Saving Changes...';

        try {
            const response = await fetch(`${APP_CONTEXT}/api/books/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id, title, author, subject, isbn, edition, courseCode,
                    conditionGrade, sharingMode, status, description, imageUrl,
                    lendingMaxDurationDays, swapPreferences
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                window.location.href = `${APP_CONTEXT}/my-books.html?updated=true`;
            } else {
                showBookAlert('edit-book-alert', `⚠️ ${data.error || 'Failed to update book.'}`, 'danger');
                btn.disabled = false;
                btn.innerText = 'Save Changes';
            }
        } catch (err) {
            showBookAlert('edit-book-alert', 'Server error while updating book.', 'danger');
            btn.disabled = false;
            btn.innerText = 'Save Changes';
        }
    });
}

// ============================================================================
// 5. BOOK DETAILS CONTROLLER
// ============================================================================
async function initBookDetailsPage() {
    const container = document.getElementById('book-details-view');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('id');

    if (!bookId) {
        container.innerHTML = `
            <div class="empty-state-box">
                <span class="empty-state-icon">❌</span>
                <h3>Invalid Book Request</h3>
                <p>No textbook ID was specified.</p>
                <a href="${APP_CONTEXT}/explore.html" class="btn btn-primary">Browse All Books</a>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`${APP_CONTEXT}/api/books?id=${bookId}`);
        if (!response.ok) throw new Error('Book not found');

        const data = await response.json();
        if (!data.success || !data.book) {
            throw new Error('Book record missing');
        }

        const book = data.book;
        const isOwner = data.isOwner;
        const canRequest = data.canRequest;

        // Visual Cover or Editorial Jacket Plate
        let themeClass = 'jacket-theme-cs';
        const subj = (book.subject || '').toLowerCase();
        if (subj.includes('db') || subj.includes('sql') || subj.includes('data')) {
            themeClass = 'jacket-theme-dbms';
        } else if (subj.includes('algo') || subj.includes('dsa') || subj.includes('structure')) {
            themeClass = 'jacket-theme-algo';
        } else if (subj.includes('math') || subj.includes('physics') || subj.includes('discrete')) {
            themeClass = 'jacket-theme-math';
        }

        const coverHtml = book.imageUrl
            ? `<img src="${escapeHtml(book.imageUrl)}" alt="${escapeHtml(book.title)}" class="details-cover" onerror="this.outerHTML='<div class=\\'book-jacket-plate ${themeClass}\\' style=\\'height: 260px; margin-bottom: 1.5rem;\\'><div class=\\'book-jacket-subject-tag\\'>${escapeHtml(book.subject)}</div><div><h4 class=\\'book-jacket-title\\'>${escapeHtml(book.title)}</h4><p class=\\'book-jacket-author\\'>${escapeHtml(book.author)}</p></div></div>';">`
            : `<div class="book-jacket-plate ${themeClass}" style="height: 260px; margin-bottom: 1.5rem;"><div class="book-jacket-subject-tag">${escapeHtml(book.subject || 'Academic Volume')}</div><div><h4 class="book-jacket-title">${escapeHtml(book.title)}</h4><p class="book-jacket-author">${escapeHtml(book.author)}</p></div></div>`;

        // Action Buttons
        let actionButtonsHtml = '';
        if (isOwner) {
            actionButtonsHtml = `
                <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                    <a href="${APP_CONTEXT}/edit-book.html?id=${book.id}" class="btn btn-primary" style="flex: 1;">Edit Listing</a>
                    <button type="button" class="btn btn-outline" style="color: var(--color-accent-terracotta); border-color: rgba(164,74,63,0.3);" onclick="confirmDeleteBook(${book.id}, '${escapeHtml(book.title)}')">Delete</button>
                </div>
            `;
        } else if (canRequest) {
            actionButtonsHtml = `
                <button type="button" id="btn-request-exchange" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 0.85rem;" onclick="handleRequestExchangeNotice(${book.id}, '${escapeHtml(book.title)}')">
                    Request Exchange (${escapeHtml(book.sharingMode)})
                </button>
            `;
        } else if (!isOwner && book.status !== 'AVAILABLE') {
            actionButtonsHtml = `
                <div style="margin-top: 1.5rem; padding: 0.85rem; background-color: var(--color-paper-dark); border-radius: var(--radius-sm); text-align: center; color: var(--color-ink-muted); font-size: 0.88rem;">
                    This textbook is currently <strong>${escapeHtml(book.status)}</strong> and unavailable for new exchange requests.
                </div>
            `;
        }

        let lendingTermHtml = '';
        if (book.sharingMode === 'LENDING' && book.lendingMaxDurationDays) {
            lendingTermHtml = `
                <div style="background-color: var(--color-accent-blue-light); border: 1px solid rgba(42, 77, 105, 0.25); border-radius: var(--radius-sm); padding: 1.25rem; margin-top: 1.5rem;">
                    <strong style="color: var(--color-accent-blue); font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em;">Lending Terms:</strong>
                    <p style="color: var(--color-ink); font-size: 0.92rem; margin-top: 0.35rem;">Maximum loan duration: <strong>${book.lendingMaxDurationDays} Days</strong>. Volume must be returned to the custodian before this deadline.</p>
                </div>
            `;
        }

        let swapPrefHtml = '';
        if (book.sharingMode === 'SWAP' && book.swapPreferences) {
            swapPrefHtml = `
                <div style="background-color: var(--color-paper-light); border: 1px solid var(--color-grey); border-radius: var(--radius-sm); padding: 1.25rem; margin-top: 1.5rem;">
                    <strong style="color: var(--color-forest); font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em;">Custodian Trade Preferences:</strong>
                    <p style="color: var(--color-ink); font-size: 0.92rem; margin-top: 0.35rem;">${escapeHtml(book.swapPreferences)}</p>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="book-visual-card">
                ${coverHtml}
                <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1rem;">
                    <span class="mode-badge ${getModeBadgeClass(book.sharingMode)}">${escapeHtml(book.sharingMode)}</span>
                    <span class="status-pill ${getStatusBadgeClass(book.status)}">${escapeHtml(book.status)}</span>
                </div>
                ${actionButtonsHtml}
            </div>

            <div class="profile-tab-card">
                <div class="tab-card-header">
                    <div class="editorial-tag" style="color: var(--color-forest); margin-bottom: 0.35rem;">ACCESSION RECORD // ${escapeHtml(book.subject)}</div>
                    <h1 style="font-family: var(--font-serif); font-size: 2.2rem; color: var(--color-ink); line-height: 1.15; margin: 0.25rem 0 0.5rem 0;">${escapeHtml(book.title)}</h1>
                    <p style="font-size: 1.1rem; color: var(--color-ink-muted); font-style: italic;">By <strong>${escapeHtml(book.author)}</strong></p>
                </div>

                <!-- Specifications Grid -->
                <div class="specs-grid">
                    <div class="spec-item">
                        <div class="spec-label">Condition Grade</div>
                        <div class="spec-val"><span class="badge-condition">${escapeHtml(book.conditionGrade)}</span></div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Edition</div>
                        <div class="spec-val">${escapeHtml(book.edition || 'Not specified')}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Course Code</div>
                        <div class="spec-val">${escapeHtml(book.courseCode || 'All Departments')}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">ISBN</div>
                        <div class="spec-val">${escapeHtml(book.isbn || 'N/A')}</div>
                    </div>
                </div>

                <!-- Description -->
                <div style="margin-top: 1.75rem;">
                    <h4 style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--color-ink); margin-bottom: 0.5rem;">Syllabus Notes &amp; Physical Condition</h4>
                    <p style="color: var(--color-ink-muted); line-height: 1.7; font-size: 0.95rem;">${escapeHtml(book.description || 'No additional condition notes provided by owner.')}</p>
                </div>

                ${lendingTermHtml}
                ${swapPrefHtml}

                <!-- Owner Information -->
                <div class="owner-info-box">
                    <div class="owner-avatar-circle">
                        ${book.ownerName ? book.ownerName.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                        <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-forest); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">Verified Campus Custodian</div>
                        <div style="font-family: var(--font-serif); font-size: 1.2rem; color: var(--color-ink);">${escapeHtml(book.ownerName || 'Verified Campus Student')}</div>
                        <div style="font-size: 0.84rem; color: var(--color-ink-muted);">${escapeHtml(book.ownerDepartment || 'Academic Department')} • ${escapeHtml(book.ownerCampus || 'Main Campus')}</div>
                    </div>
                </div>

                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-ink-faint); text-align: right; margin-top: 1.5rem;">
                    CATALOGED ON ${book.createdAt ? new Date(book.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '--'}
                </div>
            </div>
        `;
        `;

        if (params.get('action') === 'request' && canRequest) {
            handleRequestExchangeNotice(book.id, book.title);
        }

    } catch (err) {
        container.innerHTML = `
            <div class="empty-state-box">
                <span class="empty-state-icon">⚠️</span>
                <h3>Book Not Found</h3>
                <p>The requested book listing does not exist or may have been removed.</p>
                <a href="${APP_CONTEXT}/explore.html" class="btn btn-primary">Return to Catalog</a>
            </div>
        `;
    }
}

function handleRequestExchangeNotice(bookId, title) {
    alert(`🎓 Request for "${title}":\n\nYou are requesting to connect with the student who listed this book.\nExchange request workflows, in-person handover coordination, and loan duration agreements will be finalized in Phase 4.`);
}

// Auto-initialize based on active DOM elements
document.addEventListener('DOMContentLoaded', () => {
    initExplorePage();
    initMyBooksPage();
    initAddBookPage();
    initEditBookPage();
    initBookDetailsPage();
});
