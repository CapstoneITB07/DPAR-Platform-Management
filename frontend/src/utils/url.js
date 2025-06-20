const API_BASE = 'http://localhost:8000';

export const getLogoUrl = (logoPath) => {
  if (!logoPath) {
    return `${window.location.origin}/Assets/disaster_logo.png`;
  }
  // Check if it's a path for backend storage
  if (logoPath.startsWith('/storage/')) {
    return `${API_BASE}${logoPath}`;
  }
  // Check for other storage path format
  if (logoPath.startsWith('logos/')) {
    return `${API_BASE}/storage/${logoPath}`;
  }
  // Check if it's an asset in the frontend public folder
  if (logoPath.startsWith('/Assets/')) {
    return `${window.location.origin}${logoPath}`;
  }
  // Fallback for full URLs or other cases
  return logoPath;
}; 