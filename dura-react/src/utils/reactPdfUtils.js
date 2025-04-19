import { pdf } from '@react-pdf/renderer';
import ResearchPDF from '../components/ResearchPDF';

/**
 * Generate and download a PDF for partner research
 * @param {Object} partner - The partner object with company information
 * @param {Array} researchSections - Array of research sections with heading and content
 * @returns {Promise} - Promise that resolves when PDF is downloaded
 */
export const generateAndDownloadPDF = async (partner, researchSections) => {
  try {
    // Validate required fields
    if (!partner || !partner.name) {
      throw new Error('Partner name is required to generate PDF');
    }

    // Ensure partner has all required fields with better fallbacks
    const enhancedPartner = {
      ...partner,
      name: partner.name || 'Unknown Company',
      industry: partner.industry || 'Not specified',
      description: partner.description || 'No company description available. Research needed.',
      hq_location: partner.hq_location || 'Location not specified',
      size_range: partner.size_range || 'Size not specified',
      founded_year_min: partner.founded_year_min || 'Year founded not specified'
    };

    // Validate research sections
    if (!researchSections || !Array.isArray(researchSections) || researchSections.length === 0) {
      throw new Error('No research sections provided');
    }

    // Enhance research sections with better fallbacks
    const enhancedSections = researchSections.map(section => {
      return {
        ...section,
        content: section.content || `No research data available for ${section.heading}. Research needed.`
      };
    });

    // Create the PDF document with enhanced data
    const blob = await pdf(ResearchPDF({ 
      partner: enhancedPartner, 
      researchSections: enhancedSections 
    })).toBlob();

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${enhancedPartner.name.replace(/\\s+/g, '_')}_Research.pdf`;
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
