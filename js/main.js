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
