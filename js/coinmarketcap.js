// coinmarketcap.js - نسخه کامل با API واقعی
const CMC_API_KEY = '630809ef-2b4a-4405-8abd-2cf8f4916b39'; // کلید API خود را اینجا قرار دهید
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';

// لیست ارزهای مورد نظر
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT'];

async function fetchCryptoPrices() {
    try {
        // استفاده از API واقعی CoinMarketCap
        const response = await fetch(CMC_API_URL, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayPrices(data.data);

    } catch (error) {
        console.error('Error fetching prices from CoinMarketCap:', error);
        // در صورت خطا از داده‌های mock استفاده کنیم
        console.log('Using mock data as fallback...');
        useMockData();
    }
}

function useMockData() {
    // داده‌های mock برای زمانی که API در دسترس نیست
    const mockPrices = [
        { symbol: 'BTC', name: 'Bitcoin', price: 43456.78, change: 2.34 },
        { symbol: 'ETH', name: 'Ethereum', price: 2345.67, change: 1.56 },
        { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.01 },
        { symbol: 'BNB', name: 'Binance Coin', price: 312.45, change: -0.23 },
        { symbol: 'XRP', name: 'Ripple', price: 0.5678, change: 3.21 },
        { symbol: 'ADA', name: 'Cardano', price: 0.4321, change: -1.45 },
        { symbol: 'SOL', name: 'Solana', price: 98.76, change: 5.67 },
        { symbol: 'DOT', name: 'Polkadot', price: 6.78, change: -2.34 }
    ];
    
    displayPrices(mockPrices);
}

function displayPrices(prices) {
    const container = document.getElementById('pricesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // فیلتر کردن فقط ارزهای مورد نظر
    const filteredPrices = prices.filter(crypto => 
        CRYPTO_SYMBOLS.includes(crypto.symbol)
    );
    
    filteredPrices.forEach(crypto => {
        const priceCard = document.createElement('div');
        priceCard.className = 'price-card';
        
        const change = crypto.quote?.USD?.percent_change_24h || crypto.change;
        const price = crypto.quote?.USD?.price || crypto.price;
        const symbol = crypto.symbol;
        const name = crypto.name;
        
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changeSymbol = change >= 0 ? '↑' : '↓';
        
        priceCard.innerHTML = `
            <h3>${symbol}</h3>
            <p>${name}</p>
            <div class="price-value">$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="price-change ${changeClass}">
                ${changeSymbol} ${Math.abs(change).toFixed(2)}%
            </div>
        `;
        
        container.appendChild(priceCard);
    });
}

// جایگزین کردن fetchCryptoPrices در user.js برای بخش market
async function fetchMarketPricesForUser() {
    try {
        const response = await fetch(CMC_API_URL, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayMarketPrices(data.data);

    } catch (error) {
        console.error('Error fetching market prices:', error);
        useMockMarketData();
    }
}

function useMockMarketData() {
    const mockPrices = [
        { symbol: 'BTC', name: 'Bitcoin', price: 43456.78, change: 2.34 },
        { symbol: 'ETH', name: 'Ethereum', price: 2345.67, change: 1.56 },
        { symbol: 'SOL', name: 'Solana', price: 98.76, change: 5.67 },
        { symbol: 'ADA', name: 'Cardano', price: 0.4321, change: -1.45 },
        { symbol: 'XRP', name: 'Ripple', price: 0.5678, change: 3.21 },
        { symbol: 'DOT', name: 'Polkadot', price: 6.78, change: -2.34 }
    ];
    
    displayMarketPrices(mockPrices);
}

function displayMarketPrices(prices) {
    const container = document.getElementById('market-prices');
    if (!container) return;
    
    container.innerHTML = '';
    
    prices.forEach(crypto => {
        const changeClass = crypto.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = crypto.change >= 0 ? '↑' : '↓';
        
        const priceItem = document.createElement('div');
        priceItem.className = 'price-item';
        priceItem.innerHTML = `
            <div class="price-symbol">${crypto.symbol}</div>
            <div class="price-name">${crypto.name}</div>
            <div class="price-value">$${crypto.price.toLocaleString()}</div>
            <div class="price-change ${changeClass}">${changeSymbol} ${Math.abs(crypto.change)}%</div>
        `;
        
        container.appendChild(priceItem);
    });
}

// Refresh prices every 30 seconds
setInterval(fetchCryptoPrices, 30000);

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    fetchCryptoPrices();
    
    // اگر در صفحه کاربر هستیم، قیمت‌های مارکت را هم لود کنیم
    if (document.getElementById('market-prices')) {
        fetchMarketPricesForUser();
        setInterval(fetchMarketPricesForUser, 30000);
    }
});
