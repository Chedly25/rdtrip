// Authentication Module
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.isAuthenticated = !!this.token;
        this.authModal = null;
        this.init();
    }

    init() {
        this.createAuthModal();
        this.setupEventListeners();
        this.updateUIState();

        // Check token validity on init
        if (this.isAuthenticated) {
            this.validateToken();
        }
    }

    createAuthModal() {
        const modalHTML = `
            <div id="authModal" class="auth-modal" style="display: none;">
                <div class="auth-modal-content">
                    <button class="auth-modal-close">&times;</button>

                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Sign In</button>
                        <button class="auth-tab" data-tab="register">Sign Up</button>
                    </div>

                    <!-- Login Form -->
                    <form id="loginForm" class="auth-form active">
                        <h2>Welcome Back!</h2>
                        <p class="auth-subtitle">Sign in to save and share your trips</p>

                        <div class="form-group">
                            <input type="email" id="loginEmail" placeholder="Email" required>
                        </div>

                        <div class="form-group">
                            <input type="password" id="loginPassword" placeholder="Password" required>
                        </div>

                        <div class="form-group remember-me">
                            <label>
                                <input type="checkbox" id="rememberMe"> Remember me
                            </label>
                            <a href="#" class="forgot-password">Forgot password?</a>
                        </div>

                        <button type="submit" class="auth-submit-btn">Sign In</button>

                        <div class="auth-divider">
                            <span>or continue with</span>
                        </div>

                        <div class="social-auth">
                            <button type="button" class="social-btn google-btn" disabled>
                                <img src="https://www.google.com/favicon.ico" alt="Google"> Google
                            </button>
                        </div>
                    </form>

                    <!-- Register Form -->
                    <form id="registerForm" class="auth-form">
                        <h2>Join the Community</h2>
                        <p class="auth-subtitle">Create an account to start planning</p>

                        <div class="form-group">
                            <input type="text" id="registerUsername" placeholder="Username" required minlength="3">
                            <span class="username-availability"></span>
                        </div>

                        <div class="form-group">
                            <input type="email" id="registerEmail" placeholder="Email" required>
                        </div>

                        <div class="form-group">
                            <input type="password" id="registerPassword" placeholder="Password" required minlength="6">
                            <div class="password-strength"></div>
                        </div>

                        <div class="form-group">
                            <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
                        </div>

                        <div class="form-group terms">
                            <label>
                                <input type="checkbox" id="agreeTerms" required>
                                I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
                            </label>
                        </div>

                        <button type="submit" class="auth-submit-btn">Create Account</button>
                    </form>

                    <div class="auth-error" id="authError" style="display: none;"></div>
                    <div class="auth-success" id="authSuccess" style="display: none;"></div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.authModal = document.getElementById('authModal');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Close modal
        document.querySelector('.auth-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Close on outside click
        this.authModal.addEventListener('click', (e) => {
            if (e.target === this.authModal) {
                this.closeModal();
            }
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Username availability check
        let usernameTimeout;
        document.getElementById('registerUsername').addEventListener('input', (e) => {
            clearTimeout(usernameTimeout);
            const username = e.target.value;

            if (username.length >= 3) {
                usernameTimeout = setTimeout(() => {
                    this.checkUsernameAvailability(username);
                }, 500);
            }
        });

        // Password strength indicator
        document.getElementById('registerPassword').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tab}Form`);
        });

        // Clear errors
        this.clearMessages();
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        this.clearMessages();
        this.setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.setAuthData(data.token, data.user);
                this.showSuccess('Login successful! Redirecting...');

                setTimeout(() => {
                    this.closeModal();
                    this.updateUIState();

                    // Redirect to dashboard if exists
                    if (window.location.pathname === '/') {
                        window.location.href = '/dashboard';
                    } else {
                        window.location.reload();
                    }
                }, 1500);
            } else {
                this.showError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        this.clearMessages();
        this.setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                this.setAuthData(data.token, data.user);
                this.showSuccess('Account created successfully!');

                setTimeout(() => {
                    this.closeModal();
                    this.updateUIState();
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                if (data.errors) {
                    const errorMessages = data.errors.map(e => e.msg).join(', ');
                    this.showError(errorMessages);
                } else {
                    this.showError(data.message || 'Registration failed');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async checkUsernameAvailability(username) {
        try {
            const response = await fetch('/api/auth/check-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();
            const availabilityEl = document.querySelector('.username-availability');

            if (data.available) {
                availabilityEl.innerHTML = '<span class="available">✓ Available</span>';
            } else {
                availabilityEl.innerHTML = '<span class="unavailable">✗ Already taken</span>';
            }
        } catch (error) {
            console.error('Username check error:', error);
        }
    }

    updatePasswordStrength(password) {
        const strengthEl = document.querySelector('.password-strength');
        let strength = 0;
        let message = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#ff4444', '#ffaa00', '#00aaff', '#00ff88'];

        message = strengthLevels[strength] || 'Weak';
        const color = strengthColors[strength] || strengthColors[0];

        strengthEl.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${(strength + 1) * 25}%; background: ${color};"></div>
            </div>
            <span style="color: ${color};">${message}</span>
        `;
    }

    async validateToken() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                this.logout();
            } else {
                const data = await response.json();
                if (data.success) {
                    this.user = data.user;
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.logout();
        }
    }

    setAuthData(token, user) {
        this.token = token;
        this.user = user;
        this.isAuthenticated = true;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Set default authorization header for future requests
        this.setDefaultAuthHeader();
    }

    setDefaultAuthHeader() {
        // Intercept fetch to add auth header
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            if (authManager.token) {
                if (typeof args[1] === 'undefined') {
                    args[1] = {};
                }
                if (typeof args[1].headers === 'undefined') {
                    args[1].headers = {};
                }
                if (!args[1].headers['Authorization']) {
                    args[1].headers['Authorization'] = `Bearer ${authManager.token}`;
                }
            }
            return originalFetch.apply(this, args);
        };
    }

    logout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        this.updateUIState();
        window.location.href = '/';
    }

    updateUIState() {
        // This will be called to update UI elements based on auth state
        const authButtons = document.querySelectorAll('.auth-required');
        const guestButtons = document.querySelectorAll('.guest-only');

        authButtons.forEach(btn => {
            btn.style.display = this.isAuthenticated ? 'block' : 'none';
        });

        guestButtons.forEach(btn => {
            btn.style.display = !this.isAuthenticated ? 'block' : 'none';
        });

        // Update user info displays
        const userDisplays = document.querySelectorAll('.user-display-name');
        userDisplays.forEach(el => {
            if (this.user) {
                el.textContent = this.user.profile?.displayName || this.user.username;
            }
        });
    }

    openModal(tab = 'login') {
        this.authModal.style.display = 'flex';
        this.switchTab(tab);
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.authModal.style.display = 'none';
        document.body.style.overflow = '';
        this.clearMessages();

        // Reset forms
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
    }

    showError(message) {
        const errorEl = document.getElementById('authError');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    showSuccess(message) {
        const successEl = document.getElementById('authSuccess');
        successEl.textContent = message;
        successEl.style.display = 'block';
    }

    clearMessages() {
        document.getElementById('authError').style.display = 'none';
        document.getElementById('authSuccess').style.display = 'none';
    }

    setLoading(loading) {
        const submitBtns = document.querySelectorAll('.auth-submit-btn');
        submitBtns.forEach(btn => {
            btn.disabled = loading;
            btn.textContent = loading ? 'Loading...' : (btn.closest('#loginForm') ? 'Sign In' : 'Create Account');
        });
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other modules
window.authManager = authManager;