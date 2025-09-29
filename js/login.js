document.addEventListener('DOMContentLoaded', function() {
    // Initialize the login page
    initLoginPage();
});

function initLoginPage() {
    // Set up tab switching
    setupTabs();
    
    // Set up form submissions
    setupForms();
    
    // Set up password strength indicator
    setupPasswordStrength();
    
    // Check if user is already logged in
    checkAuthStatus();
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const authForms = document.querySelectorAll('.auth-form');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabName}-form`) {
                    form.classList.add('active');
                }
            });
            
            // Special case for password reset
            if (tabName === 'login') {
                document.getElementById('reset-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
            }
        });
    });
    
    // Forgot password link
    document.getElementById('forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('reset-form').style.display = 'block';
    });
    
    // Back to login from reset
    document.getElementById('back-to-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('reset-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });
}

function setupForms() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Signup form
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Admin login form
    document.getElementById('adminForm').addEventListener('submit', handleAdminLogin);
    
    // Password reset form
    document.getElementById('resetForm').addEventListener('submit', handlePasswordReset);
}

function setupPasswordStrength() {
    const passwordInput = document.getElementById('signup-password');
    const confirmInput = document.getElementById('signup-confirm');
    
    // Create password strength indicator
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    passwordInput.parentNode.appendChild(strengthIndicator);
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        
        // Update strength indicator
        strengthIndicator.className = 'password-strength';
        if (password.length > 0) {
            strengthIndicator.classList.add(strength.class);
        }
        
        // Check password confirmation
        if (confirmInput.value.length > 0) {
            validatePasswordConfirmation();
        }
    });
    
    confirmInput.addEventListener('input', validatePasswordConfirmation);
}

function validatePasswordConfirmation() {
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const confirmInput = document.getElementById('signup-confirm');
    
    if (confirm.length > 0) {
        if (password === confirm) {
            confirmInput.style.borderColor = '#4CAF50';
        } else {
            confirmInput.style.borderColor = '#F44336';
        }
    } else {
        confirmInput.style.borderColor = '#333';
    }
}

function checkPasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    if (score <= 2) return { class: 'weak', text: 'Weak' };
    if (score <= 4) return { class: 'medium', text: 'Medium' };
    return { class: 'strong', text: 'Strong' };
}

async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const messageEl = document.getElementById('login-message');
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading"></span> Logging in...';
    submitButton.disabled = true;
    
    try {
        // Step 1: Login user
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Step 2: Ensure profile exists
        await ensureUserProfile(data.user.id, data.user.email);
        
        // Step 3: Update last login time
        await updateLastLogin(data.user.id);
        
        // Step 4: Get complete profile information
        const { data: profile, error: getProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        if (getProfileError) throw getProfileError;
        
        // Step 5: Save user information
        localStorage.setItem('goldcrypto-user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            full_name: profile.full_name,
            level: profile.level,
            balance: profile.balance || 0,
            is_active: profile.is_active !== false
        }));
        
        // Step 6: Redirect to user page
        showMessage(messageEl, 'Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'user.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password.';
        }
        
        showMessage(messageEl, errorMessage, 'error');
    } finally {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

async function ensureUserProfile(userId, userEmail) {
    try {
        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();
            
        if (checkError && checkError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: userId,
                        email: userEmail,
                        level: 'gold',
                        balance: 0,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);
                
            if (insertError) throw insertError;
        }
    } catch (error) {
        console.error('Error ensuring user profile:', error);
        throw error;
    }
}

async function updateLastLogin(userId) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                last_login: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
        if (error) throw error;
    } catch (error) {
        console.error('Error updating last login:', error);
        // Don't throw error here as it's not critical
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirm = form.confirm.value;
    const messageEl = document.getElementById('signup-message');
    
    // Validate passwords match
    if (password !== confirm) {
        showMessage(messageEl, 'Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(messageEl, 'Password must be at least 6 characters', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading"></span> Creating account...';
    submitButton.disabled = true;
    
    try {
        // Step 1: Register user in authentication system - بدون نیاز به تایید ایمیل
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
            // Step 2: Create user profile
            await ensureUserProfile(authData.user.id, authData.user.email, name);
            
            // Step 3: Sign in the user immediately after signup
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (signInError) throw signInError;
            
            // Step 4: Save user information
            localStorage.setItem('goldcrypto-user', JSON.stringify({
                id: signInData.user.id,
                email: signInData.user.email,
                full_name: name,
                level: 'gold',
                balance: 0,
                is_active: true
            }));
            
            showMessage(messageEl, 'Account created successfully! Redirecting...', 'success');
            
            // Step 5: Redirect to user page
            setTimeout(() => {
                window.location.href = 'user.html';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        
        // Display user-friendly error messages
        let errorMessage = error.message;
        
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            errorMessage = 'This email is already registered.';
        } else if (error.message.includes('password')) {
            errorMessage = 'Password must be at least 6 characters.';
        } else if (error.message.includes('email')) {
            errorMessage = 'Invalid email address.';
        } else if (error.message.includes('row-level security policy')) {
            errorMessage = 'System error. Please try again.';
        }
        
        showMessage(messageEl, errorMessage, 'error');
    } finally {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const messageEl = document.getElementById('admin-message');
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading"></span> Logging in...';
    submitButton.disabled = true;
    
    try {
        // استفاده از احراز هویت واقعی
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // بررسی پروفایل کاربر
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        if (profileError) {
            // اگر پروفایل وجود ندارد، ایجاد کنیم
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        email: email,
                        full_name: 'Administrator',
                        level: 'admin',
                        balance: 0,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);
                
            if (insertError) throw insertError;
        } else if (profile.level !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
        }
        
        // ذخیره اطلاعات کاربر
        localStorage.setItem('goldcrypto-user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            level: 'admin',
            is_admin: true
        }));
        
        // نمایش پیام موفقیت
        showMessage(messageEl, 'Admin login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
        
    } catch (error) {
        console.error('Admin login error:', error);
        
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid admin credentials';
        }
        
        showMessage(messageEl, errorMessage, 'error');
    } finally {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.email.value;
    const messageEl = document.getElementById('reset-message');
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading"></span> Sending...';
    submitButton.disabled = true;
    
    try {
        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login.html`,
        });
        
        if (error) throw error;
        
        // Show success message
        showMessage(messageEl, 'Password reset link sent to your email', 'success');
        
        // Clear form
        form.reset();
        
    } catch (error) {
        console.error('Password reset error:', error);
        showMessage(messageEl, error.message, 'error');
    } finally {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

function showMessage(element, text, type) {
    element.innerHTML = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function checkAuthStatus() {
    const userData = localStorage.getItem('goldcrypto-user');
    
    if (userData) {
        const user = JSON.parse(userData);
        
        // Redirect based on user level
        if (user.level === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'user.html';
        }
    }
}
