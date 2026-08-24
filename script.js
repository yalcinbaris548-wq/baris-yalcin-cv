// ============================
// NAVIGATION & PAGE MANAGEMENT
// ============================

const pages = ['home', 'about', 'education', 'experience', 'skills', 'projects', 'certificates', 'guestbook', 'contact'];
const themeColors = {
    home: { accent: '#6c63ff', glow: 'rgba(108, 99, 255, 0.3)' },
    about: { accent: '#00d4aa', glow: 'rgba(0, 212, 170, 0.3)' },
    education: { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
    experience: { accent: '#ec4899', glow: 'rgba(236, 72, 153, 0.3)' },
    skills: { accent: '#06b6d4', glow: 'rgba(6, 182, 212, 0.3)' },
    projects: { accent: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.3)' },
    certificates: { accent: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' },
    guestbook: { accent: '#ec4899', glow: 'rgba(236, 72, 153, 0.3)' },
    contact: { accent: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' },
};

let currentPage = 'home';

// Navigate to a page
function navigateTo(pageName) {
    if (!pages.includes(pageName)) return;
    const el = document.getElementById(`page-${pageName}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    }
    // Close mobile menu if open
    closeMobileMenu();
}

// Update active nav link and theme based on scroll position
function updateActiveSection() {
    const scrollY = window.scrollY + window.innerHeight / 3;

    for (let i = pages.length - 1; i >= 0; i--) {
        const section = document.getElementById(`page-${pages[i]}`);
        if (section && section.offsetTop <= scrollY) {
            if (currentPage !== pages[i]) {
                currentPage = pages[i];
                updateNavLinks(currentPage);
                updateTheme(currentPage);
            }
            break;
        }
    }

    // Update progress bar
    updateProgressBar();
}

function updateNavLinks(activePage) {
    document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === activePage);
    });
}

function updateTheme(theme) {
    const colors = themeColors[theme];
    if (!colors) return;
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--accent-glow', colors.glow);
}

function updateProgressBar() {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = scrolled + '%';
    }
}

// ============================
// MOBILE MENU
// ============================

const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');

hamburgerBtn.addEventListener('click', toggleMobileMenu);

function toggleMobileMenu() {
    hamburgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
    hamburgerBtn.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
}

// Mobile link clicks
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        navigateTo(page);
    });
});

// Nav link clicks
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        navigateTo(page);
    });
});

// ============================
// SCROLL ANIMATIONS
// ============================

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Animate skill bars
            if (entry.target.classList.contains('skill-group') || entry.target.closest('.skill-group')) {
                animateSkillBars(entry.target);
            }

            // Animate counters
            if (entry.target.classList.contains('hero-stats') || entry.target.closest('.hero-stats')) {
                animateCounters();
            }
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    scrollObserver.observe(el);
});

// Stagger animation delays for grids
document.querySelectorAll('.about-grid, .courses-grid, .projects-grid, .skills-container, .certificates-container').forEach(grid => {
    const children = grid.querySelectorAll('.animate-on-scroll');
    children.forEach((child, index) => {
        child.style.transitionDelay = `${index * 0.1}s`;
    });
});

// ============================
// SKILL BAR ANIMATIONS
// ============================

function animateSkillBars(container) {
    const fills = container.querySelectorAll('.skill-fill');
    fills.forEach(fill => {
        const width = fill.dataset.width;
        setTimeout(() => {
            fill.style.width = width + '%';
        }, 200);
    });
}

// Also observe skill groups for bar animation
document.querySelectorAll('.skill-group').forEach(group => {
    scrollObserver.observe(group);
});

// ============================
// COUNTER ANIMATIONS
// ============================

let countersAnimated = false;

function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    document.querySelectorAll('.stat-number').forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const duration = 1500;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(easeOut * target);

            counter.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    });
}

// ============================
// TYPING ANIMATION
// ============================

const typingTexts = [
    'Bilgisayar Teknikeri',
    'Yazılım Geliştirici',
    'Yapay Zeka Tutkunu',
    'Full-Stack Developer',
    'Problem Çözücü'
];

let typingIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingElement = document.getElementById('typing-text');

function typeText() {
    const currentText = typingTexts[typingIndex];

    if (isDeleting) {
        charIndex--;
        typingElement.textContent = currentText.substring(0, charIndex);
    } else {
        charIndex++;
        typingElement.textContent = currentText.substring(0, charIndex);
    }

    let delay = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentText.length) {
        delay = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        typingIndex = (typingIndex + 1) % typingTexts.length;
        delay = 500;
    }

    setTimeout(typeText, delay);
}

typeText();

// ============================
// PARTICLES BACKGROUND
// ============================

function createParticles() {
    const container = document.getElementById('particles-home');
    if (!container) return;

    for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: var(--accent);
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.3 + 0.1};
            animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * -20}s;
        `;
        container.appendChild(particle);
    }
}

// Add particle animation to stylesheet
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes floatParticle {
        0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
        10% { opacity: 0.3; }
        90% { opacity: 0.3; }
        100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 200 + 50}px, -${Math.random() * 500 + 200}px) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(particleStyle);

createParticles();

// ============================
// NAV SCROLL EFFECTS
// ============================

window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
    updateActiveSection();
}, { passive: true });

// ============================
// SMOOTH ANCHOR HANDLING
// ============================

// Initial setup
window.addEventListener('load', () => {
    updateActiveSection();

    // Handle hash in URL
    const hash = window.location.hash.replace('#', '');
    if (hash && pages.includes(hash)) {
        setTimeout(() => navigateTo(hash), 300);
    }
});

// ============================
// PAGE TRANSITION EFFECTS
// ============================

// Add subtle gradient background shifts
function addBackgroundOrbs() {
    pages.forEach(pageName => {
        const page = document.getElementById(`page-${pageName}`);
        if (!page || pageName === 'home') return;

        const orb = document.createElement('div');
        const colors = themeColors[pageName];
        orb.style.cssText = `
            position: absolute;
            width: 500px;
            height: 500px;
            border-radius: 50%;
            background: ${colors.glow};
            filter: blur(120px);
            opacity: 0.15;
            top: 20%;
            right: -10%;
            pointer-events: none;
            z-index: 0;
            animation: orbFloat 15s ease-in-out infinite alternate;
        `;
        page.appendChild(orb);

        const orb2 = document.createElement('div');
        orb2.style.cssText = `
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: ${colors.glow};
            filter: blur(100px);
            opacity: 0.1;
            bottom: 10%;
            left: -5%;
            pointer-events: none;
            z-index: 0;
            animation: orbFloat 20s ease-in-out infinite alternate-reverse;
        `;
        page.appendChild(orb2);
    });
}

const orbStyle = document.createElement('style');
orbStyle.textContent = `
    @keyframes orbFloat {
        0% { transform: translate(0, 0); }
        100% { transform: translate(30px, -30px); }
    }
`;
document.head.appendChild(orbStyle);

addBackgroundOrbs();

// ============================
// INITIALIZE
// ============================

// Set initial theme
updateTheme('home');

// Trigger animations for hero stats
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    scrollObserver.observe(heroStats);
}

console.log('%c🚀 Barış Yalçın CV | Powered with ❤️', 'color: #6c63ff; font-size: 14px; font-weight: bold;');

// ============================
// API CONFIGURATION
// ============================

const API_BASE = window.location.origin;

// ============================
// TOAST NOTIFICATION SYSTEM
// ============================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    toast.addEventListener('click', () => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ============================
// GUESTBOOK API
// ============================

async function loadMessages() {
    const messagesList = document.getElementById('messages-list');
    const messageCount = document.getElementById('message-count');
    if (!messagesList) return;

    try {
        const response = await fetch(`${API_BASE}/api/messages`);
        const result = await response.json();

        if (result.success) {
            const messages = result.data;
            messageCount.textContent = `${messages.length} mesaj`;

            if (messages.length === 0) {
                messagesList.innerHTML = `
                    <div class="no-messages">
                        <span class="no-msg-icon">💭</span>
                        <p>Henüz mesaj yok. İlk mesajı siz bırakın!</p>
                    </div>
                `;
            } else {
                messagesList.innerHTML = messages.map(msg => `
                    <div class="message-card">
                        <div class="message-card-header">
                            <div class="message-avatar">${msg.avatar || msg.name.charAt(0).toUpperCase()}</div>
                            <div class="message-meta">
                                <div class="message-name">${escapeHtml(msg.name)}</div>
                                <div class="message-date">${formatDate(msg.date)}</div>
                            </div>
                        </div>
                        <div class="message-body">${escapeHtml(msg.message)}</div>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        messagesList.innerHTML = `
            <div class="no-messages">
                <span class="no-msg-icon">⚠️</span>
                <p>Mesajlar yüklenirken hata oluştu. Sunucu çalışıyor mu?</p>
            </div>
        `;
    }
}

// Guestbook Form Submit
const guestbookForm = document.getElementById('guestbook-form');
if (guestbookForm) {
    guestbookForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('gb-name');
        const messageInput = document.getElementById('gb-message');
        const submitBtn = document.getElementById('gb-submit');

        const name = nameInput.value.trim();
        const message = messageInput.value.trim();

        if (!name || !message) {
            showToast('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Gönderiliyor...';

        try {
            const response = await fetch(`${API_BASE}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, message })
            });

            const result = await response.json();

            if (result.success) {
                showToast('Mesajınız başarıyla eklendi! 🎉', 'success');
                nameInput.value = '';
                messageInput.value = '';
                await loadMessages();
            } else {
                showToast(result.error || 'Bir hata oluştu.', 'error');
            }
        } catch (err) {
            showToast('Sunucuya bağlanılamadı. Server çalışıyor mu?', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Mesajı Gönder';
        }
    });
}

// ============================
// CONTACT FORM API
// ============================

const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('ct-name').value.trim();
        const email = document.getElementById('ct-email').value.trim();
        const subject = document.getElementById('ct-subject').value.trim();
        const message = document.getElementById('ct-message').value.trim();
        const submitBtn = document.getElementById('ct-submit');

        if (!name || !email || !message) {
            showToast('Lütfen zorunlu alanları doldurun.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Gönderiliyor...';

        try {
            const response = await fetch(`${API_BASE}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message })
            });

            const result = await response.json();

            if (result.success) {
                showToast('Mesajınız başarıyla gönderildi! ✉️', 'success');
                contactForm.reset();
            } else {
                showToast(result.error || 'Bir hata oluştu.', 'error');
            }
        } catch (err) {
            showToast('Sunucuya bağlanılamadı. Server çalışıyor mu?', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Mesajı Gönder';
        }
    });
}

// ============================
// VISITOR COUNTER
// ============================

async function loadVisitorStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const result = await response.json();

        if (result.success) {
            const visitorCount = document.getElementById('visitor-count');
            if (visitorCount) {
                visitorCount.textContent = result.data.totalVisits;
            }
        }
    } catch (err) {
        // Silently fail if server is not running
    }
}

// ============================
// HELPER FUNCTIONS
// ============================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================
// INITIALIZE API FEATURES
// ============================

// Load data when page loads
window.addEventListener('load', () => {
    loadMessages();
    loadVisitorStats();
});
