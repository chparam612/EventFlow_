const fs = require('fs');
const files = [
  'src/panels/attendee/aiChat.js',
  'src/panels/attendee/index.js',
  'src/panels/control/dashboard.js',
  'src/panels/staff/dashboard.js'
];
for(let f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
}
