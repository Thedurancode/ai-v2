/**
 * Standardizes the format of research data to ensure consistent structure
 *
 * @param {Object} rawResearchData - The raw research data from the API
 * @returns {Object} - Standardized research data with consistent sections
 */
export const standardizeResearchFormat = (rawResearchData) => {
  console.log('Standardizing research format, input type:', typeof rawResearchData);

  // If no data provided, return empty structure
  if (!rawResearchData) {
    console.log('No research data provided, returning default sections');
    return {
      sections: getDefaultSections()
    };
  }

  // If data already has sections in the expected format, use it
  if (rawResearchData.sections && Array.isArray(rawResearchData.sections)) {
    console.log('Research data already has sections array');
    // Ensure all required sections exist
    const existingSections = rawResearchData.sections.map(section => section.heading);
    const standardSections = getDefaultSections();

    // Add any missing standard sections
    const missingStandardSections = standardSections.filter(
      section => !existingSections.includes(section.heading)
    );

    console.log('Adding missing sections:', missingStandardSections.map(s => s.heading));
    return {
      sections: [...rawResearchData.sections, ...missingStandardSections]
    };
  }

  // If data is in a different format, try to extract sections
  try {
    // Handle different input types
    let parsedData;

    if (typeof rawResearchData === 'string') {
      // Try to parse as JSON first
      try {
        console.log('Attempting to parse string as JSON');
        parsedData = JSON.parse(rawResearchData);
        console.log('Successfully parsed as JSON');
      } catch (parseError) {
        console.log('Not valid JSON, treating as plain text');
        // If not valid JSON, treat as plain text
        return {
          sections: extractSectionsFromText(rawResearchData)
        };
      }
    } else {
      // Already an object
      parsedData = rawResearchData;
    }

    // Check for common data structures

    // If parsedData has a data property, use that
    if (parsedData.data) {
      console.log('Using data property from parsed data');
      return standardizeResearchFormat(parsedData.data);
    }

    // If parsedData has content or text property, use that
    const content = parsedData.content || parsedData.text || parsedData;

    // If content is a string, try to extract sections
    if (typeof content === 'string') {
      console.log('Extracting sections from text content');
      return {
        sections: extractSectionsFromText(content)
      };
    }

    // If content has sections, use those
    if (content.sections && Array.isArray(content.sections)) {
      console.log('Using sections from content');
      return {
        sections: content.sections
      };
    }

    // If we have an array, it might be an array of sections
    if (Array.isArray(content)) {
      console.log('Content is an array, checking if it contains sections');
      // Check if it looks like an array of sections
      if (content.length > 0 && content[0].heading && content[0].content) {
        console.log('Array appears to contain sections');
        // Ensure all required sections exist
        const existingSections = content.map(section => section.heading);
        const standardSections = getDefaultSections();

        // Add any missing standard sections
        const missingStandardSections = standardSections.filter(
          section => !existingSections.includes(section.heading)
        );

        return {
          sections: [...content, ...missingStandardSections]
        };
      }
    }

    // Last resort: try to convert the object to a string and extract sections
    console.log('Attempting to stringify object and extract sections');
    try {
      const stringified = JSON.stringify(content);
      return {
        sections: extractSectionsFromText(stringified)
      };
    } catch (stringifyError) {
      console.error('Error stringifying content:', stringifyError);
    }

    // Fallback to default sections
    console.log('No recognizable format found, using default sections');
    return {
      sections: getDefaultSections()
    };
  } catch (error) {
    console.error('Error standardizing research format:', error);
    return {
      sections: getDefaultSections()
    };
  }
};

/**
 * Extract sections from a text string based on markdown headings
 *
 * @param {string} text - The text to extract sections from
 * @returns {Array} - Array of section objects
 */
const extractSectionsFromText = (text) => {
  // Default sections to start with
  const defaultSections = getDefaultSections();

  // If no text, return defaults
  if (!text) return defaultSections;

  // Try to extract sections based on markdown headings
  const sections = [];

  // Split by heading markers (## or # followed by space)
  const headingRegex = /(?:^|\n)#{1,2}\s+(.+?)(?:\n|$)/g;
  let match;
  let lastIndex = 0;
  let foundHeadings = false;

  while ((match = headingRegex.exec(text)) !== null) {
    foundHeadings = true;
    const heading = match[1].trim();
    const startIndex = match.index + match[0].length;

    // If this isn't the first heading, add the previous section
    if (lastIndex > 0) {
      const sectionContent = text.substring(lastIndex, match.index).trim();
      sections.push({
        heading: sections[sections.length - 1].heading,
        content: sectionContent
      });
    }

    // Add this heading
    sections.push({
      heading,
      content: '' // Will be filled in next iteration or at the end
    });

    lastIndex = startIndex;
  }

  // Add the final section content
  if (foundHeadings && sections.length > 0) {
    const finalContent = text.substring(lastIndex).trim();
    sections[sections.length - 1].content = finalContent;
  } else {
    // No headings found, try to split by double newlines
    const paragraphs = text.split('\n\n');

    if (paragraphs.length >= 3) {
      // Use the first paragraph as overview
      sections.push({
        heading: 'Overview',
        content: paragraphs[0].trim()
      });

      // Use the second paragraph as business model
      sections.push({
        heading: 'Business Model & Revenue',
        content: paragraphs[1].trim()
      });

      // Use the rest as opportunities
      sections.push({
        heading: 'Opportunities for MLSE Partnership',
        content: paragraphs.slice(2).join('\n\n').trim()
      });
    } else {
      // Just use the whole text as overview
      sections.push({
        heading: 'Overview',
        content: text.trim()
      });

      // Add empty sections for the rest
      sections.push({
        heading: 'Business Model & Revenue',
        content: 'No information available.'
      });

      sections.push({
        heading: 'Opportunities for MLSE Partnership',
        content: 'No information available.'
      });
    }
  }

  // Ensure all required sections exist
  const existingSections = sections.map(section => section.heading);
  const missingSections = defaultSections.filter(
    section => !existingSections.includes(section.heading)
  );

  return [...sections, ...missingSections];
};

/**
 * Get the default sections that should be in every research report
 *
 * @returns {Array} - Array of default section objects
 */
const getDefaultSections = () => [
  {
    heading: 'Overview',
    content: 'No overview information available.'
  },
  {
    heading: 'Leadership',
    content: 'No leadership information available.'
  },
  {
    heading: 'Business Model & Revenue',
    content: 'No business model or revenue information available.'
  },
  {
    heading: 'Market Position',
    content: 'No market position information available.'
  },
  {
    heading: 'Competitors',
    content: 'No competitor information available.'
  },
  {
    heading: 'Opportunities for MLSE Partnership',
    content: 'No partnership opportunities identified.'
  }
];

export default standardizeResearchFormat;
