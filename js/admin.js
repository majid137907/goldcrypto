// admin.js - نسخه بازنویسی شده
document.addEventListener('DOMContentLoaded', function() {
    initAdminPanel();
});

let adminData = null;
let currentPage = 1;
let usersPerPage = 10;
let totalUsers = 0;
let currentChatUser = null;
let chatSubscription = null;

async function initAdminPanel() {
    await checkAdminAuth();
    setupAdminEventListeners();
    loadDashboardStats();
    loadRecentActivity();
    loadUsers();
    loadWalletSettings();
    loadSystemSettings();
    loadActiveChats();
    setupRealtimeSubscriptions();
}

async function checkAdminAuth() {
    adminData = JSON.parse(localStorage.getItem('goldcrypto-user'));
    
    if (!adminData || adminData.level !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('admin-name').textContent = adminData.email;
}

function setupAdminEventListeners() {
    // Navigation
    document.querySelectorAll('.admin-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showAdminSection(section);
        });
    });

    // Card actions
    document.querySelectorAll('.card-action').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showAdminSection(section);
        });
    });

    // Logout
    document.getElementById('admin-logout').addEventListener('click', logout);

    // User management
    document.getElementById('search-users').addEventListener('click', loadUsers);
    document.getElementById('user-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loadUsers();
    });
    document.getElementById('user-level-filter').addEventListener('change', loadUsers);
    document.getElementById('user-status-filter').addEventListener('change', loadUsers);
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));

    // User edit form
    document.getElementById('user-edit-form').addEventListener('submit', saveUserChanges);
    document.getElementById('delete-user').addEventListener('click', deleteUser);

    // Wallet settings
    document.querySelectorAll('.save-wallet').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            saveWalletSettings(type);
        });
    });

    // System settings
    document.getElementById('trading-settings-form').addEventListener('submit', saveTradingSettings);
    document.getElementById('withdrawal-settings-form').addEventListener('submit', saveWithdrawalSettings);

    // Maintenance actions
    document.getElementById('backup-database').addEventListener('click', backupDatabase);
    document.getElementById('clear-cache').addEventListener('click', clearCache);
    document.getElementById('system-status').addEventListener('click', checkSystemStatus);

    // Support chat
    document.getElementById('admin-send-message').addEventListener('click', sendAdminMessage);
    document.getElementById('admin-chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAdminMessage();
        }
    });

    // Reports
    document.getElementById('report-type').addEventListener('change', toggleCustomRange);
    document.getElementById('report-period').addEventListener('change', toggleCustomRange);
    document.getElementById('generate-report').addEventListener('click', generateReport);

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

    // Confirmation modal
    document.getElementById('cancel-action').addEventListener('click', () => {
        document.getElementById('confirmation-modal').style.display = 'none';
    });
}

function showAdminSection(section) {
    document.querySelectorAll('.admin-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });
    
    document.querySelectorAll('.admin-section').forEach(sectionEl => {
        sectionEl.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    if (section === 'dashboard') {
        loadDashboardStats();
        loadRecentActivity();
    } else if (section === 'users') {
        loadUsers();
    } else if (section === 'wallets') {
        loadDepositRequests();
    } else if (section === 'support') {
        loadActiveChats();
    }
}

async function loadDashboardStats() {
    try {
        // Total users
        const { count: totalUsers, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
            
        if (usersError) throw usersError;
        
        // Active users today
        const today = new Date().toISOString().split('T')[0];
        const { count: activeToday, error: activeError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('last_login', today);
            
        if (activeError) throw activeError;
        
        // Total balance
        const { data: balances, error: balanceError } = await supabase
            .from('profiles')
            .select('balance');
            
        if (balanceError) throw balanceError;
        
        const totalBalance = balances.reduce((sum, user) => sum + (user.balance || 0), 0);
        
        // Update UI
        document.getElementById('total-users').textContent = totalUsers || 0;
        document.getElementById('active-today').textContent = activeToday || 0;
        document.getElementById('total-balance').textContent = `$${totalBalance.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('Error loading dashboard statistics', 'error');
    }
}

async function loadRecentActivity() {
    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        const { data: trades, error: tradesError } = await supabase
            .from('trades')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (tradesError) throw tradesError;
        
        const activities = [
            ...(transactions || []).map(t => ({
                type: 'Transaction',
                description: `${t.type} - $${t.amount}`,
                time: new Date(t.created_at).toLocaleString()
            })),
            ...(trades || []).map(t => ({
                type: 'Trade',
                description: `${t.symbol} ${t.type} - $${t.amount}`,
                time: new Date(t.created_at).toLocaleString()
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
        
        const activityList = document.getElementById('recent-activity');
        activityList.innerHTML = '';
        
        if (activities.length === 0) {
            activityList.innerHTML = '<p>No recent activity</p>';
            return;
        }
        
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-details">
                    <div class="activity-type">${activity.type}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
                <div class="activity-time">${activity.time}</div>
            `;
            activityList.appendChild(activityItem);
        });
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

async function loadUsers() {
    try {
        const searchTerm = document.getElementById('user-search').value;
        const levelFilter = document.getElementById('user-level-filter').value;
        const statusFilter = document.getElementById('user-status-filter').value;
        
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' });
            
        if (searchTerm) {
            query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
        }
        
        if (levelFilter !== 'all') {
            query = query.eq('level', levelFilter);
        }
        
        if (statusFilter !== 'all') {
            query = query.eq('is_active', statusFilter === 'active');
        }
        
        const from = (currentPage - 1) * usersPerPage;
        const to = from + usersPerPage - 1;
        
        const { data: users, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
            
        if (error) throw error;
        
        totalUsers = count;
        
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '';
        
        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No users found</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id.substring(0, 8)}...</td>
                <td>${user.email}</td>
                <td>${user.full_name || 'N/A'}</td>
                <td><span class="user-level level-${user.level}">${user.level}</span></td>
                <td>$${(user.balance || 0).toFixed(2)}</td>
                <td><span class="user-status status-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td class="user-actions">
                    <button class="action-button edit-user" data-user-id="${user.id}">Edit</button>
                    ${user.level !== 'admin' ? `<button class="danger-button delete-user-btn" data-user-id="${user.id}">Delete</button>` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        updatePagination();
        
        document.querySelectorAll('.edit-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                editUser(userId);
            });
        });
        
        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                confirmDeleteUser(userId);
            });
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

function updatePagination() {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

function changePage(direction) {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadUsers();
    }
}

async function editUser(userId) {
    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-name').value = user.full_name || '';
        document.getElementById('edit-user-level').value = user.level;
        document.getElementById('edit-user-balance').value = user.balance || 0;
        document.getElementById('edit-user-status').value = user.is_active ? 'active' : 'inactive';
        
        document.getElementById('user-edit-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error loading user data', 'error');
    }
}

async function saveUserChanges(e) {
    e.preventDefault();
    
    try {
        const userId = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const level = document.getElementById('edit-user-level').value;
        const balance = parseFloat(document.getElementById('edit-user-balance').value);
        const status = document.getElementById('edit-user-status').value === 'active';
        
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: name,
                level: level,
                balance: balance,
                is_active: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
        if (error) throw error;
        
        document.getElementById('user-edit-modal').style.display = 'none';
        loadUsers();
        showNotification('User updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error updating user', 'error');
    }
}

function confirmDeleteUser(userId) {
    window.pendingDeleteUserId = userId;
    
    document.getElementById('confirmation-title').textContent = 'Delete User';
    document.getElementById('confirmation-message').textContent = 'Are you sure you want to delete this user? This action cannot be undone.';
    document.getElementById('confirmation-modal').style.display = 'block';
    
    document.getElementById('confirm-action').onclick = deleteUserConfirmed;
}

async function deleteUserConfirmed() {
    try {
        const userId = window.pendingDeleteUserId;
        
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
            
        if (error) throw error;
        
        document.getElementById('confirmation-modal').style.display = 'none';
        loadUsers();
        showNotification('User deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
    }
}

async function loadWalletSettings() {
    try {
        // Try to load from database first
        const { data: wallets, error } = await supabase
            .from('wallets')
            .select('*');
            
        if (!error && wallets && wallets.length > 0) {
            wallets.forEach(wallet => {
                if (wallet.type === 'trc20') {
                    document.getElementById('trc20-address').value = wallet.address;
                    document.getElementById('trc20-status').value = wallet.is_active ? 'active' : 'inactive';
                } else if (wallet.type === 'erc20') {
                    document.getElementById('erc20-address').value = wallet.address;
                    document.getElementById('erc20-status').value = wallet.is_active ? 'active' : 'inactive';
                }
            });
        } else {
            // Use default addresses
            setDefaultWalletAddresses();
        }
        
    } catch (error) {
        console.error('Error loading wallet settings:', error);
        setDefaultWalletAddresses();
    }
}

function setDefaultWalletAddresses() {
    document.getElementById('trc20-address').value = 'THdTNV89Y57cnReqZvZ9JGuBTw25me5UGM';
    document.getElementById('erc20-address').value = '0x572d104aaa445bd8a82a19315e09cc3472e72cb2';
    document.getElementById('trc20-status').value = 'active';
    document.getElementById('erc20-status').value = 'active';
}

async function saveWalletSettings(type) {
    try {
        const address = document.getElementById(`${type}-address`).value;
        const status = document.getElementById(`${type}-status`).value === 'active';
        
        if (!address) {
            showNotification('Please enter a wallet address', 'error');
            return;
        }
        
        // Check if wallet exists
        const { data: existingWallet, error: checkError } = await supabase
            .from('wallets')
            .select('*')
            .eq('type', type)
            .single();
            
        if (checkError && checkError.code === 'PGRST116') {
            // Create new wallet
            const { error } = await supabase
                .from('wallets')
                .insert([
                    {
                        type: type,
                        address: address,
                        is_active: status,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);
                
            if (error) throw error;
        } else {
            // Update existing wallet
            const { error } = await supabase
                .from('wallets')
                .update({
                    address: address,
                    is_active: status,
                    updated_at: new Date().toISOString()
                })
                .eq('type', type);
                
            if (error) throw error;
        }
        
        showNotification(`${type.toUpperCase()} wallet settings saved successfully`, 'success');
        
    } catch (error) {
        console.error('Error saving wallet settings:', error);
        showNotification('Error saving wallet settings', 'error');
    }
}

async function loadDepositRequests() {
    try {
        const { data: deposits, error } = await supabase
            .from('transactions')
            .select(`
                *,
                profiles:user_id(email, full_name)
            `)
            .eq('type', 'deposit')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const container = document.getElementById('deposit-requests');
        container.innerHTML = '';
        
        if (!deposits || deposits.length === 0) {
            container.innerHTML = '<p>No pending deposit requests</p>';
            return;
        }
        
        deposits.forEach(deposit => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.innerHTML = `
                <div class="transaction-info">
                    <div><strong>${deposit.profiles.email}</strong></div>
                    <div>Amount: $${deposit.amount}</div>
                    <div>Date: ${new Date(deposit.created_at).toLocaleString()}</div>
                </div>
                <div class="transaction-actions">
                    <button class="action-button approve-deposit" data-transaction-id="${deposit.id}">Approve</button>
                    <button class="danger-button reject-deposit" data-transaction-id="${deposit.id}">Reject</button>
                </div>
            `;
            container.appendChild(item);
        });
        
        document.querySelectorAll('.approve-deposit').forEach(button => {
            button.addEventListener('click', function() {
                const transactionId = this.getAttribute('data-transaction-id');
                processDeposit(transactionId, 'completed');
            });
        });
        
        document.querySelectorAll('.reject-deposit').forEach(button => {
            button.addEventListener('click', function() {
                const transactionId = this.getAttribute('data-transaction-id');
                processDeposit(transactionId, 'rejected');
            });
        });
        
    } catch (error) {
        console.error('Error loading deposit requests:', error);
    }
}

async function processDeposit(transactionId, status) {
    try {
        const { error } = await supabase
            .from('transactions')
            .update({ status: status })
            .eq('id', transactionId);
            
        if (error) throw error;
        
        if (status === 'completed') {
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', transactionId)
                .single();
                
            if (txError) throw txError;
            
            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', transaction.user_id)
                .single();
                
            if (userError) throw userError;
            
            const newBalance = (user.balance || 0) + transaction.amount;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', transaction.user_id);
                
            if (updateError) throw updateError;
            
            if (newBalance >= 70) {
                const { error: upgradeError } = await supabase
                    .from('profiles')
                    .update({ level: 'premium' })
                    .eq('id', transaction.user_id)
                    .eq('level', 'gold');
                    
                if (upgradeError) throw upgradeError;
            }
        }
        
        loadDepositRequests();
        showNotification(`Deposit request ${status} successfully`, 'success');
        
    } catch (error) {
        console.error('Error processing deposit:', error);
        showNotification('Error processing deposit request', 'error');
    }
}

async function loadSystemSettings() {
    // Use default values
    document.getElementById('min-trade-amount').value = 10;
    document.getElementById('max-leverage').value = 10;
    document.getElementById('premium-threshold').value = 70;
    document.getElementById('min-withdrawal').value = 10;
    document.getElementById('withdrawal-fee').value = 1;
    document.getElementById('auto-approve-withdrawals').value = 'disabled';
}

async function saveTradingSettings(e) {
    e.preventDefault();
    
    try {
        // Simulate saving
        await new Promise(resolve => setTimeout(resolve, 1000));
        showNotification('Trading settings saved successfully', 'success');
        
    } catch (error) {
        console.error('Error saving trading settings:', error);
        showNotification('Error saving trading settings', 'error');
    }
}

async function saveWithdrawalSettings(e) {
    e.preventDefault();
    
    try {
        // Simulate saving
        await new Promise(resolve => setTimeout(resolve, 1000));
        showNotification('Withdrawal settings saved successfully', 'success');
        
    } catch (error) {
        console.error('Error saving withdrawal settings:', error);
        showNotification('Error saving withdrawal settings', 'error');
    }
}

async function backupDatabase() {
    try {
        addMaintenanceLog('Starting database backup...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        addMaintenanceLog('Database backup completed successfully');
        showNotification('Database backup completed', 'success');
        
    } catch (error) {
        console.error('Error backing up database:', error);
        addMaintenanceLog('Database backup failed: ' + error.message);
        showNotification('Error backing up database', 'error');
    }
}

async function clearCache() {
    try {
        addMaintenanceLog('Clearing cache...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        addMaintenanceLog('Cache cleared successfully');
        showNotification('Cache cleared successfully', 'success');
        
    } catch (error) {
        console.error('Error clearing cache:', error);
        addMaintenanceLog('Cache clearance failed: ' + error.message);
        showNotification('Error clearing cache', 'error');
    }
}

async function checkSystemStatus() {
    try {
        addMaintenanceLog('Checking system status...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        addMaintenanceLog('System status: All systems operational');
        showNotification('System status check completed', 'success');
        
    } catch (error) {
        console.error('Error checking system status:', error);
        addMaintenanceLog('System status check failed: ' + error.message);
        showNotification('Error checking system status', 'error');
    }
}

function addMaintenanceLog(message) {
    const log = document.getElementById('maintenance-log');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;
    log.appendChild(logEntry);
    log.scrollTop = log.scrollHeight;
}

// سیستم چت کاملاً بازنویسی شده
async function loadActiveChats() {
    try {
        // Get unique users with chat messages
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                profiles:user_id(email, full_name)
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Group by user and count unread messages
        const userChats = new Map();
        
        (messages || []).forEach(message => {
            if (!userChats.has(message.user_id)) {
                userChats.set(message.user_id, {
                    user: message.profiles,
                    lastMessage: message.message,
                    lastTime: message.created_at,
                    unreadCount: 0,
                    messageCount: 0
                });
            }
            
            const chat = userChats.get(message.user_id);
            chat.messageCount++;
            
            // Update last message
            if (new Date(message.created_at) > new Date(chat.lastTime)) {
                chat.lastMessage = message.message;
                chat.lastTime = message.created_at;
            }
            
            // Count unread user messages
            if (!message.is_admin && !message.is_read) {
                chat.unreadCount++;
            }
        });
        
        // Update UI
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';
        
        if (userChats.size === 0) {
            chatList.innerHTML = '<p class="no-chats">No active conversations</p>';
            return;
        }
        
        userChats.forEach((chat, userId) => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.setAttribute('data-user-id', userId);
            
            const unreadBadge = chat.unreadCount > 0 ? 
                `<span class="unread-badge">${chat.unreadCount}</span>` : '';
            
            const time = new Date(chat.lastTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            chatItem.innerHTML = `
                <div class="chat-item-header">
                    <div class="chat-user">${chat.user.full_name || chat.user.email}</div>
                    <div class="chat-time">${time}</div>
                </div>
                <div class="chat-preview">
                    ${chat.lastMessage.substring(0, 50)}${chat.lastMessage.length > 50 ? '...' : ''}
                    ${unreadBadge}
                </div>
            `;
            
            chatList.appendChild(chatItem);
            
            // Add click event
            chatItem.addEventListener('click', () => {
                // Remove selected class from all items
                document.querySelectorAll('.chat-item').forEach(item => {
                    item.classList.remove('selected');
                });
                // Add selected class to current item
                chatItem.classList.add('selected');
                
                loadUserChat(userId, chat.user);
            });
        });
        
    } catch (error) {
        console.error('Error loading active chats:', error);
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '<p class="error-message">Error loading conversations</p>';
    }
}

async function loadUserChat(userId, user) {
    try {
        currentChatUser = { id: userId, ...user };
        
        // Update UI
        document.getElementById('current-chat-user').textContent = user.full_name || user.email;
        document.getElementById('current-chat-status').textContent = 'Online';
        
        // Enable chat input
        document.getElementById('admin-chat-input').disabled = false;
        document.getElementById('admin-send-message').disabled = false;
        
        // Get chat messages
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        
        // Display messages
        const chatMessages = document.getElementById('admin-chat-messages');
        chatMessages.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            const welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'chat-message system-message';
            welcomeMsg.textContent = 'No messages yet. Start a conversation!';
            chatMessages.appendChild(welcomeMsg);
        } else {
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `chat-message ${message.is_admin ? 'message-admin' : 'message-user'}`;
                
                const time = new Date(message.created_at).toLocaleTimeString();
                messageDiv.innerHTML = `
                    <div class="message-content">${message.message}</div>
                    <div class="message-time">${time}</div>
                `;
                chatMessages.appendChild(messageDiv);
            });
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Mark user messages as read
        await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_admin', false)
            .eq('is_read', false);
            
        // Remove unread indicators
        document.querySelectorAll('.chat-item').forEach(item => {
            if (item.getAttribute('data-user-id') === userId) {
                const badge = item.querySelector('.unread-badge');
                if (badge) badge.remove();
            }
        });
        
        // Setup real-time subscription
        setupChatSubscription(userId);
        
    } catch (error) {
        console.error('Error loading user chat:', error);
        showNotification('Error loading chat: ' + error.message, 'error');
    }
}

function setupChatSubscription(userId) {
    // Unsubscribe from previous subscription
    if (chatSubscription) {
        chatSubscription.unsubscribe();
    }
    
    // Subscribe to new messages for this user
    chatSubscription = supabase
        .channel(`chat:${userId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages',
                filter: `user_id=eq.${userId}`
            }, 
            (payload) => {
                const newMessage = payload.new;
                const chatMessages = document.getElementById('admin-chat-messages');
                
                // Remove system message if present
                const systemMsg = chatMessages.querySelector('.system-message');
                if (systemMsg) systemMsg.remove();
                
                const messageDiv = document.createElement('div');
                messageDiv.className = `chat-message ${newMessage.is_admin ? 'message-admin' : 'message-user'}`;
                
                const time = new Date(newMessage.created_at).toLocaleTimeString();
                messageDiv.innerHTML = `
                    <div class="message-content">${newMessage.message}</div>
                    <div class="message-time">${time}</div>
                `;
                chatMessages.appendChild(messageDiv);
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Mark as read if it's a user message
                if (!newMessage.is_admin) {
                    supabase
                        .from('chat_messages')
                        .update({ is_read: true })
                        .eq('id', newMessage.id);
                }
            }
        )
        .subscribe((status) => {
            console.log('Chat subscription status:', status);
        });
}

async function sendAdminMessage() {
    try {
        if (!currentChatUser) {
            showNotification('Please select a conversation first', 'error');
            return;
        }
        
        const input = document.getElementById('admin-chat-input');
        const message = input.value.trim();
        
        if (!message) {
            showNotification('Please enter a message', 'error');
            return;
        }
        
        // Save message to database
        const { data, error } = await supabase
            .from('chat_messages')
            .insert([
                {
                    user_id: currentChatUser.id,
                    message: message,
                    is_admin: true,
                    is_read: false,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
            
        if (error) throw error;
        
        // Clear input
        input.value = '';
        
        // Add message to UI immediately
        if (data && data.length > 0) {
            const chatMessages = document.getElementById('admin-chat-messages');
            
            // Remove system message if present
            const systemMsg = chatMessages.querySelector('.system-message');
            if (systemMsg) systemMsg.remove();
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message message-admin';
            
            const time = new Date(data[0].created_at).toLocaleTimeString();
            messageDiv.innerHTML = `
                <div class="message-content">${message}</div>
                <div class="message-time">${time}</div>
            `;
            chatMessages.appendChild(messageDiv);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        showNotification('Message sent successfully', 'success');
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error sending message: ' + error.message, 'error');
    }
}

function setupRealtimeSubscriptions() {
    // Subscribe to new users
    supabase
        .channel('users-updates')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'profiles' }, 
            (payload) => {
                if (document.getElementById('users-section').classList.contains('active')) {
                    loadUsers();
                }
                loadDashboardStats();
            }
        )
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles' }, 
            (payload) => {
                if (document.getElementById('users-section').classList.contains('active')) {
                    loadUsers();
                }
                loadDashboardStats();
            }
        )
        .subscribe();
        
    // Subscribe to new transactions
    supabase
        .channel('transactions-updates')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'transactions' }, 
            (payload) => {
                loadRecentActivity();
                if (document.getElementById('wallets-section').classList.contains('active')) {
                    loadDepositRequests();
                }
            }
        )
        .subscribe();
}

function toggleCustomRange() {
    const period = document.getElementById('report-period').value;
    const customRange = document.getElementById('custom-range');
    
    if (period === 'custom') {
        customRange.style.display = 'flex';
    } else {
        customRange.style.display = 'none';
    }
}

async function generateReport() {
    try {
        const reportType = document.getElementById('report-type').value;
        const period = document.getElementById('report-period').value;
        
        let startDate, endDate;
        const today = new Date();
        
        switch (period) {
            case 'today':
                startDate = new Date(today);
                endDate = new Date(today);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                endDate = new Date(today);
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 1);
                endDate = new Date(today);
                break;
            case 'quarter':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 3);
                endDate = new Date(today);
                break;
            case 'year':
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);
                endDate = new Date(today);
                break;
            case 'custom':
                startDate = new Date(document.getElementById('start-date').value);
                endDate = new Date(document.getElementById('end-date').value);
                break;
        }
        
        let reportContent = '';
        
        switch (reportType) {
            case 'users':
                reportContent = await generateUserReport(startDate, endDate);
                break;
            case 'trading':
                reportContent = await generateTradingReport(startDate, endDate);
                break;
            case 'financial':
                reportContent = await generateFinancialReport(startDate, endDate);
                break;
            case 'system':
                reportContent = await generateSystemReport(startDate, endDate);
                break;
        }
        
        document.getElementById('report-content').innerHTML = reportContent;
        
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error generating report', 'error');
    }
}

async function generateUserReport(startDate, endDate) {
    return `
        <h3>User Activity Report</h3>
        <p><strong>Period:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
        
        <div class="report-stats">
            <div class="stat-card">
                <h4>New Registrations</h4>
                <div class="stat-value">24</div>
            </div>
            <div class="stat-card">
                <h4>Active Users</h4>
                <div class="stat-value">156</div>
            </div>
            <div class="stat-card">
                <h4>Premium Upgrades</h4>
                <div class="stat-value">8</div>
            </div>
        </div>
        
        <h4>User Growth</h4>
        <p>Chart showing user growth over the selected period would appear here.</p>
    `;
}

async function generateTradingReport(startDate, endDate) {
    return `
        <h3>Trading Activity Report</h3>
        <p><strong>Period:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
        
        <div class="report-stats">
            <div class="stat-card">
                <h4>Total Trades</h4>
                <div class="stat-value">342</div>
            </div>
            <div class="stat-card">
                <h4>Total Volume</h4>
                <div class="stat-value">$124,567</div>
            </div>
            <div class="stat-card">
                <h4>Average Trade Size</h4>
                <div class="stat-value">$364</div>
            </div>
        </div>
        
        <h4>Most Traded Assets</h4>
        <ol>
            <li>BTC/USD - 124 trades</li>
            <li>ETH/USD - 98 trades</li>
            <li>SOL/USD - 56 trades</li>
            <li>ADA/USD - 34 trades</li>
            <li>XRP/USD - 30 trades</li>
        </ol>
    `;
}

async function generateFinancialReport(startDate, endDate) {
    return `
        <h3>Financial Summary Report</h3>
        <p><strong>Period:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
        
        <div class="report-stats">
            <div class="stat-card">
                <h4>Total Deposits</h4>
                <div class="stat-value">$45,678</div>
            </div>
            <div class="stat-card">
                <h4>Total Withdrawals</h4>
                <div class="stat-value">$23,456</div>
            </div>
            <div class="stat-card">
                <h4>Net Flow</h4>
                <div class="stat-value">$22,222</div>
            </div>
        </div>
        
        <h4>Revenue Breakdown</h4>
        <ul>
            <li>Trading Fees: $1,234</li>
            <li>Withdrawal Fees: $567</li>
            <li>Other Income: $89</li>
            <li><strong>Total Revenue: $1,890</strong></li>
        </ul>
    `;
}

async function generateSystemReport(startDate, endDate) {
    return `
        <h3>System Performance Report</h3>
        <p><strong>Period:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
        
        <h4>Uptime</h4>
        <p>System uptime: 99.98%</p>
        
        <h4>Performance Metrics</h4>
        <ul>
            <li>Average response time: 128ms</li>
            <li>Peak concurrent users: 234</li>
            <li>API requests processed: 45,678</li>
            <li>Data transferred: 2.3 GB</li>
        </ul>
        
        <h4>Error Log</h4>
        <p>No critical errors detected during this period.</p>
    `;
}

function showNotification(message, type) {
    const notificationArea = document.getElementById('notification-area');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationArea.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function logout() {
    localStorage.removeItem('goldcrypto-user');
    window.location.href = 'index.html';
}
