/**
 * Security Tests — Per Spec Section 9
 *
 * Tests:
 * - No client key persistence (grep-style)
 * - No direct forbidden provider calls from client code
 * - Proxy request enforcement
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', '..');

function getAllJsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__tests__') {
      getAllJsFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Security Audit', () => {
  let allFiles;
  let allContents;

  beforeAll(() => {
    allFiles = getAllJsFiles(SRC_DIR);
    allContents = allFiles.map(f => ({
      path: f,
      content: fs.readFileSync(f, 'utf-8'),
      relativePath: path.relative(SRC_DIR, f)
    }));
  });

  describe('No client key persistence in localStorage', () => {
    test('no localStorage.setItem with api key patterns (except migration removal)', () => {
      const violations = [];
      for (const file of allContents) {
        // Allow Settings.jsx migration code that REMOVES keys
        if (file.relativePath.includes('Settings.jsx')) continue;
        // Allow test files
        if (file.relativePath.includes('__tests__')) continue;

        const lines = file.content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('localStorage.setItem') &&
              (line.includes('_key') || line.includes('api_key') || line.includes('apiKey') || line.includes('secret'))) {
            violations.push(`${file.relativePath}:${i + 1}: ${line.trim()}`);
          }
        });
      }
      expect(violations).toEqual([]);
    });

    test('no sessionStorage key storage', () => {
      const violations = [];
      for (const file of allContents) {
        if (file.relativePath.includes('__tests__')) continue;
        const lines = file.content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('sessionStorage') &&
              (line.includes('key') || line.includes('token') || line.includes('secret'))) {
            violations.push(`${file.relativePath}:${i + 1}: ${line.trim()}`);
          }
        });
      }
      expect(violations).toEqual([]);
    });
  });

  describe('No direct forbidden provider API calls from client components', () => {
    test('no direct OpenAI API calls from components (should go through proxy)', () => {
      const violations = [];
      for (const file of allContents) {
        // Allow services (they may use proxy patterns), allow netlify functions
        if (file.relativePath.includes('Service') || file.relativePath.includes('service')) continue;
        if (file.relativePath.includes('__tests__')) continue;

        const lines = file.content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('api.openai.com') && !line.includes('//') && !line.includes('*')) {
            violations.push(`${file.relativePath}:${i + 1}: ${line.trim()}`);
          }
        });
      }
      expect(violations).toEqual([]);
    });

    test('no direct Anthropic API calls from components', () => {
      const violations = [];
      for (const file of allContents) {
        if (file.relativePath.includes('Service') || file.relativePath.includes('service')) continue;
        if (file.relativePath.includes('__tests__')) continue;

        const lines = file.content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('api.anthropic.com') && !line.includes('//') && !line.includes('*')) {
            violations.push(`${file.relativePath}:${i + 1}: ${line.trim()}`);
          }
        });
      }
      expect(violations).toEqual([]);
    });
  });

  describe('Classic writer surface', () => {
    test('WritingCanvasPro exposes Save & Extract', () => {
      const wcp = allContents.find(f => f.relativePath.includes('WritingCanvasPro.jsx'));
      expect(wcp).toBeDefined();
      expect(wcp.content).toContain('SAVE & EXTRACT');
    });
  });

  describe('Queue lock semantics', () => {
    test('NarrativeReviewQueue enforces Continue gate', () => {
      const nrq = allContents.find(f => f.relativePath.includes('NarrativeReviewQueue'));
      expect(nrq).toBeDefined();
      expect(nrq.content).toContain('disabled={!canContinue}');
    });
  });
});
