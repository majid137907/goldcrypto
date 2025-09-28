// coinmarketcap-alternative.js
const API_URLS = [
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false',
    'https://api.binance.com/api/v3/ticker/24hr'
];

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT'];

async function fetchCryptoPrices() {
    try {
        console.log('Fetching prices from CoinGecko...');
        
        // استفاده از CoinGecko API (رایگان و بدون نیاز به API Key)
        const response = await fetch(API_URLS[0]);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('CoinGecko data:', data);
        displayPricesFromCoinGecko(data);

    } catch (error) {
        console.error('Error fetching prices from CoinGecko:', error);
        console.log('Trying Binance API...');
        try {
            await fetchFromBinance();
        } catch (binanceError) {
            console.error('Error fetching from Binance:', binanceError);
            console.log('Using mock data as fallback...');
            useMockData();
        }
    }
}

async function fetchFromBinance() {
    const response = await fetch(API_URLS[1]);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displayPricesFromBinance(data);
}

function displayPricesFromCoinGecko(data) {
    const container = document.getElementById('pricesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // فیلتر کردن فقط ارزهای مورد نظر
    const filteredPrices = data.filter(crypto => 
        CRYPTO_SYMBOLS.includes(crypto.symbol.toUpperCase())
    );
    
    filteredPrices.forEach(crypto => {
        const priceCard = document.createElement('div');
        priceCard.className = 'price-card';
        
        const change = crypto.price_change_percentage_24h || 0;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changeSymbol = change >= 0 ? '↑' : '↓';
        
        priceCard.innerHTML = `
            <h3>${crypto.symbol.toUpperCase()}</h3>
            <p>${crypto.name}</p>
            <div class="price-value">$${crypto.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="price-change ${changeClass}">
                ${changeSymbol} ${Math.abs(change).toFixed(2)}%
            </div>
        `;
        
        container.appendChild(priceCard);
    });
}

function displayPricesFromBinance(data) {
    const container = document.getElementById('pricesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Binance داده‌های مختلفی برمی‌گرداند، این یک نمونه ساده است
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT'];
    
    symbols.forEach(symbol => {
        const cryptoData = data.find(item => item.symbol === symbol);
        if (cryptoData) {
            const priceCard = document.createElement('div');
            priceCard.className = 'price-card';
            
            const change = parseFloat(cryptoData.priceChangePercent) || 0;
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const changeSymbol = change >= 0 ? '↑' : '↓';
            const symbolName = symbol.replace('USDT', '');
            
            priceCard.innerHTML = `
                <h3>${symbolName}</h3>
                <p>${getCryptoName(symbolName)}</p>
                <div class="price-value">$${parseFloat(cryptoData.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div class="price-change ${changeClass}">
                    ${changeSymbol} ${Math.abs(change).toFixed(2)}%
                </div>
            `;
            
            container.appendChild(priceCard);
        }
    });
}

function getCryptoName(symbol) {
    const names = {
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum',
        'BNB': 'Binance Coin',
        'ADA': 'Cardano',
        'XRP': 'Ripple',
        'SOL': 'Solana',
        'DOT': 'Polkadot'
    };
    return names[symbol] || symbol;
}

// استفاده از داده‌های mock در صورت خطا
function useMockData() {
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
    
    prices.forEach(crypto => {
        const priceCard = document.createElement('div');
        priceCard.className = 'price-card';
        
        const changeClass = crypto.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = crypto.change >= 0 ? '↑' : '↓';
        
        priceCard.innerHTML = `
            <h3>${crypto.symbol}</h3>
            <p>${crypto.name}</p>
            <div class="price-value">$${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="price-change ${changeClass}">
                ${changeSymbol} ${Math.abs(crypto.change).toFixed(2)}%
            </div>
        `;
        
        container.appendChild(priceCard);
    });
}

// Refresh prices every 30 seconds
setInterval(fetchCryptoPrices, 30000);

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    fetchCryptoPrices();
    
    if (document.getElementById('market-prices')) {
        setInterval(fetchCryptoPrices, 30000);
    }
});
