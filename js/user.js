// User Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the user dashboard
    initUserDashboard();
});

let priceChart = null;
let userData = null;

async function initUserDashboard() {
    // Check if user is logged in
    await checkUserAuth();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadUserData();
    loadMarketPrices();
    loadWalletAddresses();
    loadTransactionHistory();
    loadOpenTrades();
    
    // Set up real-time price updates
    setInterval(loadMarketPrices, 30000);
}

async function checkUserAuth() {
    userData = JSON.parse(localStorage.getItem('goldcrypto-user'));
    
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    // Redirect to admin panel if user is admin
    if (userData.level === 'admin') {
        window.location.href = 'admin.html';
        return;
    }
    
    // Update UI with user data
    document.getElementById('user-balance').textContent = `$${userData.balance?.toFixed(2) || '0.00'}`;
    document.getElementById('user-level').textContent = userData.level.charAt(0).toUpperCase() + userData.level.slice(1);
    document.getElementById('user-level').className = `level-${userData.level}`;
    document.getElementById('user-email').value = userData.email;
    document.getElementById('user-name').value = userData.full_name || '';
}

function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Quick action buttons
    document.getElementById('deposit-btn').addEventListener('click', () => showModal('deposit-modal'));
    document.getElementById('withdraw-btn').addEventListener('click', () => showModal('withdrawal-modal'));
    document.getElementById('transfer-btn').addEventListener('click', () => showModal('transfer-modal'));
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Trade symbol change
    document.getElementById('trade-symbol').addEventListener('change', updateTradeChart);
    
    // Trade type change
    document.getElementById('trade-type').addEventListener('change', function() {
        const tradeBtn = document.getElementById('execute-trade');
        tradeBtn.textContent = this.value === 'buy' ? 'Buy' : 'Sell';
        tradeBtn.className = `trade-btn ${this.value}`;
    });
    
    // Execute trade
    document.getElementById('execute-trade').addEventListener('click', executeTrade);
    
    // Deposit method change
    document.querySelectorAll('input[name="deposit-method"]').forEach(radio => {
        radio.addEventListener('change', loadWalletAddresses);
    });
    
    // Copy address button
    document.getElementById('copy-address').addEventListener('click', copyDepositAddress);
    
    // Withdrawal form
    document.getElementById('withdrawal-form').addEventListener('submit', handleWithdrawal);
    
    // Transfer form
    document.getElementById('transfer-form').addEventListener('submit', handleTransfer);
    
    // Settings forms
    document.getElementById('personal-info-form').addEventListener('submit', updatePersonalInfo);
    document.getElementById('password-form').addEventListener('submit', changePassword);
    
    // History filter
    document.getElementById('history-type').addEventListener('change', loadTransactionHistory);
    
    // Chat functionality
    setupChatWidget();
    
    // Email verification handling
    document.getElementById('verify-code').addEventListener('click', verifyWithdrawalCode);
    document.getElementById('resend-code').addEventListener('click', resendVerificationCode);
}

function showSection(section) {
    // Update active sidebar link
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });
    
    // Show corresponding section
    document.querySelectorAll('.content-section').forEach(sectionEl => {
        sectionEl.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Load section-specific data
    if (section === 'trade') {
        updateTradeChart();
    } else if (section === 'wallet') {
        loadWalletAddresses();
    }
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    // Load modal-specific content
    if (modalId === 'deposit-modal') {
        loadDepositModal();
    } else if (modalId === 'withdrawal-modal') {
        loadWithdrawalModal();
    } else if (modalId === 'transfer-modal') {
        loadTransferModal();
    }
}

async function loadUserData() {
    try {
        // Get updated user data from Supabase
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.id)
            .single();
            
        if (error) throw error;
        
        // Update user data
        userData = { ...userData, ...data };
        localStorage.setItem('goldcrypto-user', JSON.stringify(userData));
        
        // Update UI
        document.getElementById('user-balance').textContent = `$${userData.balance?.toFixed(2) || '0.00'}`;
        document.getElementById('user-level').textContent = userData.level.charAt(0).toUpperCase() + userData.level.slice(1);
        document.getElementById('user-level').className = `level-${userData.level}`;
        
        // Update form max values
        document.getElementById('withdraw-amount').max = userData.balance || 0;
        document.getElementById('transfer-amount').max = userData.balance || 0;
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadMarketPrices() {
    try {
        // Mock data for demonstration
        const mockPrices = [
            { symbol: 'BTC', name: 'Bitcoin', price: 43456.78, change: 2.34 },
            { symbol: 'ETH', name: 'Ethereum', price: 2345.67, change: 1.56 },
            { symbol: 'SOL', name: 'Solana', price: 98.76, change: 5.67 },
            { symbol: 'ADA', name: 'Cardano', price: 0.4321, change: -1.45 },
            { symbol: 'XRP', name: 'Ripple', price: 0.5678, change: 3.21 },
            { symbol: 'DOT', name: 'Polkadot', price: 6.78, change: -2.34 }
        ];
        
        const pricesContainer = document.getElementById('market-prices');
        pricesContainer.innerHTML = '';
        
        mockPrices.forEach(crypto => {
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
            
            pricesContainer.appendChild(priceItem);
        });
        
    } catch (error) {
        console.error('Error loading market prices:', error);
    }
}

async function loadWalletAddresses() {
    try {
        const selectedMethod = document.querySelector('input[name="deposit-method"]:checked').value;
        
        // Get wallet addresses from Supabase
        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('type', selectedMethod)
            .eq('is_active', true)
            .single();
            
        if (error) {
            // If no wallet found, show default message
            document.getElementById('deposit-address').textContent = 'Wallet address not configured. Please contact support.';
            return;
        }
        
        document.getElementById('deposit-address').textContent = data.address;
        
    } catch (error) {
        console.error('Error loading wallet addresses:', error);
        document.getElementById('deposit-address').textContent = 'Error loading address. Please try again.';
    }
}

function copyDepositAddress() {
    const address = document.getElementById('deposit-address').textContent;
    if (address && !address.includes('Error') && !address.includes('not configured')) {
        navigator.clipboard.writeText(address).then(() => {
            alert('Address copied to clipboard!');
        });
    } else {
        alert('Cannot copy invalid address');
    }
}

async function loadTransactionHistory() {
    try {
        const filter = document.getElementById('history-type').value;
        
        // Get transactions from Supabase
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userData.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const historyContainer = document.getElementById('transaction-history');
        historyContainer.innerHTML = '';
        
        let transactions = data || [];
        
        // Apply filter if not "all"
        if (filter !== 'all') {
            transactions = transactions.filter(t => t.type === filter);
        }
        
        if (transactions.length === 0) {
            historyContainer.innerHTML = '<p>No transactions found.</p>';
            return;
        }
        
        transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            
            const date = new Date(transaction.created_at).toLocaleDateString();
            const amount = transaction.type === 'withdrawal' ? -transaction.amount : transaction.amount;
            
            transactionItem.innerHTML = `
                <div>
                    <div class="transaction-type ${transaction.type}">${transaction.type.toUpperCase()}</div>
                    <div>${date}</div>
                </div>
                <div>
                    <div>$${amount.toFixed(2)}</div>
                    <div class="transaction-status ${transaction.status}">${transaction.status}</div>
                </div>
            `;
            
            historyContainer.appendChild(transactionItem);
        });
        
    } catch (error) {
        console.error('Error loading transaction history:', error);
    }
}

async function loadOpenTrades() {
    try {
        // Get open trades from Supabase
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', userData.id)
            .eq('status', 'open')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const tradesContainer = document.getElementById('open-trades-list');
        tradesContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            tradesContainer.innerHTML = '<p>No open trades.</p>';
            return;
        }
        
        data.forEach(trade => {
            const tradeItem = document.createElement('div');
            tradeItem.className = 'trade-item';
            
            const currentPrice = getCurrentPrice(trade.symbol);
            const pnl = trade.type === 'buy' 
                ? (currentPrice - trade.price) * trade.amount * trade.leverage
                : (trade.price - currentPrice) * trade.amount * trade.leverage;
            
            tradeItem.innerHTML = `
                <div class="trade-info">
                    <div class="trade-symbol">${trade.symbol}</div>
                    <div class="trade-type ${trade.type}">${trade.type.toUpperCase()} | Leverage: ${trade.leverage}x</div>
                    <div>Entry: $${trade.price} | Amount: $${trade.amount}</div>
                    <div>P&L: $${pnl.toFixed(2)}</div>
                </div>
                <div class="trade-actions">
                    <button class="close-trade" data-trade-id="${trade.id}">Close Trade</button>
                </div>
            `;
            
            tradesContainer.appendChild(tradeItem);
        });
        
        // Add event listeners to close trade buttons
        document.querySelectorAll('.close-trade').forEach(button => {
            button.addEventListener('click', function() {
                const tradeId = this.getAttribute('data-trade-id');
                closeTrade(tradeId);
            });
        });
        
    } catch (error) {
        console.error('Error loading open trades:', error);
    }
}

function getCurrentPrice(symbol) {
    // Mock function to get current price
    const prices = {
        'BTC': 43456.78,
        'ETH': 2345.67,
        'SOL': 98.76,
        'ADA': 0.4321,
        'XRP': 0.5678
    };
    
    return prices[symbol] || 0;
}

function updateTradeChart() {
    const symbol = document.getElementById('trade-symbol').value;
    const currentPrice = getCurrentPrice(symbol);
    
    // Update entry price field
    document.getElementById('entry-price').value = currentPrice.toFixed(2);
    
    // Create or update chart
    const ctx = document.getElementById('price-chart').getContext('2d');
    
    if (priceChart) {
        priceChart.destroy();
    }
    
    // Generate mock price data
    const labels = [];
    const data = [];
    let price = currentPrice;
    
    for (let i = 24; i >= 0; i--) {
        labels.push(`${i}h`);
        // Random price movement
        price = price * (1 + (Math.random() - 0.5) * 0.02);
        data.push(price);
    }
    
    labels.reverse();
    data.reverse();
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${symbol} Price`,
                data: data,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#d4af37'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#d4af37'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#d4af37'
                    }
                }
            }
        }
    });
}

async function executeTrade() {
    try {
        const symbol = document.getElementById('trade-symbol').value;
        const type = document.getElementById('trade-type').value;
        const amount = parseFloat(document.getElementById('trade-amount').value);
        const leverage = parseInt(document.getElementById('trade-leverage').value);
        const price = parseFloat(document.getElementById('entry-price').value);
        
        // Validate inputs
        if (amount < 10) {
            alert('Minimum trade amount is $10');
            return;
        }
        
        if (amount * leverage > userData.balance) {
            alert('Insufficient balance for this trade');
            return;
        }
        
        // Create trade in Supabase
        const { data, error } = await supabase
            .from('trades')
            .insert([
                {
                    user_id: userData.id,
                    symbol: symbol,
                    type: type,
                    amount: amount,
                    price: price,
                    leverage: leverage,
                    status: 'open',
                    created_at: new Date().toISOString()
                }
            ])
            .select();
            
        if (error) throw error;
        
        // Update user balance (deduct margin)
        const margin = amount * leverage;
        const newBalance = userData.balance - margin;
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userData.id);
            
        if (updateError) throw updateError;
        
        // Update UI
        userData.balance = newBalance;
        localStorage.setItem('goldcrypto-user', JSON.stringify(userData));
        document.getElementById('user-balance').textContent = `$${newBalance.toFixed(2)}`;
        
        alert('Trade executed successfully!');
        loadOpenTrades();
        
    } catch (error) {
        console.error('Error executing trade:', error);
        alert('Error executing trade: ' + error.message);
    }
}

async function closeTrade(tradeId) {
    try {
        // Get trade details
        const { data: trade, error: tradeError } = await supabase
            .from('trades')
            .select('*')
            .eq('id', tradeId)
            .single();
            
        if (tradeError) throw tradeError;
        
        // Calculate P&L
        const currentPrice = getCurrentPrice(trade.symbol);
        let pnl = 0;
        
        if (trade.type === 'buy') {
            pnl = (currentPrice - trade.price) * trade.amount * trade.leverage;
        } else {
            pnl = (trade.price - currentPrice) * trade.amount * trade.leverage;
        }
        
        // Update trade status
        const { error: updateError } = await supabase
            .from('trades')
            .update({ 
                status: 'closed',
                closed_at: new Date().toISOString()
            })
            .eq('id', tradeId);
            
        if (updateError) throw updateError;
        
        // Update user balance
        const margin = trade.amount * trade.leverage;
        const newBalance = userData.balance + margin + pnl;
        
        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userData.id);
            
        if (balanceError) throw balanceError;
        
        // Record transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([
                {
                    user_id: userData.id,
                    type: 'trade',
                    amount: pnl,
                    status: 'completed',
                    details: {
                        trade_id: tradeId,
                        symbol: trade.symbol,
                        type: trade.type,
                        leverage: trade.leverage
                    },
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (transactionError) throw transactionError;
        
        // Update UI
        userData.balance = newBalance;
        localStorage.setItem('goldcrypto-user', JSON.stringify(userData));
        document.getElementById('user-balance').textContent = `$${newBalance.toFixed(2)}`;
        
        alert(`Trade closed. P&L: $${pnl.toFixed(2)}`);
        loadOpenTrades();
        loadTransactionHistory();
        
    } catch (error) {
        console.error('Error closing trade:', error);
        alert('Error closing trade: ' + error.message);
    }
}

async function handleWithdrawal(e) {
    e.preventDefault();
    
    try {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const address = document.getElementById('withdraw-address').value;
        const method = document.getElementById('withdraw-method').value;
        
        // Validate inputs
        if (amount < 10) {
            showMessage('withdrawal-message', 'Minimum withdrawal amount is $10', 'error');
            return;
        }
        
        if (amount > userData.balance) {
            showMessage('withdrawal-message', 'Insufficient balance', 'error');
            return;
        }
        
        if (!address) {
            showMessage('withdrawal-message', 'Please enter a valid wallet address', 'error');
            return;
        }
        
        // Show email verification modal
        document.getElementById('withdrawal-modal').style.display = 'none';
        document.getElementById('email-modal').style.display = 'block';
        
        // Store withdrawal details for after verification
        window.pendingWithdrawal = { amount, address, method };
        
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showMessage('withdrawal-message', 'Error: ' + error.message, 'error');
    }
}

async function handleTransfer(e) {
    e.preventDefault();
    
    try {
        const recipientEmail = document.getElementById('recipient-email').value;
        const amount = parseFloat(document.getElementById('transfer-amount').value);
        
        // Validate inputs
        if (amount < 1) {
            showMessage('transfer-message', 'Minimum transfer amount is $1', 'error');
            return;
        }
        
        if (amount > userData.balance) {
            showMessage('transfer-message', 'Insufficient balance', 'error');
            return;
        }
        
        if (recipientEmail === userData.email) {
            showMessage('transfer-message', 'Cannot transfer to your own account', 'error');
            return;
        }
        
        // Check if recipient exists and has premium level
        const { data: recipient, error: recipientError } = await supabase
            .from('profiles')
            .select('id, level, balance')
            .eq('email', recipientEmail)
            .single();
            
        if (recipientError || !recipient) {
            showMessage('transfer-message', 'Recipient not found', 'error');
            return;
        }
        
        if (recipient.level !== 'premium') {
            showMessage('transfer-message', 'Recipient must have a premium account for internal transfers', 'error');
            return;
        }
        
        // Check if user has premium level
        if (userData.level !== 'premium') {
            showMessage('transfer-message', 'You must have a premium account for internal transfers', 'error');
            return;
        }
        
        // Execute transfer
        const newBalance = userData.balance - amount;
        
        // Update sender balance
        const { error: senderError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userData.id);
            
        if (senderError) throw senderError;
        
        // Update recipient balance
        const { error: recipientUpdateError } = await supabase
            .from('profiles')
            .update({ balance: (recipient.balance || 0) + amount })
            .eq('id', recipient.id);
            
        if (recipientUpdateError) throw recipientUpdateError;
        
        // Record transaction for sender
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([
                {
                    user_id: userData.id,
                    type: 'transfer',
                    amount: -amount,
                    status: 'completed',
                    details: {
                        recipient: recipientEmail,
                        note: 'Internal transfer'
                    },
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (transactionError) throw transactionError;
        
        // Record transaction for recipient
        const { error: recipientTransactionError } = await supabase
            .from('transactions')
            .insert([
                {
                    user_id: recipient.id,
                    type: 'transfer',
                    amount: amount,
                    status: 'completed',
                    details: {
                        sender: userData.email,
                        note: 'Internal transfer received'
                    },
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (recipientTransactionError) throw recipientTransactionError;
        
        // Update UI
        userData.balance = newBalance;
        localStorage.setItem('goldcrypto-user', JSON.stringify(userData));
        document.getElementById('user-balance').textContent = `$${newBalance.toFixed(2)}`;
        
        showMessage('transfer-message', 'Transfer completed successfully!', 'success');
        document.getElementById('transfer-form').reset();
        loadTransactionHistory();
        
    } catch (error) {
        console.error('Error processing transfer:', error);
        showMessage('transfer-message', 'Error: ' + error.message, 'error');
    }
}

async function updatePersonalInfo(e) {
    e.preventDefault();
    
    try {
        const name = document.getElementById('user-name').value;
        
        // Update user profile in Supabase
        const { error } = await supabase
            .from('profiles')
            .update({ 
                full_name: name,
                updated_at: new Date().toISOString()
            })
            .eq('id', userData.id);
            
        if (error) throw error;
        
        // Update local storage
        userData.full_name = name;
        localStorage.setItem('goldcrypto-user', JSON.stringify(userData));
        
        alert('Personal information updated successfully!');
        
    } catch (error) {
        console.error('Error updating personal info:', error);
        alert('Error updating information: ' + error.message);
    }
}

async function changePassword(e) {
    e.preventDefault();
    
    try {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate inputs
        if (newPassword !== confirmPassword) {
            showMessage('password-message', 'New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showMessage('password-message', 'Password must be at least 6 characters', 'error');
            return;
        }
        
        // Update password in Supabase
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        
        showMessage('password-message', 'Password updated successfully!', 'success');
        document.getElementById('password-form').reset();
        
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('password-message', 'Error: ' + error.message, 'error');
    }
}

function loadDepositModal() {
    const content = document.getElementById('deposit-modal-content');
    const method = document.querySelector('input[name="deposit-method"]:checked').value;
    const address = document.getElementById('deposit-address').textContent;
    
    content.innerHTML = `
        <p>To deposit funds, send USDT to the following ${method.toUpperCase()} address:</p>
        <div class="address-display">${address}</div>
        <p><strong>Important:</strong></p>
        <ul>
            <li>Only send USDT to this address</li>
            <li>Ensure you're using the correct network (${method.toUpperCase()})</li>
            <li>Transactions may take up to 30 minutes to confirm</li>
            <li>After sending, contact support with your transaction ID for verification</li>
        </ul>
        <button id="modal-copy-address" class="action-button">Copy Address</button>
    `;
    
    document.getElementById('modal-copy-address').addEventListener('click', copyDepositAddress);
}

function loadWithdrawalModal() {
    const content = document.getElementById('withdrawal-modal-content');
    
    content.innerHTML = `
        <form id="modal-withdrawal-form">
            <div class="form-group">
                <label for="modal-withdraw-amount">Amount (USD)</label>
                <input type="number" id="modal-withdraw-amount" min="10" step="0.01" max="${userData.balance || 0}">
            </div>
            <div class="form-group">
                <label for="modal-withdraw-address">Destination Wallet Address</label>
                <input type="text" id="modal-withdraw-address" required>
            </div>
            <div class="form-group">
                <label for="modal-withdraw-method">Withdrawal Method</label>
                <select id="modal-withdraw-method">
                    <option value="trc20">USDT (TRC20)</option>
                    <option value="erc20">USDT (ERC20)</option>
                </select>
            </div>
            <button type="submit" class="action-button">Request Withdrawal</button>
        </form>
    `;
    
    document.getElementById('modal-withdrawal-form').addEventListener('submit', function(e) {
        e.preventDefault();
        document.getElementById('withdrawal-modal').style.display = 'none';
        document.getElementById('email-modal').style.display = 'block';
        
        const amount = document.getElementById('modal-withdraw-amount').value;
        const address = document.getElementById('modal-withdraw-address').value;
        const method = document.getElementById('modal-withdraw-method').value;
        
        window.pendingWithdrawal = { amount, address, method };
    });
}

function loadTransferModal() {
    const content = document.getElementById('transfer-modal-content');
    
    content.innerHTML = `
        <form id="modal-transfer-form">
            <div class="form-group">
                <label for="modal-recipient-email">Recipient Email</label>
                <input type="email" id="modal-recipient-email" required>
            </div>
            <div class="form-group">
                <label for="modal-transfer-amount">Amount (USD)</label>
                <input type="number" id="modal-transfer-amount" min="1" step="0.01" max="${userData.balance || 0}">
            </div>
            <p><strong>Note:</strong> Both you and the recipient must have premium accounts for internal transfers.</p>
            <button type="submit" class="action-button">Transfer Funds</button>
        </form>
    `;
    
    document.getElementById('modal-transfer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const recipientEmail = document.getElementById('modal-recipient-email').value;
        const amount = parseFloat(document.getElementById('modal-transfer-amount').value);
        
        // Simulate transfer (in a real app, this would be handled by the main transfer function)
        alert(`Transfer of $${amount} to ${recipientEmail} would be processed.`);
        document.getElementById('transfer-modal').style.display = 'none';
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
    
    // Send message functionality
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
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
        
        // Save message to Supabase
        supabase
            .from('chat_messages')
            .insert([
                {
                    user_id: userData.id,
                    message: message,
                    is_admin: false,
                    created_at: new Date().toISOString()
                }
            ])
            .then(({ error }) => {
                if (error) console.error('Error saving message:', error);
            });
        
        // Simulate support response
        setTimeout(() => {
            const supportMessage = document.createElement('div');
            supportMessage.className = 'message support';
            supportMessage.textContent = 'Thank you for your message. Our support team will respond shortly.';
            chatMessages.appendChild(supportMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Save support response to Supabase
            supabase
                .from('chat_messages')
                .insert([
                    {
                        user_id: userData.id,
                        message: 'Thank you for your message. Our support team will respond shortly.',
                        is_admin: true,
                        created_at: new Date().toISOString()
                    }
                ])
                .then(({ error }) => {
                    if (error) console.error('Error saving support message:', error);
                });
        }, 1000);
    }
}

function showMessage(elementId, text, type) {
    const element = document.getElementById(elementId);
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function logout() {
    localStorage.removeItem('goldcrypto-user');
    window.location.href = 'index.html';
}

// Email verification handling
async function verifyWithdrawalCode() {
    const code = document.getElementById('verification-code').value;
    
    if (!code) {
        alert('Please enter the verification code');
        return;
    }
    
    // In a real application, you would verify the code with your backend
    // For this demo, we'll assume any 6-digit code is valid
    if (code.length === 6 && /^\d+$/.test(code)) {
        // Process the pending withdrawal
        const withdrawal = window.pendingWithdrawal;
        
        try {
            // Record withdrawal request
            const { error } = await supabase
                .from('transactions')
                .insert([
                    {
                        user_id: userData.id,
                        type: 'withdrawal',
                        amount: -parseFloat(withdrawal.amount),
                        status: 'pending',
                        details: {
                            address: withdrawal.address,
                            method: withdrawal.method
                        },
                        created_at: new Date().toISOString()
                    }
                ]);
                
            if (error) throw error;
            
            // Show success message
            alert('Withdrawal request submitted successfully! It will be processed within 24 hours.');
            
            // Close modal and reset form
            document.getElementById('email-modal').style.display = 'none';
            document.getElementById('withdrawal-form').reset();
            loadTransactionHistory();
            
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            alert('Error processing withdrawal: ' + error.message);
        }
    } else {
        alert('Invalid verification code');
    }
}

function resendVerificationCode() {
    alert('Verification code has been resent to your email.');
}
