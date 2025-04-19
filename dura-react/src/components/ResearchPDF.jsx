import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts (optional)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'bold' },
  ]
});

// Create styles with ultra-modern dark theme
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#0f172a', // Rich dark blue background
    padding: 0,
    position: 'relative',
  },
  pageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    zIndex: 0,
  },
  header: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)', // Semi-transparent dark header
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1', // Indigo accent
    borderBottomStyle: 'solid',
    padding: 20,
    paddingBottom: 15,
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
    // Add more modern styling
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    // Add subtle shadow effect (simulated with border)
    borderLeftWidth: 1,
    borderLeftColor: '#6366f1',
    borderLeftStyle: 'solid',
    // Add gradient effect
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a5b4fc', // Light indigo
    marginBottom: 5,
  },
  headerDate: {
    fontSize: 10,
    color: '#94a3b8', // Slate-300
    position: 'absolute',
    right: 20,
    top: 35,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1', // Indigo
    position: 'absolute',
    right: 20,
    top: 20,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#334155', // Slate-700
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a5b4fc', // Light indigo
    marginBottom: 10,
    marginLeft: 20,
    marginRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // Slate-700
    borderBottomStyle: 'solid',
    paddingBottom: 5,
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginLeft: 20,
    marginRight: 20,
  },
  metadataLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a5b4fc', // Light indigo
    width: 60,
  },
  metadataValue: {
    fontSize: 11,
    color: 'white',
    flex: 1,
  },
  description: {
    fontSize: 11,
    color: '#e2e8f0', // Slate-200
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 15,
    lineHeight: 1.5,
  },
  researchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a5b4fc', // Light indigo
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 20,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1', // Indigo
    borderBottomStyle: 'solid',
    paddingBottom: 5,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white', // Brighter text for better contrast
    marginTop: 20,
    marginBottom: 15,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: '#1e293b', // Modern dark blue background
    padding: 14,
    paddingLeft: 18,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#6366f1', // Indigo
    borderLeftStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#4f46e5', // Slightly different indigo for gradient effect
    borderBottomStyle: 'solid',
    // Add subtle top highlight
    borderTopWidth: 1,
    borderTopColor: '#818cf8', // Lighter indigo
    borderTopStyle: 'solid',
    // Add subtle right border
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderRightStyle: 'solid',
  },
  subHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d1d5db', // Lighter color for better contrast
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: '#1a2234', // Modern dark blue
    padding: 8,
    paddingLeft: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#818cf8', // Lighter indigo
    borderLeftStyle: 'solid',
    width: '90%',
    // Add subtle bottom border
    borderBottomWidth: 1,
    borderBottomColor: '#4f46e5',
    borderBottomStyle: 'solid',
  },
  paragraph: {
    fontSize: 11,
    color: '#e2e8f0', // Slate-200
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 14,
    marginTop: 6,
    lineHeight: 1.8, // Increased line height for better readability
    padding: 6,
    // Add subtle left border for modern design
    borderLeftWidth: 1,
    borderLeftColor: '#334155', // Subtle border
    borderLeftStyle: 'solid',
    paddingLeft: 12,
    // Add subtle background for better readability
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 4,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 10,
    marginTop: 4,
    // Add subtle background for modern look
    backgroundColor: '#1a2234',
    padding: 8,
    borderRadius: 6,
    // Add subtle left border
    borderLeftWidth: 3,
    borderLeftColor: '#4f46e5', // Indigo
    borderLeftStyle: 'solid',
    // Add subtle bottom border
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomStyle: 'solid',
  },
  bullet: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#818cf8', // Lighter indigo for better visibility
    width: 15,
    paddingTop: 1,
  },
  bulletText: {
    fontSize: 11,
    color: '#e2e8f0', // Slate-200
    flex: 1,
    paddingLeft: 5,
    lineHeight: 1.6, // Increased for better readability
  },
  codeBlock: {
    backgroundColor: '#131c2e', // Darker background for modern look
    padding: 12,
    marginLeft: 20,
    marginRight: 20,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1', // Indigo
    borderLeftStyle: 'solid',
    borderTopWidth: 1,
    borderTopColor: '#4f46e5', // Indigo
    borderTopStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#4f46e5', // Indigo
    borderBottomStyle: 'solid',
    // Add subtle right border
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    borderRightStyle: 'solid',
  },
  codeText: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: '#e2e8f0', // Slate-200
    lineHeight: 1.4,
  },
  inlineCode: {
    fontFamily: 'Courier',
    backgroundColor: '#1e293b', // Slightly lighter dark blue
    color: '#a5b4fc', // Light indigo
    padding: 2,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 3,
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#334155', // Slate-700
    borderStyle: 'solid',
  },
  link: {
    color: '#6366f1', // Indigo
    textDecoration: 'none',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    fontSize: 9,
    color: '#a5b4fc', // Light indigo for better visibility
    textAlign: 'center',
    marginTop: 10,
    borderTopWidth: 1, // Thicker border
    borderTopColor: '#4f46e5', // Indigo
    borderTopStyle: 'solid',
    // Add subtle background
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 8,
    zIndex: 2,
  },
  footerText: {
    marginLeft: 20,
    color: '#d1d5db', // Lighter color for better visibility
    fontWeight: 'bold',
  },
  footerPage: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    fontSize: 10, // Slightly larger
    color: '#a5b4fc', // Light indigo
    fontWeight: 'bold',
    // Add subtle background
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
  },
  footerDot: {
    width: 4, // Larger dot
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6366f1', // Indigo
    position: 'absolute',
    bottom: 22,
    left: '50%',
    marginLeft: -2,
  },
  // Cover page styles
  coverPage: {
    flexDirection: 'column',
    backgroundColor: '#0f172a', // Rich dark blue background for cover
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Add subtle gradient
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%', // Extend gradient for more dramatic effect
    backgroundColor: '#131c2e', // Darker gradient for modern look
    // Add a subtle gradient effect
    opacity: 0.85,
  },
  coverPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08, // Slightly more visible pattern
    zIndex: 1, // Ensure pattern is above gradient
  },
  coverAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 150, // Larger accent
    height: 150,
    backgroundColor: '#4f46e5', // Slightly different indigo
    opacity: 0.4, // More visible
    borderBottomLeftRadius: 150,
    // Add subtle border
    borderLeftWidth: 2,
    borderLeftColor: '#6366f1',
    borderLeftStyle: 'solid',
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
    borderBottomStyle: 'solid',
  },
  coverAccent2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 200, // Larger accent
    height: 200,
    backgroundColor: '#4338ca', // Darker indigo
    opacity: 0.3, // More visible
    borderTopRightRadius: 200,
    // Add subtle border
    borderTopWidth: 2,
    borderTopColor: '#6366f1',
    borderTopStyle: 'solid',
    borderRightWidth: 2,
    borderRightColor: '#6366f1',
    borderRightStyle: 'solid',
  },
  coverLogoContainer: {
    width: 180, // Larger logo container
    height: 180,
    backgroundColor: '#131c2e', // Darker background
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 4, // Thicker border
    borderColor: '#4f46e5', // Slightly different indigo
    borderStyle: 'solid',
    // Add shadow effect (note: this is simulated with multiple borders in PDF)
    padding: 5,
    position: 'relative',
    zIndex: 10,
    // Add second border for modern layered effect
    shadowColor: '#6366f1',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    // Add subtle inner border
    borderRightWidth: 1,
    borderRightColor: '#818cf8', // Lighter indigo
    borderRightStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#818cf8', // Lighter indigo
    borderBottomStyle: 'solid',
  },
  coverLogo: {
    width: 130,
    height: 130,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    // Add a subtle border to make logo stand out
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  coverTitle: {
    fontSize: 44, // Even larger title
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
    // Add text shadow effect
    textShadowColor: '#4338ca',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
    // Add letter spacing for modern look
    letterSpacing: 1.5,
    // Add subtle background
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 15,
    paddingLeft: 40,
    paddingRight: 40,
    borderRadius: 30,
    // Add subtle border
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'solid',
    zIndex: 10,
  },
  coverSubtitle: {
    fontSize: 22, // Larger subtitle
    color: '#a5b4fc', // Light indigo
    marginBottom: 30,
    textAlign: 'center',
    // Add subtle background for modern look
    backgroundColor: 'rgba(19, 28, 46, 0.7)',
    padding: 8,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 20,
    // Add subtle border
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderStyle: 'solid',
  },
  coverDate: {
    fontSize: 14,
    color: '#d1d5db', // Lighter color for better visibility
    marginBottom: 20,
    textAlign: 'center',
    // Add subtle background
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 6,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 15,
    // Add subtle border
    borderWidth: 1,
    borderColor: '#6366f1',
    borderStyle: 'solid',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  coverFooterText: {
    fontSize: 12,
    color: '#94a3b8', // Slate-300
    textAlign: 'center',
  },
  coverDecoration: {
    position: 'absolute',
    width: 250, // Wider decoration
    height: 5, // Slightly thicker
    backgroundColor: '#4f46e5', // Different indigo shade
    bottom: 100,
    left: '50%',
    marginLeft: -125,
    borderRadius: 3,
    // Add subtle glow effect
    shadowColor: '#6366f1',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    // Add subtle border
    borderWidth: 1,
    borderColor: '#818cf8',
    borderStyle: 'solid',
  },
  coverDecorationSmall: {
    position: 'absolute',
    width: 150, // Wider decoration
    height: 3, // Slightly thicker
    backgroundColor: '#818cf8', // Lighter indigo
    bottom: 90,
    left: '50%',
    marginLeft: -75,
    borderRadius: 2,
    // Add subtle glow effect
    shadowColor: '#6366f1',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  // End page styles
  endPage: {
    flexDirection: 'column',
    backgroundColor: '#0f172a', // Rich dark blue background to match cover
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Add subtle gradient
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },
  endPageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%', // Taller gradient
    backgroundColor: '#131c2e', // Darker gradient to match cover
    opacity: 0.85, // Match cover opacity
    zIndex: 0,
  },
  endPageTitle: {
    fontSize: 32, // Larger title
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
    // Add text shadow effect
    textShadowColor: '#4338ca',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
    // Add letter spacing for modern look
    letterSpacing: 1.5,
    // Add subtle background
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 15,
    paddingLeft: 40,
    paddingRight: 40,
    borderRadius: 30,
    // Add subtle border
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'solid',
    zIndex: 10,
  },
  logosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    zIndex: 2,
    // Add subtle background
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    padding: 15,
    borderRadius: 10,
    // Add subtle border
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'solid',
  },
  logoContainer: {
    width: 150,
    height: 150,
    backgroundColor: '#1e293b',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderWidth: 4,
    borderColor: '#6366f1', // Indigo
    borderStyle: 'solid',
    // Add shadow effect (note: this is simulated with multiple borders in PDF)
    padding: 8,
    position: 'relative',
    zIndex: 10,
    // Add inner border
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    // Add a subtle border to make logo stand out
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    // Add subtle shadow
    shadowColor: '#6366f1',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  endPageText: {
    fontSize: 14,
    color: '#d1d5db', // Lighter color for better visibility
    marginBottom: 12,
    textAlign: 'center',
    maxWidth: 450, // Wider text area
    zIndex: 2,
    // Add subtle background
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 8,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 8,
    // Add subtle border
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'solid',
    lineHeight: 1.6, // Better readability
  },
  endPageFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 2,
    // Add subtle background
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 8,
    marginLeft: 100,
    marginRight: 100,
    borderRadius: 20,
    // Add subtle border
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderStyle: 'solid',
  },
  endPageFooterText: {
    fontSize: 12,
    color: '#a5b4fc', // Light indigo for better visibility
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

// Helper function to process research content with enhanced Markdown support
const processContent = (content) => {
  // Split content into paragraphs
  if (!content) return [{ type: 'paragraph', text: 'No research data available for this section.' }];

  // Check if content only contains placeholder text like "No information available"
  if (content.includes('No information available') ||
      content.includes('No overview information available') ||
      content.includes('No leadership information available') ||
      content.includes('No business model or revenue information available') ||
      content.includes('No market position information available') ||
      content.includes('No competitor information available') ||
      content.includes('No partnership opportunities identified')) {
    return [{ type: 'paragraph', text: content, isPlaceholder: true }];
  }

  // First, handle code blocks which might span multiple paragraphs
  const processedContent = [];
  let inCodeBlock = false;
  let currentCodeBlock = '';

  // Split by line to properly detect code blocks
  const lines = content.split('\n');
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block markers ```
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        if (currentParagraph.trim()) {
          // Save the paragraph before the code block
          processedContent.push({
            type: 'paragraph',
            text: currentParagraph.trim()
          });
          currentParagraph = '';
        }
        inCodeBlock = true;
        currentCodeBlock = '';
      } else {
        // End of code block
        processedContent.push({
          type: 'codeBlock',
          text: currentCodeBlock.trim()
        });
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      // Add line to code block
      currentCodeBlock += line + '\n';
    } else {
      // Regular content processing
      if (line.trim() === '') {
        // Empty line - end of paragraph
        if (currentParagraph.trim()) {
          // Process the completed paragraph
          const para = currentParagraph.trim();

          // Check if it's a heading (starts with #)
          if (para.startsWith('# ')) {
            processedContent.push({
              type: 'heading1',
              text: para.substring(2).trim()
            });
          } else if (para.startsWith('## ')) {
            processedContent.push({
              type: 'heading2',
              text: para.substring(3).trim()
            });
          } else if (para.startsWith('### ') || (para.endsWith(':') && para.length < 100)) {
            processedContent.push({
              type: 'subheading',
              text: para.startsWith('### ') ? para.substring(4).trim() : para
            });
          }
          // Check if it's a bullet point list
          else if (para.includes('- ') || para.includes('* ')) {
            // Split into bullet points
            const bulletPoints = para.split('\n')
              .filter(line => line.trim().length > 0)
              .map(point => {
                // Extract the bullet point text
                const bulletText = point.replace(/^[\-\*]\s+/, '').trim();

                // Clean up any unpaired ** markers
                let cleanText = bulletText.replace(/\*\*(?!.*\*\*)/g, '');

                // Process inline formatting
                return cleanText
                  .replace(/`([^`]+)`/g, '{{code}}$1{{/code}}')
                  .replace(/\*\*(.+?)\*\*/g, '{{bold}}$1{{/bold}}')
                  .replace(/\*(.+?)\*/g, '{{italic}}$1{{/italic}}');
              });

            processedContent.push({
              type: 'bullets',
              points: bulletPoints
            });
          }
          // Regular paragraph with inline formatting
          else {
            // Process inline code, bold, italic, and links
            // First, escape any ** that are not properly paired (to avoid issues)
            let cleanText = para.replace(/\*\*(?!.*\*\*)/g, '');

            let processedText = cleanText
              // Inline code
              .replace(/`([^`]+)`/g, '{{code}}$1{{/code}}')
              // Bold - more comprehensive regex to handle multiple occurrences
              .replace(/\*\*(.+?)\*\*/g, '{{bold}}$1{{/bold}}')
              // Italic - more comprehensive regex to handle multiple occurrences
              .replace(/\*(.+?)\*/g, '{{italic}}$1{{/italic}}');

            processedContent.push({
              type: 'paragraph',
              text: processedText
            });
          }

          currentParagraph = '';
        }
      } else {
        // Add line to current paragraph
        if (currentParagraph) {
          currentParagraph += '\n';
        }
        currentParagraph += line;
      }
    }
  }

  // Handle any remaining content
  if (inCodeBlock) {
    processedContent.push({
      type: 'codeBlock',
      text: currentCodeBlock.trim()
    });
  } else if (currentParagraph.trim()) {
    // Process the final paragraph
    const para = currentParagraph.trim();

    // Apply the same checks as above
    if (para.startsWith('# ')) {
      processedContent.push({
        type: 'heading1',
        text: para.substring(2).trim()
      });
    } else if (para.startsWith('## ')) {
      processedContent.push({
        type: 'heading2',
        text: para.substring(3).trim()
      });
    } else if (para.startsWith('### ') || (para.endsWith(':') && para.length < 100)) {
      processedContent.push({
        type: 'subheading',
        text: para.startsWith('### ') ? para.substring(4).trim() : para
      });
    } else if (para.includes('- ') || para.includes('* ')) {
      const bulletPoints = para.split('\n')
        .filter(line => line.trim().length > 0)
        .map(point => {
          const bulletText = point.replace(/^[\-\*]\s+/, '').trim();

          // Clean up any unpaired ** markers
          let cleanText = bulletText.replace(/\*\*(?!.*\*\*)/g, '');

          // Process inline formatting
          return cleanText
            .replace(/`([^`]+)`/g, '{{code}}$1{{/code}}')
            .replace(/\*\*(.+?)\*\*/g, '{{bold}}$1{{/bold}}')
            .replace(/\*(.+?)\*/g, '{{italic}}$1{{/italic}}');
        });

      processedContent.push({
        type: 'bullets',
        points: bulletPoints
      });
    } else {
      // Clean up any unpaired ** markers
      let cleanText = para.replace(/\*\*(?!.*\*\*)/g, '');

      // Process inline formatting
      let processedText = cleanText
        .replace(/`([^`]+)`/g, '{{code}}$1{{/code}}')
        .replace(/\*\*(.+?)\*\*/g, '{{bold}}$1{{/bold}}')
        .replace(/\*(.+?)\*/g, '{{italic}}$1{{/italic}}');

      processedContent.push({
        type: 'paragraph',
        text: processedText
      });
    }
  }

  return processedContent;
};

// Helper function to render formatted text with inline code, bold, and italic
const renderFormattedText = (text) => {
  if (!text) return null;

  // Split the text by our custom markers
  const parts = [];
  let currentText = text;

  // Process inline code
  while (currentText.includes('{{code}}') && currentText.includes('{{/code}}')) {
    const startIdx = currentText.indexOf('{{code}}');
    const endIdx = currentText.indexOf('{{/code}}');

    if (startIdx > 0) {
      // Add text before the code
      parts.push({
        type: 'text',
        content: currentText.substring(0, startIdx)
      });
    }

    // Add the code part
    parts.push({
      type: 'code',
      content: currentText.substring(startIdx + 8, endIdx)
    });

    // Update current text to remaining text
    currentText = currentText.substring(endIdx + 9);
  }

  // Add any remaining text
  if (currentText) {
    parts.push({
      type: 'text',
      content: currentText
    });
  }

  // Process bold and italic in each text part
  const processedParts = parts.map((part, index) => {
    if (part.type === 'code') {
      return <Text key={index} style={styles.inlineCode}>{part.content}</Text>;
    } else {
      // Process bold
      const boldParts = [];
      let boldText = part.content;

      while (boldText.includes('{{bold}}') && boldText.includes('{{/bold}}')) {
        const startIdx = boldText.indexOf('{{bold}}');
        const endIdx = boldText.indexOf('{{/bold}}');

        if (startIdx > 0) {
          // Add text before the bold
          boldParts.push({
            type: 'regular',
            content: boldText.substring(0, startIdx)
          });
        }

        // Add the bold part
        boldParts.push({
          type: 'bold',
          content: boldText.substring(startIdx + 8, endIdx)
        });

        // Update bold text to remaining text
        boldText = boldText.substring(endIdx + 9);
      }

      // Add any remaining text
      if (boldText) {
        boldParts.push({
          type: 'regular',
          content: boldText
        });
      }

      // Render the bold parts
      return boldParts.map((boldPart, boldIndex) => {
        if (boldPart.type === 'bold') {
          return <Text key={`${index}-${boldIndex}`} style={{ fontWeight: 'bold' }}>{boldPart.content}</Text>;
        } else {
          // Process italic in regular text
          const italicParts = [];
          let italicText = boldPart.content;

          while (italicText.includes('{{italic}}') && italicText.includes('{{/italic}}')) {
            const startIdx = italicText.indexOf('{{italic}}');
            const endIdx = italicText.indexOf('{{/italic}}');

            if (startIdx > 0) {
              // Add text before the italic
              italicParts.push({
                type: 'regular',
                content: italicText.substring(0, startIdx)
              });
            }

            // Add the italic part
            italicParts.push({
              type: 'italic',
              content: italicText.substring(startIdx + 10, endIdx)
            });

            // Update italic text to remaining text
            italicText = italicText.substring(endIdx + 11);
          }

          // Add any remaining text
          if (italicText) {
            italicParts.push({
              type: 'regular',
              content: italicText
            });
          }

          // Render the italic parts
          return italicParts.map((italicPart, italicIndex) => {
            if (italicPart.type === 'italic') {
              return <Text key={`${index}-${boldIndex}-${italicIndex}`} style={{ fontStyle: 'italic' }}>{italicPart.content}</Text>;
            } else {
              return <Text key={`${index}-${boldIndex}-${italicIndex}`}>{italicPart.content}</Text>;
            }
          });
        }
      });
    }
  });

  return processedParts;
};

// Create a background pattern component for reuse
const BackgroundPattern = () => (
  <View style={styles.pageBackground} fixed>
    {/* Create a subtle dot pattern */}
    {Array(15).fill().map((_, i) => (
      Array(10).fill().map((_, j) => (
        <View
          key={`bg-${i}-${j}`}
          style={{
            position: 'absolute',
            top: j * 80,
            left: i * 40,
            width: 1,
            height: 1,
            borderRadius: 0.5,
            backgroundColor: '#4f46e5',
            opacity: 0.2,
          }}
        />
      ))
    ))}

    {/* Add a few larger decorative elements */}
    {Array(3).fill().map((_, i) => (
      <View
        key={`bg-large-${i}`}
        style={{
          position: 'absolute',
          top: 200 * (i + 1),
          right: 20,
          width: 50,
          height: 2,
          backgroundColor: '#6366f1',
          opacity: 0.1,
        }}
      />
    ))}
  </View>
);

// Create Header Component for reuse
const Header = ({ partner }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerTitle}>{partner.name}</Text>
    <Text style={styles.headerSubtitle}>AI Research Report</Text>
    <Text style={styles.headerDate}>{new Date().toLocaleDateString()}</Text>
    <View style={styles.headerDot} />
    <View style={styles.headerLine} />
  </View>
);

// Create Footer Component for reuse
const Footer = ({ pageNumber, totalPages }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>Generated by MLSE AI Research Platform</Text>
    <View style={styles.footerDot} />
    <Text style={styles.footerPage}>{pageNumber}/{totalPages}</Text>
  </View>
);

// Create End Page Component
const EndPage = ({ partner }) => {
  // Use the logo.dev logo for consistency
  const logoDevUrl = partner.logo_url || 'https://framerusercontent.com/images/tgELERqZ0nObn14bTi418qTbg.png';

  // Use MLSE logo with a reliable source
  const mlseLogoUrl = 'https://1000logos.net/wp-content/uploads/2018/06/MLSE-Logo.png';
  // Backup MLSE logo in case the primary one fails
  const backupMlseLogoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Maple_Leaf_Sports_%26_Entertainment_logo.svg/1200px-Maple_Leaf_Sports_%26_Entertainment_logo.svg.png';

  // Enhanced logo style to ensure visibility
  const logoStyle = {
    width: 90,
    height: 90,
    objectFit: 'contain',
    objectPosition: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    // Add a subtle border to make logo stand out
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  };

  return (
    <Page size="A4" style={styles.endPage}>
      {/* Background gradient */}
      <View style={styles.endPageGradient} />

      {/* Title */}
      <Text style={styles.endPageTitle}>Thank You</Text>

      {/* Logos */}
      <View style={styles.logosContainer}>
        <View style={styles.logoContainer}>
          <Image src={mlseLogoUrl} style={logoStyle} cache={false} />
        </View>

        <View style={styles.logoContainer}>
          <Image src={logoDevUrl} style={logoStyle} cache={false} />
        </View>
      </View>

      {/* Text */}
      <Text style={styles.endPageText}>
        This report was generated by the MLSE AI Research Platform.
      </Text>

      <Text style={styles.endPageText}>
        For more information, please contact your MLSE representative.
      </Text>

      {/* Footer */}
      <View style={styles.endPageFooter}>
        <Text style={styles.endPageFooterText}>
          {new Date().getFullYear()} MLSE. All rights reserved.
        </Text>
      </View>
    </Page>
  );
};

// Create Cover Page Component
const CoverPage = ({ partner }) => {
  return (
    <Page size="A4" style={styles.page}>
      <BackgroundPattern />

      {/* Center content container */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
      }}>
        {/* Title */}
        <Text style={{
          fontSize: 36,
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: 20,
          textAlign: 'center',
          maxWidth: '80%',
        }}>{partner.name}</Text>

        {/* Subtitle */}
        <Text style={{
          fontSize: 18,
          color: '#a5b4fc',
          marginBottom: 40,
          textAlign: 'center',
        }}>AI Research Report</Text>

        {/* Date */}
        <Text style={{
          fontSize: 14,
          color: '#94a3b8',
          marginTop: 40,
          textAlign: 'center',
        }}>{new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</Text>
      </View>

      {/* Footer */}
      <View style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
      }}>
        <Text style={{
          fontSize: 12,
          color: '#94a3b8',
          textAlign: 'center',
        }}>MLSE AI Research Platform</Text>
      </View>
    </Page>
  );
};

// Helper function to get guidance for each section type
const getSectionGuidance = (heading) => {
  if (heading.includes('Overview')) {
    return 'Research needed: Company description, key facts, mission statement, and recent news.';
  } else if (heading.includes('Leadership')) {
    return 'Research needed: Key executives, board members, and organizational structure.';
  } else if (heading.includes('Business Model')) {
    return 'Research needed: Revenue streams, pricing models, and customer segments.';
  } else if (heading.includes('Market Position')) {
    return 'Research needed: Market share, competitors, and industry trends.';
  } else if (heading.includes('Partnership')) {
    return 'Research needed: Potential partnership opportunities and synergies.';
  }
  return 'This section requires additional research to be completed.';
};

// Create Document Component
const ResearchPDF = ({ partner, researchSections }) => {
  // Calculate total pages (cover + info + sections + end page)
  const totalPages = researchSections ? 3 + researchSections.length : 3;

  return (
    <Document title={`${partner.name} - AI Research Report`} author="MLSE AI Research Platform">
      {/* Cover Page */}
      <CoverPage partner={partner} />

      {/* Company Info Page */}
      <Page size="A4" style={styles.page}>
        <BackgroundPattern />
        <Header partner={partner} />

        {/* Company Information */}
        <Text style={styles.sectionTitle}>Company Information</Text>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Industry:</Text>
          <Text style={styles.metadataValue}>{partner.industry || 'Unknown'}</Text>
        </View>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Location:</Text>
          <Text style={styles.metadataValue}>{partner.hq_location || partner.country || 'Unknown'}</Text>
        </View>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Size:</Text>
          <Text style={styles.metadataValue}>{partner.size_range || partner.employee_count || 'Unknown'}</Text>
        </View>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Founded:</Text>
          <Text style={styles.metadataValue}>{partner.founded_year_min || 'Unknown'}</Text>
        </View>

        {partner.partnership_score && (
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Score:</Text>
            <Text style={styles.metadataValue}>
              {partner.partnership_score}/10
            </Text>
          </View>
        )}

        {/* Description */}
        {partner.description && (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{partner.description}</Text>
          </>
        )}

        {/* Research Findings Title */}
        <Text style={styles.researchTitle}>AI Research Findings</Text>

        {/* Check if we have any real research data */}
        {(() => {
          // Check if all sections are just placeholders
          const allPlaceholders = researchSections && researchSections.every(section =>
            section.content && (
              section.content.includes('No information available') ||
              section.content.includes('No overview information available') ||
              section.content.includes('No leadership information available') ||
              section.content.includes('No business model or revenue information available') ||
              section.content.includes('No market position information available') ||
              section.content.includes('No competitor information available') ||
              section.content.includes('No partnership opportunities identified')
            )
          );

          if (allPlaceholders) {
            return (
              <View style={{
                backgroundColor: '#1a2234',
                borderRadius: 8,
                padding: 15,
                marginLeft: 20,
                marginRight: 20,
                marginTop: 10,
                marginBottom: 20,
                borderLeftWidth: 3,
                borderLeftColor: '#6366f1',
                borderLeftStyle: 'solid',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  {/* Add a warning icon */}
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#6366f1',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>!</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: 'white', fontWeight: 'bold' }}>
                    No Research Data Available
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5 }}>
                  No research data is currently available for this company.
                  The following pages contain placeholder sections that will be populated when research is conducted.
                </Text>
              </View>
            );
          }

          // If we have real data, show the section list
          return (
            researchSections && researchSections.length > 0 && (
              <View wrap={false}>
                {researchSections.map((section, idx) => (
                  <View key={idx} style={{ marginBottom: 5, marginLeft: 20, marginRight: 20 }}>
                    <Text style={{ fontSize: 11, color: '#e2e8f0', marginBottom: 2 }}>
                      {idx + 1}. {section.heading}
                    </Text>
                  </View>
                ))}
              </View>
            )
          );
        })()
        }

        <Footer pageNumber={1} totalPages={totalPages} />
      </Page>

      {/* Create a "Research Needed" summary page */}
      <Page size="A4" style={styles.page}>
        <BackgroundPattern />
        <Header partner={partner} />

        <Text style={styles.researchTitle}>Research Needed</Text>

        {researchSections && researchSections.filter(section =>
          section.content && (
            section.content.includes('No information available') ||
            section.content.includes('No overview information available') ||
            section.content.includes('No leadership information available') ||
            section.content.includes('No business model or revenue information available') ||
            section.content.includes('No market position information available') ||
            section.content.includes('No competitor information available') ||
            section.content.includes('No partnership opportunities identified')
          )
        ).map((section, index) => (
          <View key={index} style={{
            backgroundColor: '#1e1b4b',
            borderRadius: 6,
            padding: 12,
            margin: 20,
            marginBottom: 15,
            borderLeftWidth: 4,
            borderLeftColor: '#6366f1',
            borderLeftStyle: 'solid'
          }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
              {index + 1}. {section.heading}
            </Text>
            <Text style={{ fontSize: 11, color: '#a5b4fc', lineHeight: 1.5 }}>
              {getSectionGuidance(section.heading)}
            </Text>
          </View>
        ))}

        <Footer pageNumber={2} totalPages={totalPages + 1} />
      </Page>

      {/* Create a page for each research section */}
      {researchSections && researchSections.length > 0 &&
        researchSections.map((section, index) => {
          // Check if this section has real content or just placeholder text
          const hasRealContent = section.content &&
            !section.content.includes('No information available') &&
            !section.content.includes('No overview information available') &&
            !section.content.includes('No leadership information available') &&
            !section.content.includes('No business model or revenue information available') &&
            !section.content.includes('No market position information available') &&
            !section.content.includes('No competitor information available') &&
            !section.content.includes('No partnership opportunities identified');

          return (
            <Page key={index} size="A4" style={styles.page}>
              <BackgroundPattern />
              <Header partner={partner} />

              {/* Section heading with indicator if empty or incomplete */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.sectionHeading}>{index + 1}. {section.heading}</Text>
                {!hasRealContent && (
                  <View style={{
                    backgroundColor: '#7f1d1d', // Dark red background
                    borderRadius: 4,
                    padding: 4,
                    paddingHorizontal: 8,
                    marginLeft: 10,
                    marginTop: 15,
                    borderWidth: 1,
                    borderColor: '#ef4444', // Red border
                    borderStyle: 'solid'
                  }}>
                    <Text style={{ fontSize: 9, color: '#fca5a5', fontWeight: 'bold' }}>NEEDS WORK</Text>
                  </View>
                )}
              </View>

            {/* Add warning box for incomplete sections */}
            {!hasRealContent && (
              <View style={{
                backgroundColor: '#1e1b4b', // Dark blue background
                borderRadius: 6,
                padding: 12,
                margin: 20,
                marginBottom: 15,
                borderLeftWidth: 4,
                borderLeftColor: '#6366f1', // Indigo
                borderLeftStyle: 'solid'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#6366f1',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>!</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: 'white', fontWeight: 'bold' }}>
                    This section needs research
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: '#a5b4fc', lineHeight: 1.5 }}>
                  The {section.heading} section has not been fully researched yet.
                  Please add relevant information to complete this section.
                </Text>
              </View>
            )}

            {processContent(section.content).map((item, i) => {
              if (item.type === 'heading1') {
                return <Text key={i} style={[styles.sectionHeading, { fontSize: 16 }]}>{item.text}</Text>;
              } else if (item.type === 'heading2') {
                return <Text key={i} style={styles.sectionHeading}>{item.text}</Text>;
              } else if (item.type === 'subheading') {
                return <Text key={i} style={styles.subHeading}>{item.text}</Text>;
              } else if (item.type === 'codeBlock') {
                return (
                  <View key={i} style={styles.codeBlock}>
                    <Text style={styles.codeText}>{item.text}</Text>
                  </View>
                );
              } else if (item.type === 'bullets') {
                return item.points.map((point, j) => {
                  const formattedPoint = renderFormattedText(point);
                  return (
                    <View key={`${i}-${j}`} style={styles.bulletPoint}>
                      <Text style={styles.bullet}>•</Text>
                      <View style={styles.bulletText}>{formattedPoint}</View>
                    </View>
                  );
                });
              } else {
                const formattedText = renderFormattedText(item.text);
                if (item.isPlaceholder) {
                  return (
                    <View key={i} style={[styles.paragraph, {
                      backgroundColor: '#1a2234',
                      borderRadius: 4,
                      padding: 10,
                      borderLeftWidth: 3,
                      borderLeftColor: '#6366f1'
                    }]}>
                      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                        <View style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: '#6366f1',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 8
                        }}>
                          <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>!</Text>
                        </View>
                        <Text style={{fontSize: 11, fontWeight: 'bold', color: '#a5b4fc'}}>
                          Research Needed
                        </Text>
                      </View>
                      <Text style={{fontSize: 11, color: '#94a3b8', lineHeight: 1.5}}>
                        {item.text.includes('Research needed') ? item.text : `${item.text}\n\nResearch guidance: ${getSectionGuidance(section.heading)}`}
                      </Text>
                    </View>
                  );
                }
                return <View key={i} style={styles.paragraph}>{formattedText}</View>;
              }
            })}

            <Footer pageNumber={index + 2} totalPages={totalPages} />
          </Page>
        );})
      }

      {/* End Page with logos */}
      <EndPage partner={partner} />
    </Document>
  );
};

export default ResearchPDF;
