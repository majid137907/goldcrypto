// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the admin panel
    initAdminPanel();
});

let adminData = null;
let currentPage = 1;
let usersPerPage = 10;
let totalUsers = 0;
let currentChatUser = null;
let chatSubscription = null;

async function initAdminPanel() {
    // Check if user is admin
    await checkAdminAuth();
    
    // Set up event listeners
    setupAdminEventListeners();
    
    // Load initial data
    loadDashboardStats();
    loadRecentActivity();
    loadUsers();
    loadWalletSettings();
    loadSystemSettings();
    loadActiveChats();
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
}

async function checkAdminAuth() {
    adminData = JSON.parse(localStorage.getItem('goldcrypto-user'));
    
    if (!adminData || adminData.level !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    // Update UI with admin data
    document.getElementById('admin-name').textContent = adminData.email;
}

function setupAdminEventListeners() {
    // Sidebar navigation
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
    
    // Logout button
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
    // Update active sidebar link
    document.querySelectorAll('.admin-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });
    
    // Show corresponding section
    document.querySelectorAll('.admin-section').forEach(sectionEl => {
        sectionEl.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Load section-specific data
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
        // Get total users count
        const { count: totalUsers, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
            
        if (usersError) throw usersError;
        
        // Get active users today
        const today = new Date().toISOString().split('T')[0];
        const { count: activeToday, error: activeError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('last_login', today);
            
        if (activeError) throw activeError;
        
        // Get total balance
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
        // Get recent transactions
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        // Get recent trades
        const { data: trades, error: tradesError } = await supabase
            .from('trades')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (tradesError) throw tradesError;
        
        // Combine and sort activities
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
        
        // Update UI
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
        
        // Build query
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' });
            
        // Apply filters
        if (searchTerm) {
            query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
        }
        
        if (levelFilter !== 'all') {
            query = query.eq('level', levelFilter);
        }
        
        if (statusFilter !== 'all') {
            query = query.eq('is_active', statusFilter === 'active');
        }
        
        // Apply pagination
        const from = (currentPage - 1) * usersPerPage;
        const to = from + usersPerPage - 1;
        
        const { data: users, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
            
        if (error) throw error;
        
        totalUsers = count;
        
        // Update UI
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
        
        // Update pagination
        updatePagination();
        
        // Add event listeners to action buttons
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
        // Get user data
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        
        // Populate form
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-name').value = user.full_name || '';
        document.getElementById('edit-user-level').value = user.level;
        document.getElementById('edit-user-balance').value = user.balance || 0;
        document.getElementById('edit-user-status').value = user.is_active ? 'active' : 'inactive';
        
        // Show modal
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
        
        // Update user in Supabase
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
        
        // Close modal and refresh users list
        document.getElementById('user-edit-modal').style.display = 'none';
        loadUsers();
        showNotification('User updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error updating user', 'error');
    }
}

function confirmDeleteUser(userId) {
    // Store userId for confirmation
    window.pendingDeleteUserId = userId;
    
    // Show confirmation modal
    document.getElementById('confirmation-title').textContent = 'Delete User';
    document.getElementById('confirmation-message').textContent = 'Are you sure you want to delete this user? This action cannot be undone.';
    document.getElementById('confirmation-modal').style.display = 'block';
    
    // Set up confirmation handler
    document.getElementById('confirm-action').onclick = deleteUserConfirmed;
}

async function deleteUserConfirmed() {
    try {
        const userId = window.pendingDeleteUserId;
        
        // Delete user from Supabase
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
            
        if (error) throw error;
        
        // Close modal and refresh users list
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
        // Get wallet settings from Supabase
        const { data: wallets, error } = await supabase
            .from('wallets')
            .select('*');
            
        if (error) throw error;
        
        // Update UI
        (wallets || []).forEach(wallet => {
            if (wallet.type === 'trc20') {
                document.getElementById('trc20-address').value = wallet.address;
                document.getElementById('trc20-status').value = wallet.is_active ? 'active' : 'inactive';
            } else if (wallet.type === 'erc20') {
                document.getElementById('erc20-address').value = wallet.address;
                document.getElementById('erc20-status').value = wallet.is_active ? 'active' : 'inactive';
            }
        });
        
    } catch (error) {
        console.error('Error loading wallet settings:', error);
    }
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
            // Wallet doesn't exist, create it
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
            // Wallet exists, update it
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
        // Get pending deposit requests
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
        
        // Update UI
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
        
        // Add event listeners to action buttons
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
        // Update transaction status
        const { error } = await supabase
            .from('transactions')
            .update({ status: status })
            .eq('id', transactionId);
            
        if (error) throw error;
        
        // If approved, update user balance
        if (status === 'completed') {
            // Get transaction details
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', transactionId)
                .single();
                
            if (txError) throw txError;
            
            // Get current user balance
            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', transaction.user_id)
                .single();
                
            if (userError) throw userError;
            
            // Update user balance
            const newBalance = (user.balance || 0) + transaction.amount;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', transaction.user_id);
                
            if (updateError) throw updateError;
            
            // Check if user should be upgraded to premium
            if (newBalance >= 70) {
                const { error: upgradeError } = await supabase
                    .from('profiles')
                    .update({ level: 'premium' })
                    .eq('id', transaction.user_id)
                    .eq('level', 'gold');
                    
                if (upgradeError) throw upgradeError;
            }
        }
        
        // Refresh deposit requests
        loadDepositRequests();
        showNotification(`Deposit request ${status} successfully`, 'success');
        
    } catch (error) {
        console.error('Error processing deposit:', error);
        showNotification('Error processing deposit request', 'error');
    }
}

async function loadSystemSettings() {
    try {
        // In a real application, you would load these from a settings table
        // For now, we'll use default values
        document.getElementById('min-trade-amount').value = 10;
        document.getElementById('max-leverage').value = 10;
        document.getElementById('premium-threshold').value = 70;
        document.getElementById('min-withdrawal').value = 10;
        document.getElementById('withdrawal-fee').value = 1;
        document.getElementById('auto-approve-withdrawals').value = 'disabled';
        
    } catch (error) {
        console.error('Error loading system settings:', error);
    }
}

async function saveTradingSettings(e) {
    e.preventDefault();
    
    try {
        // In a real application, you would save these to a settings table
        const minTradeAmount = document.getElementById('min-trade-amount').value;
        const maxLeverage = document.getElementById('max-leverage').value;
        const premiumThreshold = document.getElementById('premium-threshold').value;
        
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
        // In a real application, you would save these to a settings table
        const minWithdrawal = document.getElementById('min-withdrawal').value;
        const withdrawalFee = document.getElementById('withdrawal-fee').value;
        const autoApprove = document.getElementById('auto-approve-withdrawals').value;
        
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
        // In a real application, this would trigger a database backup
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
        // In a real application, this would clear various caches
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
        // In a real application, this would check various system components
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

async function loadActiveChats() {
    try {
        // Get users with recent chat messages
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                profiles:user_id(email, full_name)
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Group messages by user
        const userChats = {};
        (messages || []).forEach(message => {
            if (!userChats[message.user_id]) {
                userChats[message.user_id] = {
                    user: message.profiles,
                    lastMessage: message.message,
                    lastTime: message.created_at,
                    unread: !message.is_admin
                };
            }
        });
        
        // Update UI
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';
        
        if (Object.keys(userChats).length === 0) {
            chatList.innerHTML = '<p>No active conversations</p>';
            return;
        }
        
        Object.values(userChats).forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.setAttribute('data-user-id', chat.user.id);
            chatItem.innerHTML = `
                <div class="chat-user">${chat.user.full_name || chat.user.email}</div>
                <div class="chat-preview">${chat.lastMessage}</div>
            `;
            chatList.appendChild(chatItem);
            
            // Add click event to load chat
            chatItem.addEventListener('click', () => {
                loadUserChat(chat.user.id, chat.user);
            });
        });
        
    } catch (error) {
        console.error('Error loading active chats:', error);
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
        
        (messages || []).forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${message.is_admin ? 'message-admin' : 'message-user'}`;
            
            const time = new Date(message.created_at).toLocaleTimeString();
            messageDiv.innerHTML = `
                <div>${message.message}</div>
                <div class="message-time">${time}</div>
            `;
            chatMessages.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Mark messages as read
        await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_admin', false);
            
        // Set up real-time subscription for new messages
        if (chatSubscription) {
            chatSubscription.unsubscribe();
        }
        
        chatSubscription = supabase
            .channel('chat-updates')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'chat_messages',
                    filter: `user_id=eq.${userId}`
                }, 
                (payload) => {
                    // Add new message to chat
                    const newMessage = payload.new;
                    const chatMessages = document.getElementById('admin-chat-messages');
                    
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `chat-message ${newMessage.is_admin ? 'message-admin' : 'message-user'}`;
                    
                    const time = new Date(newMessage.created_at).toLocaleTimeString();
                    messageDiv.innerHTML = `
                        <div>${newMessage.message}</div>
                        <div class="message-time">${time}</div>
                    `;
                    chatMessages.appendChild(messageDiv);
                    
                    // Scroll to bottom
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            )
            .subscribe();
            
    } catch (error) {
        console.error('Error loading user chat:', error);
    }
}

async function sendAdminMessage() {
    try {
        if (!currentChatUser) return;
        
        const input = document.getElementById('admin-chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Save message to Supabase
        const { error } = await supabase
            .from('chat_messages')
            .insert([
                {
                    user_id: currentChatUser.id,
                    message: message,
                    is_admin: true,
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (error) throw error;
        
        // Clear input
        input.value = '';
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error sending message', 'error');
    }
}

function setupRealtimeSubscriptions() {
    // Subscribe to new users
    supabase
        .channel('users-updates')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'profiles' }, 
            (payload) => {
                // Refresh users list if we're on the users page
                if (document.getElementById('users-section').classList.contains('active')) {
                    loadUsers();
                }
                // Refresh dashboard stats
                loadDashboardStats();
            }
        )
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles' }, 
            (payload) => {
                // Refresh users list if we're on the users page
                if (document.getElementById('users-section').classList.contains('active')) {
                    loadUsers();
                }
                // Refresh dashboard stats
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
                // Refresh recent activity
                loadRecentActivity();
                // Refresh deposit requests if we're on the wallets page
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
        
        // Calculate date range based on period
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
        
        // Generate report based on type
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
        
        // Display report
        document.getElementById('report-content').innerHTML = reportContent;
        
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error generating report', 'error');
    }
}

async function generateUserReport(startDate, endDate) {
    // In a real application, this would query the database
    // For now, we'll return mock data
    
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
        notification.remove();
    }, 5000);
}

function logout() {
    localStorage.removeItem('goldcrypto-user');
    window.location.href = 'index.html';
}
