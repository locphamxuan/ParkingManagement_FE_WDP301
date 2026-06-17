const fs = require('fs'), path = require('path');
const root = 'src';
const VN = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂÂÊÔƠƯĐ]/;
const files = [];
(function walk(d){
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})(root);
const set = new Map();
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const re = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = re.exec(txt))) {
    const s = m[2];
    if (VN.test(s)) set.set(s, (set.get(s) || 0) + 1);
  }
  const jsx = />\s*([^<>{}]*?[àáảãạăâêôơưđÀÂĂÊÔƠƯĐếệịọụ][^<>{}]*?)\s*</g;
  let j;
  while ((j = jsx.exec(txt))) {
    const s = j[1].trim();
    if (s && VN.test(s)) set.set(s, (set.get(s) || 0) + 1);
  }
}
const arr = [...set.entries()].sort((a, b) => b[1] - a[1]);
console.log('TOTAL UNIQUE: ' + arr.length);
for (const [s, c] of arr) console.log(c + '\t' + s.replace(/\n/g, ' '));
