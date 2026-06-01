/* 
 * ADMIN API WRAPPER 
 */

const BASE_URL = window.location.port === '5000' || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? '/api'
    : 'http://localhost:5000/api';

const AdminAPI = {
    async call(method, endpoint, body = null, isSilent = false) {
        const token = localStorage.getItem('adminToken');
        
        const options = {
            method: method.toUpperCase(),
            headers: {}
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body && (method === 'POST' || method === 'PUT')) {
            if (body instanceof FormData) {
                // Do not set Content-Type for FormData, browser will set it with correct boundary
                options.body = body;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }

        try {
            // Show loader if exists and not silent
            const loader = document.getElementById('global-loader');
            if (loader && !isSilent) loader.style.display = 'flex';

            const response = await fetch(`${BASE_URL}${endpoint}`, options);
            
            // Hide loader
            if (loader && !isSilent) loader.style.display = 'none';

            // Handle 401 Unauthorized
            if (response.status === 401) {
                AdminAuth.logout();
                return null;
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            // Toast notification (will be defined in utils)
            if (window.AdminUtils && !isSilent) {
                AdminUtils.toast(error.message, 'error');
            }
            return null;
        }
    },

    get(endpoint, isSilent = false) { return this.call('GET', endpoint, null, isSilent); },
    post(endpoint, body, isSilent = false) { return this.call('POST', endpoint, body, isSilent); },
    put(endpoint, body, isSilent = false) { return this.call('PUT', endpoint, body, isSilent); },
    delete(endpoint, isSilent = false) { return this.call('DELETE', endpoint, null, isSilent); }
};
