// admin.js - نسخه ساده‌شده و اصلاح‌شده
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    initAdminPanel();
});

let adminData = null;

async function initAdminPanel() {
    try {
        console.log('Checking admin auth...');
        await checkAdminAuth();
        console.log('Admin auth successful');
        
        setupAdminEventListeners();
        await loadDashboardStats();
        await loadRecentActivity();
        await loadUsers();
        await loadWalletSettings();
        await loadActiveChats();
        
        console.log('Admin panel initialized successfully');
        showNotification('پنل ادمین با موفقیت بارگذاری شد', 'success');
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showNotification('خطا در بارگذاری پنل ادمین: ' + error.message, 'error');
    }
}

async function checkAdminAuth() {
    try {
        // ابتدا از localStorage چک کنیم
        adminData = JSON.parse(localStorage.getItem('goldcrypto-user'));
        
        if (!adminData) {
            console.log('No user data in localStorage');
            window.location.href = 'login.html';
            return;
        }

        // بررسی session فعلی با Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            console.error('Auth error:', authError);
            throw new Error('خطای احراز هویت');
        }

        if (!user) {
            console.log('No user session');
            localStorage.removeItem('goldcrypto-user');
            window.location.href = 'login.html';
            return;
        }

        // بررسی پروفایل کاربر
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            throw new Error('خطا در دریافت اطلاعات پروفایل');
        }

        if (!profile || profile.level !== 'admin') {
            console.log('User is not admin:', profile);
            localStorage.removeItem('goldcrypto-user');
            window.location.href = 'login.html';
            return;
        }

        // به‌روزرسانی اطلاعات ادمین
        adminData = { ...adminData, ...profile };
        localStorage.setItem('goldcrypto-user', JSON.stringify(adminData));
        
        document.getElementById('admin-name').textContent = adminData.email;
        console.log('Admin authenticated:', adminData.email);
        
    } catch (error) {
        console.error('Admin auth failed:', error);
        localStorage.removeItem('goldcrypto-user');
        window.location.href = 'login.html';
    }
}

function setupAdminEventListeners() {
    console.log('Setting up admin event listeners...');
    
    // Navigation
    document.querySelectorAll('.admin-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showAdminSection(section);
        });
    });

    // User management
    document.getElementById('search-users').addEventListener('click', () => loadUsers());
    document.getElementById('user-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loadUsers();
    });

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

    // Support chat
    document.getElementById('admin-send-message').addEventListener('click', sendAdminMessage);
    document.getElementById('admin-chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendAdminMessage();
        }
    });

    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // Logout
    document.getElementById('admin-logout').addEventListener('click', logout);
    
    console.log('Admin event listeners setup completed');
}

function showAdminSection(section) {
    console.log('Showing section:', section);
    
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
}

async function loadDashboardStats() {
    try {
        console.log('Loading dashboard stats...');
        
        // Total users
        const { count: totalUsers, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
            
        if (usersError) throw usersError;
        
        // Total balance
        const { data: balances, error: balanceError } = await supabase
            .from('profiles')
            .select('balance');
            
        if (balanceError) throw balanceError;
        
        const totalBalance = balances.reduce((sum, user) => sum + (user.balance || 0), 0);
        
        // Update UI
        document.getElementById('total-users').textContent = totalUsers || 0;
        document.getElementById('total-balance').textContent = `$${totalBalance.toFixed(2)}`;
        
        console.log('Dashboard stats loaded successfully');
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('خطا در بارگذاری آمار', 'error');
    }
}

async function loadRecentActivity() {
    try {
        console.log('Loading recent activity...');
        
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        const activityList = document.getElementById('recent-activity');
        activityList.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            activityList.innerHTML = '<p>No recent activity</p>';
            return;
        }
        
        transactions.forEach(transaction => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-details">
                    <div class="activity-type">${transaction.type}</div>
                    <div class="activity-description">$${transaction.amount} - ${transaction.status}</div>
                </div>
                <div class="activity-time">${new Date(transaction.created_at).toLocaleString()}</div>
            `;
            activityList.appendChild(activityItem);
        });
        
        console.log('Recent activity loaded successfully');
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

async function loadUsers() {
    try {
        console.log('Loading users...');
        
        const searchTerm = document.getElementById('user-search').value;
        
        let query = supabase
            .from('profiles')
            .select('*');
            
        if (searchTerm) {
            query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
        }
        
        const { data: users, error } = await query
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
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
        
        // Add event listeners to new buttons
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
        
        console.log('Users loaded successfully:', users.length);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('خطا در بارگذاری کاربران: ' + error.message, 'error');
    }
}

async function editUser(userId) {
    try {
        console.log('Editing user:', userId);
        
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
        document.getElementById('edit-user-status').checked = user.is_active;
        
        document.getElementById('user-edit-modal').style.display = 'block';
        
        console.log('User data loaded for editing');
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('خطا در بارگذاری اطلاعات کاربر: ' + error.message, 'error');
    }
}

async function saveUserChanges(e) {
    e.preventDefault();
    
    try {
        console.log('Saving user changes...');
        
        const userId = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const level = document.getElementById('edit-user-level').value;
        const balance = parseFloat(document.getElementById('edit-user-balance').value);
        const status = document.getElementById('edit-user-status').checked;
        
        console.log('Update data:', { userId, name, level, balance, status });
        
        const { data, error } = await supabase
            .from('profiles')
            .update({
                full_name: name,
                level: level,
                balance: balance,
                is_active: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select();
            
        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }
        
        console.log('Update successful:', data);
        
        document.getElementById('user-edit-modal').style.display = 'none';
        await loadUsers();
        showNotification('کاربر با موفقیت به‌روزرسانی شد', 'success');
        
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('خطا در به‌روزرسانی کاربر: ' + error.message, 'error');
    }
}

function confirmDeleteUser(userId) {
    if (confirm('آیا از حذف این کاربر اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
        deleteUserConfirmed(userId);
    }
}

async function deleteUserConfirmed(userId) {
    try {
        console.log('Deleting user:', userId);
        
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
            
        if (error) throw error;
        
        await loadUsers();
        showNotification('کاربر با موفقیت حذف شد', 'success');
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('خطا در حذف کاربر: ' + error.message, 'error');
    }
}

async function loadWalletSettings() {
    try {
        console.log('Loading wallet settings...');
        
        // Try to load from database first
        const { data: wallets, error } = await supabase
            .from('wallets')
            .select('*');
            
        if (!error && wallets && wallets.length > 0) {
            wallets.forEach(wallet => {
                if (wallet.type === 'trc20') {
                    document.getElementById('trc20-address').value = wallet.address;
                } else if (wallet.type === 'erc20') {
                    document.getElementById('erc20-address').value = wallet.address;
                }
            });
        } else {
            // Use default addresses
            setDefaultWalletAddresses();
        }
        
        console.log('Wallet settings loaded');
        
    } catch (error) {
        console.error('Error loading wallet settings:', error);
        setDefaultWalletAddresses();
    }
}

function setDefaultWalletAddresses() {
    document.getElementById('trc20-address').value = 'THdTNV89Y57cnReqZvZ9JGuBTw25me5UGM';
    document.getElementById('erc20-address').value = '0x572d104aaa445bd8a82a19315e09cc3472e72cb2';
}

async function saveWalletSettings(type) {
    try {
        console.log('Saving wallet settings for:', type);
        
        const address = document.getElementById(`${type}-address`).value;
        
        if (!address) {
            showNotification('لطفاً آدرس کیف پول را وارد کنید', 'error');
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
                        is_active: true,
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
                    updated_at: new Date().toISOString()
                })
                .eq('type', type);
                
            if (error) throw error;
        }
        
        showNotification(`تنظیمات کیف پول ${type.toUpperCase()} ذخیره شد`, 'success');
        
    } catch (error) {
        console.error('Error saving wallet settings:', error);
        showNotification('خطا در ذخیره تنظیمات کیف پول: ' + error.message, 'error');
    }
}

async function loadActiveChats() {
    try {
        console.log('Loading active chats...');
        
        // Get all unique users who have sent messages
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('user_id, message, created_at, profiles(email, full_name)')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            chatList.innerHTML = '<p class="no-chats">No conversations yet</p>';
            return;
        }
        
        // Group messages by user
        const userMessages = {};
        messages.forEach(msg => {
            if (!userMessages[msg.user_id]) {
                userMessages[msg.user_id] = {
                    user: msg.profiles,
                    lastMessage: msg.message,
                    lastTime: msg.created_at
                };
            }
        });
        
        // Create chat items
        Object.values(userMessages).forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.innerHTML = `
                <div class="chat-user">${chat.user.full_name || chat.user.email}</div>
                <div class="chat-preview">${chat.lastMessage}</div>
                <div class="chat-time">${new Date(chat.lastTime).toLocaleTimeString()}</div>
            `;
            chatList.appendChild(chatItem);
        });
        
        console.log('Active chats loaded');
        
    } catch (error) {
        console.error('Error loading active chats:', error);
    }
}

async function sendAdminMessage() {
    try {
        const input = document.getElementById('admin-chat-input');
        const message = input.value.trim();
        
        if (!message) {
            showNotification('لطفاً پیام را وارد کنید', 'error');
            return;
        }
        
        // For demo purposes - in real app, you'd select a user first
        showNotification('پیام ارسال شد (نمایشی)', 'success');
        input.value = '';
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('خطا در ارسال پیام: ' + error.message, 'error');
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        font-family: Arial, sans-serif;
        max-width: 300px;
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
    } else {
        notification.style.backgroundColor = '#f44336';
    }
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function logout() {
    localStorage.removeItem('goldcrypto-user');
    window.location.href = 'login.html';
}

// Add console logging for all Supabase requests
const originalAuth = supabase.auth;
supabase.auth = new Proxy(originalAuth, {
    get(target, prop) {
        if (typeof target[prop] === 'function') {
            return function(...args) {
                console.log(`Supabase Auth.${prop} called with:`, args);
                return target[prop].apply(this, args);
            };
        }
        return target[prop];
    }
});
