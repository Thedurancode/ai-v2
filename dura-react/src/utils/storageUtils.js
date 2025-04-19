/**
 * Utility functions for handling local storage operations
 */

/**
 * Get favorites from localStorage
 * @returns {Array} Array of favorite company objects
 */
export const getFavorites = () => {
  try {
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorites from localStorage:', error);
    return [];
  }
};

/**
 * Add a company to favorites in localStorage
 * @param {Object} company The company object to add to favorites
 * @returns {Array} Updated array of favorites
 */
export const addFavorite = (company) => {
  try {
    const favorites = getFavorites();
    
    // Check if company already exists in favorites
    const existingIndex = favorites.findIndex(fav => fav.name === company.name);
    
    if (existingIndex === -1) {
      // Add only necessary properties to avoid storing large objects
      const favoriteCompany = {
        id: company.id || `fav-${Date.now()}`,
        name: company.name,
        partnership_score: company.partnership_score,
        logo: company.logo || null,
        added_at: new Date().toISOString()
      };
      
      // Add to favorites
      const updatedFavorites = [...favorites, favoriteCompany];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      return updatedFavorites;
    }
    
    return favorites;
  } catch (error) {
    console.error('Error adding favorite to localStorage:', error);
    return getFavorites();
  }
};

/**
 * Remove a company from favorites in localStorage
 * @param {string} companyName The name of the company to remove
 * @returns {Array} Updated array of favorites
 */
export const removeFavorite = (companyName) => {
  try {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(company => company.name !== companyName);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    return updatedFavorites;
  } catch (error) {
    console.error('Error removing favorite from localStorage:', error);
    return getFavorites();
  }
};

/**
 * Check if a company is in favorites
 * @param {string} companyName The name of the company to check
 * @returns {boolean} True if company is in favorites, false otherwise
 */
export const isFavorite = (companyName) => {
  try {
    const favorites = getFavorites();
    return favorites.some(company => company.name === companyName);
  } catch (error) {
    console.error('Error checking if company is favorite:', error);
    return false;
  }
};

/**
 * Clear all favorites from localStorage
 * @returns {Array} Empty array
 */
export const clearFavorites = () => {
  try {
    localStorage.removeItem('favorites');
    return [];
  } catch (error) {
    console.error('Error clearing favorites from localStorage:', error);
    return [];
  }
}; 