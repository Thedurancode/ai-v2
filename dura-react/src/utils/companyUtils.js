// Utility functions for company data formatting

/**
 * Attempts to find the best logo URL for a company.
 * Uses logo.dev API based on website domain.
 * Falls back to trying to construct domain from name.
 * @param {object} company - The company object
 * @returns {string|null} The logo URL or null if not found
 */
export const getLogoUrl = (company) => {
  let domain = null;
  if (company.linkedin_data?.website) {
    try {
      domain = new URL(company.linkedin_data.website).hostname.replace(/^www\./, '');
    } catch (e) {
      // Handle invalid URL if necessary
      domain = company.linkedin_data.website.replace(/^https?:\/\//i, '').split('/')[0];
    }
  } else if (company.domain) {
    domain = company.domain.replace(/^www\./, '');
  } else if (company.name) {
    // Basic attempt to guess domain from name
    domain = company.name.toLowerCase().replace(/[^a-z0-9.-]/g, '').split(' ')[0] + '.com'; // Simplistic guess
  }

  if (domain) {
    // Ensure you have a valid token for logo.dev
    const logoDevToken = import.meta.env.VITE_LOGODEV_TOKEN || 'pk_TCK5i8rzR92YmS65BY2fgQ'; // Use env var or fallback
    return `https://img.logo.dev/${domain}?token=${logoDevToken}&retina=true`;
  }

  return null;
};

/**
 * Gets the best available description for a company.
 * Prefers LinkedIn data description, falls back to company.description.
 * @param {object} company - The company object
 * @returns {string} The description or a fallback message
 */
export const getDescription = (company) => {
  if (company.linkedin_data?.description) return company.linkedin_data.description;
  if (company.description) return company.description;
  return 'No description available.';
};

/**
 * Generates initials from a company name.
 * @param {string} name - The company name
 * @returns {string} Two uppercase initials
 */
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean) // Ensure we don't get undefined from empty strings
    .join('')
    .toUpperCase()
    .substring(0, 2);
};