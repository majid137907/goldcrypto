// Fetch cryptocurrency prices from CoinMarketCap (using a proxy)
async function fetchCryptoPrices() {
    try {
        // In a real implementation, you would use CoinMarketCap API with your API key
        // For demonstration, we'll use mock data that simulates real prices
        
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
        
        // Real implementation would look like:
        /*
        const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': 'YOUR_API_KEY'
            }
        });
        const data = await response.json();
        displayPrices(data.data);
        */
    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

function displayPrices(prices) {
    const container = document.getElementById('pricesContainer');
    container.innerHTML = '';
    
    prices.forEach(crypto => {
        const priceCard = document.createElement('div');
        priceCard.className = 'price-card';
        
        const changeClass = crypto.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = crypto.change >= 0 ? '↑' : '↓';
        
        priceCard.innerHTML = `
            <h3>${crypto.symbol}</h3>
            <p>${crypto.name}</p>
            <div class="price-value">$${crypto.price.toLocaleString()}</div>
            <div class="price-change ${changeClass}">${changeSymbol} ${Math.abs(crypto.change)}%</div>
        `;
        
        container.appendChild(priceCard);
    });
}

// Refresh prices every 30 seconds
setInterval(fetchCryptoPrices, 30000);

// Initial load
document.addEventListener('DOMContentLoaded', fetchCryptoPrices);
