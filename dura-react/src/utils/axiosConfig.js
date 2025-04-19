import axios from 'axios';

// Set the base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5020';

// Add request interceptor for debugging
axios.interceptors.request.use(
  config => {
    console.log(`Request: ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.error('Response error:', error.response || error);
    return Promise.reject(error);
  }
);

export default axios;
