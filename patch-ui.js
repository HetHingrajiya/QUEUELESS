const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'src', 'app', 'admin');

const MODULE_MAP = {
  'offices': 'offices',
  'services': 'services',
  'counters': 'counters',
  'staff': 'staff',
  'priority-rules': 'priorityRules',
  'holidays': 'holidays',
  'reports': 'reports',
  'notifications': 'notifications',
  'settings': 'settings'
};

function processPage(filePath, moduleName) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip files that don't need changes or already have them
  if (content.includes('getUserMatrix') || !content.includes('getUserFromCookie')) return;

  // 1. Add getUserMatrix import
  content = content.replace(/(import\s*{\s*getUserFromCookie\s*}\s*from\s*'@\/lib\/auth';)/, "$1\nimport { getUserMatrix } from '@/lib/rbac';");
  if (!content.includes('getUserMatrix')) {
     content = content.replace(/(import\s+.*from\s+'@\/lib\/auth';)/, "$1\nimport { getUserMatrix } from '@/lib/rbac';");
  }

  // 2. Add auth and matrix lookup
  const authBlockRegex = /(const\s+user\s*=\s*await\s+getUserFromCookie\(\);\s*if\s*\(!user[^\n]*\n)/;
  content = content.replace(authBlockRegex, `$1  const matrix = await getUserMatrix(user);\n  const perms = matrix?.['${moduleName}'] || { view: false, add: false, modify: false, delete: false };\n\n  if (!perms.view) {\n    redirect('/admin/dashboard');\n  }\n\n`);

  // 3. Condition Add buttons
  content = content.replace(/(<Link\s+href="[^"]*\/add">\s*<Button)/g, `{perms.add && (\n        $1`);
  content = content.replace(/(Add.*?<\/Button>\s*<\/Link>)/g, `$1\n      )}`);

  // 4. Condition Edit buttons
  content = content.replace(/(<Link\s+href=\{?[^}]*\/edit`?\}>\s*<Button[^>]*>\s*<Edit)/g, `{perms.modify && (\n                          $1`);
  content = content.replace(/(<Edit.*?<\/Button>\s*<\/Link>)/g, `$1\n                        )}`);

  // 5. Condition Delete buttons
  content = content.replace(/(<DeleteButton[^>]*\/>)/g, `{perms.delete && (\n                          $1\n                        )}`);

  // 6. Handle empty actions
  content = content.replace(/({perms\.delete\s*&&\s*\([\s\S]*?<DeleteButton[^>]*\/>\n\s*\)})\n\s*<\/div>/, `$1\n                        {!perms.modify && !perms.delete && (\n                          <span className="text-xs text-slate-400">No actions</span>\n                        )}\n                      </div>`);

  fs.writeFileSync(filePath, content);
  console.log(`Updated UI ${filePath}`);
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file === 'page.tsx') {
      const parts = fullPath.split(path.sep);
      let moduleMatch = null;
      for (const [folder, moduleName] of Object.entries(MODULE_MAP)) {
        if (parts.includes(folder)) {
          moduleMatch = moduleName;
          break;
        }
      }
      if (moduleMatch && !fullPath.includes('add') && !fullPath.includes('edit')) {
        processPage(fullPath, moduleMatch);
      }
    }
  }
}

walkDir(PAGES_DIR);
console.log('Done!');
