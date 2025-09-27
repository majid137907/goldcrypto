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
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Get user profile from our database
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
        }
        
        // If user doesn't have a profile yet, create one
        if (!profile) {
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                    { 
                        id: data.user.id, 
                        email: data.user.email,
                        level: 'gold', // Default level for new users
                        balance: 0,
                        is_active: true
                    }
                ]);
                
            if (insertError) throw insertError;
        }
        
        // Store user data in localStorage
        localStorage.setItem('goldcrypto-user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            level: profile?.level || 'gold',
            balance: profile?.balance || 0,
            is_active: profile?.is_active !== false
        }));
        
        // Show success message
        showMessage(messageEl, 'Login successful! Redirecting...', 'success');
        
        // Redirect to user dashboard
        setTimeout(() => {
            window.location.href = 'user.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage(messageEl, error.message, 'error');
    } finally {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
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
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading"></span> Creating account...';
    submitButton.disabled = true;
    
    try {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        // Create user profile in our database
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                { 
                    id: data.user.id, 
                    email: data.user.email,
                    full_name: name,
                    level: 'gold', // Default level for new users
                    balance: 0,
                    is_active: true
                }
            ]);
            
        if (profileError) throw profileError;
        
        // Show success message
        showMessage(messageEl, 'Account created successfully! Please check your email for verification.', 'success');
        
        // Clear form
        form.reset();
        
        // Switch to login tab after a delay
        setTimeout(() => {
            document.querySelector('[data-tab="login"]').click();
        }, 3000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showMessage(messageEl, error.message, 'error');
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
        // Check if credentials match admin credentials
        if (email === 'admin@gmail.com' && password === '@dmin2461218311020') {
            // Store admin data in localStorage
            localStorage.setItem('goldcrypto-user', JSON.stringify({
                id: 'admin',
                email: email,
                level: 'admin',
                is_admin: true
            }));
            
            // Show success message
            showMessage(messageEl, 'Admin login successful! Redirecting...', 'success');
            
            // Redirect to admin panel
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
        } else {
            throw new Error('Invalid admin credentials');
        }
        
    } catch (error) {
        console.error('Admin login error:', error);
        showMessage(messageEl, error.message, 'error');
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