// Language support
document.addEventListener('DOMContentLoaded', function() {
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
    });
    
    // Chat functionality
    setupChatWidget();
});

function applyLanguageTranslations(language) {
    // This would contain translations for all text elements
    // For now, we'll just demonstrate the concept
    const translations = {
        en: {
            'welcome': 'Welcome to GoldCrypto',
            'bonus': '200% Bonus on First Deposit!',
            'getStarted': 'Get Started',
            'prices': 'Live Cryptocurrency Prices',
            'support': 'Live Support'
        },
        ar: {
            'welcome': 'مرحبًا بكم في GoldCrypto',
            'bonus': 'مكافأة 200% على أول إيداع!',
            'getStarted': 'ابدأ الآن',
            'prices': 'أسعار العملات المشفرة المباشرة',
            'support': 'الدعم المباشر'
        },
        es: {
            'welcome': 'Bienvenido a GoldCrypto',
            'bonus': '¡200% de bono en el primer depósito!',
            'getStarted': 'Comenzar',
            'prices': 'Precios de Criptomonedas en Tiempo Real',
            'support': 'Soporte en Vivo'
        }
    };
    
    // Apply translations to elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[language] && translations[language][key]) {
            element.textContent = translations[language][key];
        }
    });
}

function setupChatWidget() {
    const chatToggle = document.querySelector('.chat-toggle');
    const chatBody = document.querySelector('.chat-body');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    
    // Toggle chat visibility
    chatToggle.addEventListener('click', function() {
        if (chatBody.style.display === 'none') {
            chatBody.style.display = 'flex';
            chatToggle.textContent = '-';
        } else {
            chatBody.style.display = 'none';
            chatToggle.textContent = '+';
        }
    });
    
    // Check if user is logged in to enable chat
    const user = JSON.parse(localStorage.getItem('goldcrypto-user'));
    if (user) {
        chatInput.disabled = false;
        sendButton.disabled = false;
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
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
        userMessage.textContent = message;
        chatMessages.appendChild(userMessage);
        
        // Clear input
        chatInput.value = '';
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // In a real implementation, this would send the message to the server
        // For now, we'll simulate a response after a delay
        setTimeout(() => {
            const supportMessage = document.createElement('div');
            supportMessage.className = 'message support';
            supportMessage.textContent = 'Thank you for your message. Our support team will respond shortly.';
            chatMessages.appendChild(supportMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }

}

// particles.js - Add this to your main.js
function createParticles() {
    const container = document.createElement('div');
    container.className = 'particles-container';
    document.body.appendChild(container);
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 10 + 10;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        container.appendChild(particle);
    }
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollY = window.scrollY;
    });
}

// Initialize all effects
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initNavbarScroll();
    
    // Add hover effects to price cards
    const priceCards = document.querySelectorAll('.price-card');
    priceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.zIndex = '1';
        });
    });
});
