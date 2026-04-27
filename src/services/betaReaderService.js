/**
 * Beta Reader Portal Service — New Feature B
 *
 * Allows authors to export selected chapters as a shareable read-only HTML bundle
 * with inline comment capability. Readers leave comments, download a JSON file,
 * and the author imports that file back as chapter annotations.
 */

import toastService from './toastService';

class BetaReaderService {
  /**
   * Export selected chapters as a standalone HTML file that beta readers can open.
   * The HTML file includes inline comment functionality (vanilla JS, no React).
   *
   * @param {Array} chapters - array of { id, title, content, bookTitle }
   * @param {string} authorName
   * @param {string} storyTitle
   * @returns {void} triggers browser download
   */
  exportChapters(chapters, authorName = 'Author', storyTitle = 'My Story') {
    if (!chapters || chapters.length === 0) {
      toastService.error('Select at least one chapter to export.');
      return null;
    }

    const chaptersHTML = chapters.map((ch, idx) => `
      <article class="chapter" id="chapter-${ch.id}">
        <h2 class="chapter-title">Chapter ${idx + 1}: ${this._escapeHtml(ch.title || 'Untitled')}</h2>
        ${ch.bookTitle ? `<div class="book-label">${this._escapeHtml(ch.bookTitle)}</div>` : ''}
        <div class="chapter-body">${this._contentToHtml(ch.content || ch.script || '')}</div>
      </article>
    `).join('\n');

    const token = `beta_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this._escapeHtml(storyTitle)} — Beta Read</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; background: #f9f6f0; color: #2c2c2c; line-height: 1.8; }
    .header { background: #1a1a2e; color: white; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
    .header h1 { font-size: 1.4rem; }
    .header .meta { font-size: 0.8rem; opacity: 0.7; }
    .export-btn { background: #4ade80; color: #1a1a2e; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
    .export-btn:hover { background: #22c55e; }
    .container { max-width: 720px; margin: 40px auto; padding: 0 24px 80px; }
    .chapter { margin-bottom: 60px; }
    .chapter-title { font-size: 1.6rem; margin-bottom: 6px; color: #1a1a2e; }
    .book-label { font-size: 0.8rem; color: #888; margin-bottom: 20px; }
    .chapter-body p { margin-bottom: 1em; }
    .chapter-body { font-size: 1.05rem; }

    /* Comment sidebar */
    .comment-trigger { display: none; background: #6366f1; color: white; border: none; border-radius: 3px; padding: 2px 7px; font-size: 0.7rem; cursor: pointer; margin-left: 4px; vertical-align: middle; }
    p:hover .comment-trigger { display: inline-block; }
    .selection-comment-bar { position: fixed; bottom: 20px; right: 20px; background: #1e1e3f; border: 1px solid #6366f1; border-radius: 10px; padding: 12px 16px; color: white; font-family: sans-serif; max-width: 360px; z-index: 200; display: none; }
    .selection-comment-bar textarea { width: 100%; background: #2a2a4a; border: 1px solid #4f4f8f; color: white; border-radius: 6px; padding: 8px; font-family: sans-serif; font-size: 0.85rem; margin-top: 8px; resize: vertical; }
    .selection-comment-bar .actions { display: flex; gap: 8px; margin-top: 8px; }
    .selection-comment-bar button { flex: 1; padding: 6px; border-radius: 5px; border: none; cursor: pointer; font-weight: bold; font-size: 0.8rem; }
    .btn-save { background: #6366f1; color: white; }
    .btn-cancel { background: #374151; color: #ccc; }
    .comment-pill { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 3px; padding: 1px 5px; font-size: 0.75rem; cursor: pointer; color: #92400e; margin: 0 2px; font-family: sans-serif; }
    .comments-count { background: #6366f1; color: white; border-radius: 50%; padding: 2px 7px; font-size: 0.75rem; font-family: sans-serif; margin-left: 6px; }
  </style>
</head>
<body>
<div class="header">
  <div>
    <h1>${this._escapeHtml(storyTitle)}</h1>
    <div class="meta">by ${this._escapeHtml(authorName)} · Beta Reader Copy · Token: ${token}</div>
  </div>
  <button class="export-btn" onclick="exportComments()">⬇ Export My Comments</button>
</div>
<div class="container">
  ${chaptersHTML}
</div>

<div class="selection-comment-bar" id="commentBar">
  <div style="font-weight:bold;font-size:0.9rem;">💬 Add Comment</div>
  <div id="commentContext" style="font-size:0.75rem;opacity:0.7;margin-top:4px;max-height:40px;overflow:hidden;"></div>
  <textarea id="commentText" rows="3" placeholder="Your comment..."></textarea>
  <div class="actions">
    <button class="btn-save" onclick="saveComment()">Save</button>
    <button class="btn-cancel" onclick="hideCommentBar()">Cancel</button>
  </div>
</div>

<script>
const TOKEN = '${token}';
let comments = [];
let pendingSelection = null;

document.addEventListener('mouseup', () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.toString().trim().length < 3) return;
  const text = sel.toString().trim();
  pendingSelection = {
    text,
    location: getSelectionLocation(sel),
  };
  document.getElementById('commentContext').textContent = '"' + text.slice(0, 80) + (text.length > 80 ? '...' : '') + '"';
  document.getElementById('commentText').value = '';
  document.getElementById('commentBar').style.display = 'block';
  document.getElementById('commentText').focus();
});

function getSelectionLocation(sel) {
  try {
    const range = sel.getRangeAt(0);
    let node = range.startContainer;
    while (node && node.tagName !== 'ARTICLE') node = node.parentNode;
    return node?.id || 'unknown';
  } catch(e) { return 'unknown'; }
}

function saveComment() {
  const text = document.getElementById('commentText').value.trim();
  if (!text || !pendingSelection) return;
  const comment = {
    id: 'c_' + Date.now(),
    selectedText: pendingSelection.text,
    chapterId: pendingSelection.location,
    comment: text,
    timestamp: new Date().toISOString(),
  };
  comments.push(comment);
  highlightSelection(pendingSelection.text);
  hideCommentBar();
  pendingSelection = null;
  updateCount();
}

function highlightSelection(text) {
  const pill = document.createElement('span');
  pill.className = 'comment-pill';
  pill.title = 'Click to view comment';
  pill.textContent = '💬';
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed) {
    try {
      const range = sel.getRangeAt(0);
      range.surroundContents(pill);
      sel.removeAllRanges();
    } catch(e) {}
  }
}

function hideCommentBar() {
  document.getElementById('commentBar').style.display = 'none';
  window.getSelection()?.removeAllRanges();
}

function updateCount() {
  document.title = comments.length > 0
    ? \`[\${comments.length} comments] ${this._escapeHtml(storyTitle)} — Beta Read\`
    : '${this._escapeHtml(storyTitle)} — Beta Read';
}

function exportComments() {
  const data = { token: TOKEN, storyTitle: '${this._escapeHtml(storyTitle)}', exportedAt: new Date().toISOString(), comments };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '${this._escapeHtml(storyTitle).replace(/\s+/g, '_')}_beta_comments.json';
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideCommentBar();
});
<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storyTitle.replace(/\s+/g, '_')}_beta_read.html`;
    a.click();
    URL.revokeObjectURL(url);

    toastService.success(`Exported ${chapters.length} chapter${chapters.length > 1 ? 's' : ''} for beta reading! Share the HTML file with your readers.`);
    return token;
  }

  /**
   * Import a beta reader comments JSON file and return structured annotations.
   * @param {File} file - the .json file from the beta reader
   * @returns {Promise<Array>} array of { id, selectedText, chapterId, comment, timestamp }
   */
  async importComments(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.comments || !Array.isArray(data.comments)) {
            reject(new Error('Invalid comments file format.'));
            return;
          }
          resolve(data.comments);
        } catch (err) {
          reject(new Error('Failed to parse comments file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }

  _escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  _contentToHtml(text) {
    return text
      .split('\n\n')
      .map(para => para.trim() ? `<p>${this._escapeHtml(para.replace(/\n/g, ' '))}</p>` : '')
      .filter(Boolean)
      .join('\n');
  }
}

const betaReaderService = new BetaReaderService();
export default betaReaderService;
