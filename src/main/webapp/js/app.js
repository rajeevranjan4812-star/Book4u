/**
 * ============================================================================
 * Book4u - Client Application Controller
 * Technology: Vanilla JavaScript (ES6+), Fetch API, DOM API
 * Integrates directly with Java Servlets (/api/health, /api/books)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    checkSystemHealth();
    loadAvailableBooks();
    setupEventListeners();
});

/**
 * Pings the Java Servlet health check endpoint: GET api/health
 * Tests Tomcat container status and live MySQL JDBC connectivity.
 */
async function checkSystemHealth() {
    const healthText = document.getElementById('health-text');
    const healthDot = document.getElementById('health-dot');
    if (!healthText || !healthDot) return;

    try {
        const response = await fetch('api/health');
        if (response.ok) {
            const data = await response.json();
            if (data.databaseStatus === 'CONNECTED') {
                healthDot.className = 'health-dot dot-green';
                healthText.textContent = 'Tomcat & MySQL: Online';
            } else {
                healthDot.className = 'health-dot dot-amber';
                healthText.textContent = 'Server: Up | DB: Awaiting Sync';
            }
        } else {
            healthDot.className = 'health-dot dot-amber';
            healthText.textContent = 'Server: HTTP ' + response.status;
        }
    } catch (err) {
        healthDot.className = 'health-dot dot-amber';
        healthText.textContent = 'Server: Offline (Deploy to Tomcat)';
    }
}

/**
 * Fetches available books from GET api/books and renders them on the page.
 */
async function loadAvailableBooks(subject = '', mode = '') {
    const grid = document.getElementById('book-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-ink-muted); padding: 3rem 0; font-family: var(--font-mono); font-size: 0.85rem;">[ ACCESSING CAMPUS REPOSITORY... ]</p>';

    let url = 'api/books';
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (mode) params.append('mode', mode);
    if (params.toString()) url += '?' + params.toString();

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Server returned HTTP ' + response.status);
        }

        const res = await response.json();
        const books = Array.isArray(res) ? res : (res.books || []);
        renderBookCards(books);

        // Update live database count on community ledger
        const statEl = document.getElementById('stat-books-count');
        if (statEl) {
            statEl.textContent = books.length;
        }

    } catch (err) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; background-color: var(--color-paper-light); border: 1px solid var(--color-grey); padding: 2.5rem; text-align: center; border-radius: var(--radius-sm);">
                <p style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-ink); margin-bottom: 0.5rem;">Preview Mode (API endpoint unreachable)</p>
                <p style="color: var(--color-ink-muted); font-size: 0.9rem; max-width: 50ch; margin: 0 auto;">To connect live to Jakarta Servlets and MySQL, package the project with <code>mvn package</code> and run the local Tomcat server.</p>
            </div>
        `;
    }
}

/**
 * Generates editorial Card Story book cards.
 */
function renderBookCards(books) {
    const grid = document.getElementById('book-grid');
    if (!grid) return;

    if (!books || books.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-ink-muted); padding: 3rem; font-style: italic;">No academic volumes currently match this filter criteria.</p>';
        return;
    }

    grid.innerHTML = '';
    books.forEach((book, index) => {
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

        // Sharing mode badge styling
        let badgeClass = 'badge-swap';
        if (book.sharingMode === 'GIVEAWAY') badgeClass = 'badge-giveaway';
        if (book.sharingMode === 'LENDING') badgeClass = 'badge-lending';

        let lendingInfo = '';
        if (book.sharingMode === 'LENDING' && book.lendingMaxDurationDays) {
            lendingInfo = `<div class="book-meta-row"><span class="book-meta-label">Max Loan:</span> <span class="book-meta-value">${book.lendingMaxDurationDays} Days</span></div>`;
        }

        let swapPref = '';
        if (book.sharingMode === 'SWAP' && book.swapPreferences) {
            swapPref = `<div class="book-meta-row"><span class="book-meta-label">Trade for:</span> <span class="book-meta-value">${escapeHtml(book.swapPreferences)}</span></div>`;
        }

        let conditionLabel = book.conditionGrade || 'GOOD';
        if (conditionLabel === 'LIKE_NEW') conditionLabel = 'Like New';

        // Check if a real cover image URL is available
        const hasCover = book.coverImageUrl && book.coverImageUrl.trim() !== '' && !book.coverImageUrl.includes('placeholder');
        const jacketStyle = hasCover ? `background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${escapeHtml(book.coverImageUrl)}');` : '';

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
                    <span class="mode-badge ${badgeClass}">${escapeHtml(book.sharingMode || 'SWAP')}</span>
                    <span class="book-subject-pill">${escapeHtml(conditionLabel)}</span>
                </div>

                <h3 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
                <p class="book-author">by ${escapeHtml(book.author)}</p>

                <div class="book-meta">
                    <div class="book-meta-row">
                        <span class="book-meta-label">Course:</span>
                        <span class="book-meta-value">${escapeHtml(book.courseCode || 'N/A')}</span>
                    </div>
                    ${lendingInfo}
                    ${swapPref}
                </div>

                <p class="book-desc">${escapeHtml(book.description || 'Verified academic syllabus copy in student custody.')}</p>
            </div>

            <div class="book-footer">
                <span class="owner-info">Custodian: <strong>${escapeHtml(book.ownerName || 'Campus Student')}</strong></span>
                <a href="book-details.html?id=${book.id}" class="btn btn-outline btn-sm">Inspect &rarr;</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Filter by pill click on landing page.
 */
function filterByPill(subject) {
    const subjectSelect = document.getElementById('filter-subject');
    const modeSelect = document.getElementById('filter-mode');

    // Update active pill button
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(p => {
        if (p.textContent.includes(subject) || (subject === '' && p.textContent.includes('All'))) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });

    if (subjectSelect) {
        subjectSelect.value = subject;
    }

    loadAvailableBooks(subject, modeSelect ? modeSelect.value : '');
}

function setupEventListeners() {
    // Filter dropdowns
    const subjectFilter = document.getElementById('filter-subject');
    const modeFilter = document.getElementById('filter-mode');

    const applyFilters = () => {
        const subject = subjectFilter ? subjectFilter.value : '';
        const mode = modeFilter ? modeFilter.value : '';
        loadAvailableBooks(subject, mode);
    };

    if (subjectFilter) subjectFilter.addEventListener('change', applyFilters);
    if (modeFilter) modeFilter.addEventListener('change', applyFilters);

    // Modal controls
    const listModal = document.getElementById('list-modal');
    const openModalBtn = document.getElementById('btn-open-list-modal');
    const closeModalBtn = document.getElementById('btn-close-modal');
    const newBookForm = document.getElementById('new-book-form');

    if (openModalBtn && listModal) {
        openModalBtn.addEventListener('click', () => {
            listModal.classList.add('active');
        });
    }

    if (closeModalBtn && listModal) {
        closeModalBtn.addEventListener('click', () => {
            listModal.classList.remove('active');
        });
    }

    // Close on background backdrop click
    if (listModal) {
        listModal.addEventListener('click', (e) => {
            if (e.target === listModal) {
                listModal.classList.remove('active');
            }
        });
    }

    // Toggle conditional lending days input
    const modeSelect = document.getElementById('book-mode-select');
    const lendingGroup = document.getElementById('lending-duration-group');
    if (modeSelect && lendingGroup) {
        modeSelect.addEventListener('change', () => {
            if (modeSelect.value === 'LENDING') {
                lendingGroup.style.display = 'block';
            } else {
                lendingGroup.style.display = 'none';
            }
        });
    }

    // Submit new book form to POST api/books
    if (newBookForm) {
        newBookForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                title: document.getElementById('book-title-input').value,
                author: document.getElementById('book-author-input').value,
                subject: document.getElementById('book-subject-input').value,
                courseCode: document.getElementById('book-course-input').value,
                sharingMode: document.getElementById('book-mode-select').value,
                conditionGrade: document.getElementById('book-condition-select').value,
                lendingMaxDurationDays: modeSelect.value === 'LENDING' ? parseInt(document.getElementById('book-days-input').value, 10) : null,
                description: document.getElementById('book-desc-input').value,
                swapPreferences: document.getElementById('book-swap-input').value
            };

            try {
                const response = await fetch('api/books', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (response.status === 401) {
                    alert('Authentication required! Please sign in with your student account to list a book.');
                    window.location.href = 'login.html?authRequired=true';
                    return;
                }
                if (response.ok) {
                    alert('Success! Your book has been added to the campus repository.');
                    newBookForm.reset();
                    if (listModal) listModal.classList.remove('active');
                    loadAvailableBooks();
                } else {
                    alert('Error: ' + (result.error || 'Failed to list book'));
                }
            } catch (err) {
                alert('Connection error: ' + err.message);
            }
        });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
