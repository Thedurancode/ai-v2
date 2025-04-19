// Using jsPDF for PDF generation
import { jsPDF } from 'jspdf'
// Add the font to ensure proper text rendering
import 'jspdf/dist/polyfills.es.js'

// This function is kept for backward compatibility but uses the same jsPDF implementation
export const generateCompanyPDF = async (company, researchContent) => {
  // Just delegate to the new implementation
  return generateResearchPDF(company, researchContent?.sections || []);
}

// Helper function to get score category text (used in the PDF generation)
export const getScoreCategory = (score) => {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Average'
  return 'Poor'
}

export const generateResearchPDF = async (partner, researchSections) => {
  return new Promise((resolve) => {
    // Create a new jsPDF instance with white background
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set document properties
    doc.setProperties({
      title: `${partner.name} AI Research Report`,
      author: 'MLSE AI Research Platform',
      subject: 'AI Research Report',
      creator: 'MLSE AI Research Platform'
    });

    // Set white background for the entire document
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    // Set initial coordinates
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to add a new page with styling like the example
    const addNewPage = () => {
      doc.addPage();
      y = 20;

      // Add header to new page with purple background
      doc.setFillColor(87, 70, 233); // Purple color
      doc.rect(0, 0, pageWidth, 25, 'F');

      // Add subtle pattern to header (small dots)
      doc.setFillColor(120, 110, 240); // Lighter purple
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 2; j++) {
          doc.circle(pageWidth - margin - 50 + (i * 5), 5 + (j * 8), 0.3, 'F');
        }
      }

      // Add decorative line at the bottom of the header
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.line(margin, 22, pageWidth - margin, 22);

      // Add company name and report title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${partner.name} - AI Research Report`, margin, 15);

      // Add page number
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.text(`Page ${pageNumber}`, pageWidth - margin, 15, { align: 'right' });

      // Add small decorative element
      doc.setFillColor(0, 0, 0);
      doc.circle(pageWidth - margin - 15, 15, 2, 'F');

      y = 35; // Reset y position after header
    };

    // Helper function to check if we need a new page
    const checkForNewPage = (neededSpace) => {
      if (y + neededSpace > pageHeight - 20) {
        addNewPage();
        return true;
      }
      return false;
    };

    // Helper function to add text with line breaks
    const addText = (text, fontSize, isBold = false, color = '#000000', align = 'left') => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color);

      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      // Split text to fit within content width
      const textLines = doc.splitTextToSize(text, contentWidth);

      // Check if we need a new page
      if (checkForNewPage(textLines.length * (fontSize / 4) + 10)) {
        // Already added a new page in the check
      }

      // Add text with proper alignment
      if (align === 'center') {
        doc.text(textLines, pageWidth / 2, y, { align: 'center' });
      } else if (align === 'right') {
        doc.text(textLines, pageWidth - margin, y, { align: 'right' });
      } else {
        doc.text(textLines, margin, y);
      }

      // Update y position based on text height
      y += textLines.length * (fontSize / 4) + 5;
    };

    // Add header with purple background like the example
    doc.setFillColor(87, 70, 233); // Purple color
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Add subtle pattern to header (small dots)
    doc.setFillColor(120, 110, 240); // Lighter purple
    for (let i = 0; i < 30; i++) {
      for (let j = 0; j < 5; j++) {
        doc.circle(margin/2 + (i * 10), 5 + (j * 8), 0.3, 'F');
      }
    }

    // Add a decorative line at the bottom of the header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, 42, pageWidth - margin, 42);

    // Add company name with bold styling
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text(partner.name, margin, 22);

    // Add report title
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('AI Research Report', margin, 35);

    // Add date
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('en-US'), pageWidth - margin, 35, { align: 'right' });

    // Add a small decorative element
    doc.setFillColor(0, 0, 0);
    doc.circle(pageWidth - margin - 15, 22, 3, 'F');

    // Move down after header
    y = 50;

    // Add company information section with styling like the example
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(87, 70, 233); // Purple color
    doc.setFontSize(16);
    doc.text('Company Information', margin, y);
    y += 10;

    // Add metadata grid
    const metadataItems = [
      { label: 'Industry', value: partner.industry || 'Unknown' },
      { label: 'Location', value: partner.hq_location || partner.country || 'Unknown' },
      { label: 'Size', value: partner.size_range || partner.employee_count || 'Unknown' },
      { label: 'Founded', value: partner.founded_year_min || 'Unknown' }
    ];

    // Add partnership score if available
    if (partner.partnership_score) {
      metadataItems.push({
        label: 'Partnership Score',
        value: `${partner.partnership_score}/10 (${getScoreCategory(partner.partnership_score)})`
      });
    }

    // Draw metadata items with proper styling
    metadataItems.forEach(item => {
      // Label in purple
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(87, 70, 233); // Purple color
      doc.setFontSize(11);
      doc.text(`${item.label}:`, margin, y);

      // Value in black
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(item.value, margin + 60, y);

      y += 8;
    });

    y += 5;

    // Add description if available
    if (partner.description) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(87, 70, 233); // Purple color
      doc.setFontSize(14);
      doc.text('Description', margin, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);

      // Split description into lines to fit the page width
      const descLines = doc.splitTextToSize(partner.description, pageWidth - (margin * 2));
      doc.text(descLines, margin, y);
      y += descLines.length * 5 + 10;
    }

    // Add research findings section with styling like the example
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(87, 70, 233); // Purple color
    doc.setFontSize(18);
    doc.text('AI Research Findings', margin, y);
    y += 15;

    // Add research sections with improved formatting
    if (researchSections && researchSections.length > 0) {
      researchSections.forEach((section, index) => {
        // Start each section on a new page except the first one
        if (index > 0) {
          addNewPage();
        }

        // Add section heading with number and highlight color like the example
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(87, 70, 233); // Purple color
        doc.setFontSize(14);
        doc.text(`${index + 1}. ${section.heading}`, margin, y);
        y += 10;

        // Process content to handle paragraphs better
        const paragraphs = section.content.split('\n\n');

        // Add each paragraph with proper spacing
        paragraphs.forEach((paragraph, pIndex) => {
          // Check if paragraph is a subheading (starts with ### or ends with a colon)
          if ((paragraph.trim().startsWith('###') || paragraph.trim().endsWith(':')) && paragraph.length < 100) {
            // Add some space before subheadings (except the first one)
            if (pIndex > 0) y += 3;

            // Format as a subheading - bold and purple
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(87, 70, 233); // Purple color
            doc.setFontSize(12);

            // Clean up the heading (remove ### if present)
            const cleanHeading = paragraph.trim().replace(/^###\s*/, '');
            doc.text(cleanHeading, margin, y);
            y += 8;
          }
          // Check if paragraph is a bullet point list
          else if (paragraph.includes('- ') || paragraph.includes('* ')) {
            // Split into bullet points
            const bulletPoints = paragraph.split('\n').filter(line => line.trim().length > 0);

            bulletPoints.forEach(point => {
              // Format bullet points with proper indentation
              const cleanPoint = point.replace(/^[\-\*]\s+/, '').trim();

              // Add bullet symbol
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(87, 70, 233); // Purple color
              doc.text('•', margin, y);

              // Add bullet point text with indent
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);
              doc.setFontSize(11);

              // Split text to fit within content width with indent
              const bulletWidth = contentWidth - 8; // Reduced width for indent
              const textLines = doc.splitTextToSize(cleanPoint, bulletWidth);

              // Check if we need a new page
              if (checkForNewPage(textLines.length * (11 / 4) + 5)) {
                // Already added a new page in the check
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(87, 70, 233);
                doc.text('•', margin, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
              }

              // Add indented text
              doc.text(textLines, margin + 8, y);

              // Update y position based on text height
              y += textLines.length * (11 / 4) + 3;
            });
          }
          // Regular paragraph
          else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);

            // Split paragraph into lines to fit the page width
            const paraLines = doc.splitTextToSize(paragraph, pageWidth - (margin * 2));
            doc.text(paraLines, margin, y);
            y += paraLines.length * 5 + 5;
          }
        });

        y += 10;
      });
    } else {
      addText('No research data available.', 12, false, '#666666', 'center');
    }

    // Add simple footer like the example
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Add decorative line above footer
      doc.setDrawColor(87, 70, 233, 0.5);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      // Add footer text
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by MLSE AI Research Platform', margin, pageHeight - 10);

      // Add page numbers with a simple style
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(87, 70, 233);
      doc.text(`${i}/${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

      // Add small decorative element to footer
      doc.setDrawColor(87, 70, 233);
      doc.setFillColor(87, 70, 233);
      doc.circle(pageWidth/2, pageHeight - 10, 1, 'F');
    }

    // Generate PDF as blob
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
}
