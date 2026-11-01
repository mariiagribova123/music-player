const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('the interface is permanently dark and exposes no theme switch', () => {
  const html = read('index.html');
  const app = read('app.js');
  const styles = read('style.css');

  assert.doesNotMatch(html, /theme-toggle|theme\.css|Светлая тема/);
  assert.doesNotMatch(app, /themeToggle|dataset\.theme/);
  assert.match(styles, /:root\s*\{[^}]*color-scheme\s*:\s*dark/);
  assert.equal(fs.existsSync(path.join(root, 'theme.css')), false);
});
