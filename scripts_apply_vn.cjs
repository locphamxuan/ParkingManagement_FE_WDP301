/* Apply VN->EN dictionary across src.
 * SAFE: only replaces a key when it is a COMPLETE quoted string literal
 * ('x' / "x" / `x`) or a COMPLETE JSX text node (>x<). Never partial substrings,
 * so short keys cannot corrupt longer untranslated strings. */
const fs = require('fs'), path = require('path');
const dict = JSON.parse(fs.readFileSync('scripts_vn_dict.json', 'utf8'));
const entries = Object.entries(dict).filter(([k, v]) => v && v !== k).sort((a, b) => b[0].length - a[0].length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const root = 'src';
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})(root);
let totalReplacements = 0;
const hitKeys = new Set();
for (const f of files) {
  let txt = fs.readFileSync(f, 'utf8');
  let orig = txt;
  for (const [k, v] of entries) {
    const ek = esc(k);
    // quoted literal, same opening/closing quote (escape the quote char inside v)
    txt = txt.replace(new RegExp("(['\"`])" + ek + "\\1", 'g'), (m, q) => {
      hitKeys.add(k); totalReplacements++;
      const safe = v.replace(/\\/g, '\\\\').split(q).join('\\' + q);
      return q + safe + q;
    });
    // JSX text node (allow surrounding whitespace)
    txt = txt.replace(new RegExp(">\\s*" + ek + "\\s*<", 'g'), () => {
      hitKeys.add(k); totalReplacements++; return '>' + v + '<';
    });
  }
  if (txt !== orig) fs.writeFileSync(f, txt, 'utf8');
}
console.log('Replacements: ' + totalReplacements + ' | distinct keys used: ' + hitKeys.size + '/' + entries.length);
