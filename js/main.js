// Enhanced Language support with improved UX
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initLanguageSupport();
    setupChatWidget();
    setupSmoothScrolling();
    setupNavbarScroll();
    setupLoadingAnimations();
    setupPerformanceOptimizations();
});

function initLanguageSupport() {
    const languageSelect = document.getElementById('languageSelect');
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('goldcrypto-language') || 'en';
    languageSelect.value = savedLanguage;
    
    // Apply language translations
    applyLanguageTranslations(savedLanguage);
    
    // Language change handler
    languageSelect.addEventListener('change', function() {
        const selectedLanguage = this.value;
        localStorage.setItem('goldcrypto-language', selectedLanguage);
        applyLanguageTranslations(selectedLanguage);
        
        // Show language change confirmation
        showToast(`Language changed to ${getLanguageName(selectedLanguage)}`, 'success');
    });
}

function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'ar': 'العربية',
        'es': 'Español'
    };
    return languages[code] || code;
}

function applyLanguageTranslations(language) {
    const translations = {
        en: {
            'welcome': 'Welcome to GoldCrypto',
            'bonus': '200% Bonus on First Deposit!',
            'getStarted': 'Get Started',
            'prices': 'Live Cryptocurrency Prices',
            'support': 'Live Support',
            'tradeNow': 'Trade Now',
            'learnMore': 'Learn More'
        },
        ar: {
            'welcome': 'مرحبًا بكم في GoldCrypto',
            'bonus': 'مكافأة 200% على أول إيداع!',
            'getStarted': 'ابدأ الآن',
            'prices': 'أسعار العملات المشفرة المباشرة',
            'support': 'الدعم المباشر',
            'tradeNow': 'تداول الآن',
            'learnMore': 'تعرف أكثر'
        },
        es: {
            'welcome': 'Bienvenido a GoldCrypto',
            'bonus': '¡200% de bono en el primer depósito!',
            'getStarted': 'Comenzar',
            'prices': 'Precios de Criptomonedas en Tiempo Real',
            'support': 'Soporte en Vivo',
            'tradeNow': 'Operar Ahora',
            'learnMore': 'Saber Más'
        }
    };
    
    // Apply translations to elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[language] && translations[language][key]) {
            element.textContent = translations[language][key];
        }
    });
    
    // Update HTML direction for RTL languages
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
}

function setupChatWidget() {
    const chatToggle = document.querySelector('.chat-toggle');
    const chatBody = document.querySelector('.chat-body');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    
    if (!chatToggle) return;
    
    // Toggle chat visibility with animation
    chatToggle.addEventListener('click', function() {
        if (chatBody.style.display === 'none' || !chatBody.style.display) {
            chatBody.style.display = 'flex';
            chatToggle.textContent = '−';
            chatBody.style.animation = 'chatExpand 0.3s ease';
        } else {
            chatBody.style.animation = 'chatCollapse 0.3s ease';
            setTimeout(() => {
                chatBody.style.display = 'none';
                chatToggle.textContent = '+';
            }, 250);
        }
    });
    
    // Check if user is logged in to enable chat
    const user = JSON.parse(localStorage.getItem('goldcrypto-user'));
    if (user) {
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.placeholder = 'Type your message...';
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    } else {
        chatInput.disabled = true;
        sendButton.disabled = true;
        chatInput.placeholder = 'Please login to chat...';
    }
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();
    
    if (message) {
        // Add user message to chat
        const userMessage = document.createElement('div');
        userMessage.className = 'message user';
        userMessage.innerHTML = `
            <div class="message-content">${escapeHtml(message)}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        `;
        chatMessages.appendChild(userMessage);
        
        // Clear input
        chatInput.value = '';
        
        // Scroll to bottom with smooth behavior
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
        
        // In a real implementation, this would send the message to the server
        // For now, we'll simulate a response after a delay
        setTimeout(() => {
            const supportMessage = document.createElement('div');
            supportMessage.className = 'message support';
            supportMessage.innerHTML = `
                <div class="message-content">Thank you for your message. Our support team will respond shortly.</div>
                <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            `;
            chatMessages.appendChild(supportMessage);
            
            // Scroll to bottom
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupSmoothScrolling() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove scrolled class based on scroll position
        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    }, { passive: true });
}

function setupLoadingAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.price-card, .banner-content > *').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

function setupPerformanceOptimizations() {
    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Debounce resize events
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Handle resize actions here
            console.log('Window resized');
        }, 250);
    });
}

// Utility function to show toast messages
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Add show class after a frame
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close on click
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
}

// Add CSS for toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card);
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 10px;
        padding: 1rem 1.5rem;
        box-shadow: var(--shadow-dark);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        max-width: 350px;
    }
    
    .toast.show {
        transform: translateX(0);
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .toast-message {
        color: var(--text-light);
        flex: 1;
    }
    
    .toast-close {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .toast-success {
        border-left: 4px solid var(--success);
    }
    
    .toast-error {
        border-left: 4px solid var(--error);
    }
    
    .toast-warning {
        border-left: 4px solid var(--warning);
    }
    
    .toast-info {
        border-left: 4px solid var(--info);
    }
`;
document.head.appendChild(toastStyles);
