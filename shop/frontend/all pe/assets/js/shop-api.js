/**
 * MÔ HÌNH STORE - SHOP API WRAPPER
 */

const BASE_URL = window.location.port === '5000' || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? '/api'
    : 'http://localhost:5000/api';

const ShopAPI = {
    async call(method, endpoint, body = null, requiresAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (requiresAuth) {
            const token = localStorage.getItem('user_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error; // Throw error to be caught by the caller
        }
    },

    get(endpoint, requiresAuth = false) {
        return this.call('GET', endpoint, null, requiresAuth);
    },

    post(endpoint, body, requiresAuth = false) {
        return this.call('POST', endpoint, body, requiresAuth);
    },

    put(endpoint, body, requiresAuth = false) {
        return this.call('PUT', endpoint, body, requiresAuth);
    },

    delete(endpoint, requiresAuth = false) {
        return this.call('DELETE', endpoint, null, requiresAuth);
    },

    // Auth Helpers
    async login(email, password) {
        const data = await this.post('/auth/login', { email, password });
        if (data && data.token) {
            localStorage.setItem('user_token', data.token);
            const { token, ...userInfo } = data;
            localStorage.setItem('user_info', JSON.stringify(userInfo));
            return data;
        }
        return null;
    },

    async register(userData) {
        const data = await this.post('/auth/register', userData);
        if (data && data.token) {
            localStorage.setItem('user_token', data.token);
            const { token, ...userInfo } = data;
            localStorage.setItem('user_info', JSON.stringify(userInfo));
        }
        return data;
    },

    logout() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        window.location.href = 'login.html';
    },

    getUserInfo() {
        const info = localStorage.getItem('user_info');
        return info ? JSON.parse(info) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('user_token');
    },

    likeProduct(id) {
        return this.post(`/products/${id}/like`, null, true);
    },

    createProductReview(id, reviewData) {
        return this.post(`/products/${id}/reviews`, reviewData, true);
    }
};

