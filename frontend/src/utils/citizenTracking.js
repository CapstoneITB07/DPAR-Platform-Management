import axios from 'axios';
import { API_BASE } from './url';

/**
 * Track a citizen page view
 * @param {string} pagePath - The path of the page (e.g., '/citizen', '/citizen/about')
 * @param {string} contentType - Optional: 'announcement' or 'training_program'
 * @param {number} contentId - Optional: ID of the announcement or training program
 */
export const trackCitizenView = async (pagePath, contentType = null, contentId = null) => {
  try {
    // Don't track if offline
    if (!navigator.onLine) {
      return;
    }

    await axios.post(`${API_BASE}/api/citizen/track-view`, {
      page_path: pagePath,
      content_type: contentType,
      content_id: contentId
    }, {
      timeout: 3000 // Short timeout to not block the UI
    });
  } catch (error) {
    // Silently fail - tracking shouldn't break the user experience
    console.debug('Failed to track view:', error);
  }
};

