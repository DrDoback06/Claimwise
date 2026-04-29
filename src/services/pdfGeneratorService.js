/**
 * PDF Story Bible Generator Service
 * Generates downloadable PDF documents from story data
 * 
 * Uses a simple HTML-to-PDF approach that works in the browser
 */

class PDFGeneratorService {
  constructor() {
    this.styles = this.getDefaultStyles();
  }

  /**
   * Get default PDF styles
   */
  getDefaultStyles() {
    return `
      @page {
        margin: 1in;
        size: A4;
      }
      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #1a1a1a;
        max-width: 100%;
      }
      .title-page {
        text-align: center;
        padding-top: 3in;
        page-break-after: always;
      }
      .title {
        font-size: 36pt;
        font-weight: bold;
        margin-bottom: 0.5in;
        color: #2d3748;
      }
      .subtitle {
        font-size: 14pt;
        color: #718096;
        font-style: italic;
      }
      .section {
        page-break-before: always;
      }
      .section-title {
        font-size: 24pt;
        font-weight: bold;
        color: #2d3748;
        border-bottom: 2px solid #4a5568;
        padding-bottom: 0.2in;
        margin-bottom: 0.5in;
      }
      .item {
        margin-bottom: 0.4in;
        padding-left: 0.2in;
        border-left: 3px solid #e2e8f0;
      }
      .item-name {
        font-size: 14pt;
        font-weight: bold;
        color: #2d3748;
        margin-bottom: 0.1in;
      }
      .item-meta {
        font-size: 10pt;
        color: #718096;
        margin-bottom: 0.1in;
      }
      .item-description {
        font-size: 11pt;
        color: #4a5568;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.1in;
        font-size: 10pt;
        margin-top: 0.1in;
        padding: 0.1in;
        background: #f7fafc;
        border-radius: 4px;
      }
      .stat-item {
        padding: 0.05in;
      }
      .stat-key {
        font-weight: bold;
        color: #2d3748;
      }
      .stat-value {
        color: #38a169;
      }
      .toc {
        page-break-after: always;
      }
      .toc-title {
        font-size: 20pt;
        font-weight: bold;
        margin-bottom: 0.5in;
      }
      .toc-item {
        margin: 0.1in 0;
        font-size: 12pt;
      }
      .toc-item a {
        text-decoration: none;
        color: #2d3748;
      }
      @media print {
        .no-print {
          display: none;
        }
      }
    `;
  }

  /**
   * Generate HTML content from sections
   */
  generateHTML(sections, title = 'Story Bible') {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>${this.styles}</style>
      </head>
      <body>
    `;

    sections.forEach((section, index) => {
      switch (section.type) {
        case 'title':
          html += this.renderTitlePage(section);
          break;
        case 'toc':
          html += this.renderTableOfContents(section);
          break;
        case 'section':
          html += this.renderSection(section, index);
          break;
        case 'text':
          html += this.renderTextBlock(section);
          break;
        default:
          break;
      }
    });

    html += `
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Render title page
   */
  renderTitlePage(section) {
    return `
      <div class="title-page">
        <div class="title">${this.escapeHtml(section.content)}</div>
        ${section.subtitle ? `<div class="subtitle">${this.escapeHtml(section.subtitle)}</div>` : ''}
      </div>
    `;
  }

  /**
   * Render table of contents
   */
  renderTableOfContents(section) {
    let html = `
      <div class="toc">
        <div class="toc-title">Table of Contents</div>
    `;

    section.items?.forEach((item, i) => {
      html += `<div class="toc-item">${i + 1}. ${this.escapeHtml(item.title)}</div>`;
    });

    html += '</div>';
    return html;
  }

  /**
   * Render a section with items
   */
  renderSection(section, index) {
    let html = `
      <div class="section" id="section-${index}">
        <div class="section-title">${this.escapeHtml(section.title)}</div>
    `;

    section.items?.forEach(item => {
      html += this.renderItem(item);
    });

    html += '</div>';
    return html;
  }

  /**
   * Render an individual item
   */
  renderItem(item) {
    let html = `
      <div class="item">
        <div class="item-name">${this.escapeHtml(item.name)}</div>
    `;

    // Meta information
    const meta = [];
    if (item.role) meta.push(item.role);
    if (item.type) meta.push(item.type);
    if (item.rarity) meta.push(item.rarity);

    if (meta.length > 0) {
      html += `<div class="item-meta">${meta.map(m => this.escapeHtml(m)).join(' • ')}</div>`;
    }

    // Description
    if (item.description) {
      html += `<div class="item-description">${this.escapeHtml(item.description)}</div>`;
    }

    // Stats (for characters)
    if (item.stats && Object.keys(item.stats).length > 0) {
      html += '<div class="stats-grid">';
      Object.entries(item.stats).forEach(([key, value]) => {
        html += `
          <div class="stat-item">
            <span class="stat-key">${this.escapeHtml(key)}:</span>
            <span class="stat-value">${value}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Render a text block
   */
  renderTextBlock(section) {
    return `
      <div class="text-block">
        ${section.title ? `<h2>${this.escapeHtml(section.title)}</h2>` : ''}
        <p>${this.escapeHtml(section.content)}</p>
      </div>
    `;
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate and download PDF
   * Uses print-to-PDF functionality
   */
  async generatePDF(sections, filename = 'story-bible.pdf') {
    const html = this.generateHTML(sections, filename.replace('.pdf', ''));
    
    // Create a new window with the content
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups for this site.');
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load
    await new Promise(resolve => {
      printWindow.onload = resolve;
      setTimeout(resolve, 1000); // Fallback timeout
    });

    // Trigger print dialog (user saves as PDF)
    printWindow.print();

    // Note: We can't programmatically save as PDF from browser
    // User will use the print dialog to "Save as PDF"
    
    return true;
  }

  /**
   * Generate HTML preview (for in-app viewing)
   */
  generatePreview(sections) {
    return this.generateHTML(sections);
  }

  /**
   * Download as HTML file (alternative to PDF)
   */
  downloadAsHTML(sections, filename = 'story-bible.html') {
    const html = this.generateHTML(sections);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  }

  /**
   * Quick export - generates story bible from world state
   */
  async quickExport(worldState) {
    const sections = [];

    // Title
    sections.push({
      type: 'title',
      content: 'Story Bible',
      subtitle: `Generated ${new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`
    });

    // Characters
    if (worldState.actors?.length > 0) {
      sections.push({
        type: 'section',
        title: 'Characters',
        items: worldState.actors.map(actor => ({
          name: actor.name,
          role: actor.class || 'Unknown',
          description: actor.biography || actor.desc || 'No biography available.',
          stats: actor.baseStats
        }))
      });
    }

    // Items (notable only)
    const notableItems = worldState.itemBank?.filter(i => 
      i.rarity && i.rarity !== 'Common'
    ) || [];
    
    if (notableItems.length > 0) {
      sections.push({
        type: 'section',
        title: 'Notable Items',
        items: notableItems.map(item => ({
          name: item.name,
          type: item.type,
          rarity: item.rarity,
          description: item.desc || 'No description.'
        }))
      });
    }

    // Skills
    if (worldState.skillBank?.length > 0) {
      sections.push({
        type: 'section',
        title: 'Skills & Abilities',
        items: worldState.skillBank.map(skill => ({
          name: skill.name,
          type: skill.type || 'Skill',
          description: skill.desc || 'No description.'
        }))
      });
    }

    // Story Structure
    if (worldState.books && Object.keys(worldState.books).length > 0) {
      const chapters = [];
      Object.values(worldState.books).forEach(book => {
        book.chapters?.forEach(ch => {
          chapters.push({
            name: `Book ${book.id} - ${ch.title}`,
            description: ch.desc || 'No synopsis available.'
          });
        });
      });

      if (chapters.length > 0) {
        sections.push({
          type: 'section',
          title: 'Story Structure',
          items: chapters
        });
      }
    }

    return sections;
  }
}

// Export singleton instance
const pdfGeneratorService = new PDFGeneratorService();
export default pdfGeneratorService;
