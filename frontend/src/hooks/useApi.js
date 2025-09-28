import { useAuth } from '../contexts/AuthContext';

export const useApi = () => {
  const { makeAuthenticatedRequest, logout } = useAuth();

  const apiCall = async (url, options = {}) => {
    try {
      const response = await makeAuthenticatedRequest(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const get = (url, options = {}) => apiCall(url, { ...options, method: 'GET' });
  const post = (url, data, options = {}) => apiCall(url, { 
    ...options, 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
  const put = (url, data, options = {}) => apiCall(url, { 
    ...options, 
    method: 'PUT', 
    body: JSON.stringify(data) 
  });
  const del = (url, options = {}) => apiCall(url, { ...options, method: 'DELETE' });

  return {
    apiCall,
    get,
    post,
    put,
    delete: del
  };
};
