const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'src', 'app', 'api');

const MODULE_MAP = {
  'organizations': 'organizations',
  'offices': 'offices',
  'services': 'services',
  'counters': 'counters',
  'staff': 'staff',
  'queue': 'queue',
  'tokens': 'tokens',
  'priority-rules': 'priorityRules',
  'working-hours': 'workingHours',
  'holidays': 'holidays',
  'analytics': 'analytics',
  'reports': 'reports',
  'notifications': 'notifications',
  'audit-logs': 'auditLogs',
  'system-settings': 'settings'
};

function processFile(filePath, moduleName) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (!content.includes('requirePermission')) {
    content = content.replace(/(import.*from.*@\/lib\/auditLogger.*)/, "$1\nimport { requirePermission } from '@/lib/rbac';");
    if (!content.includes('requirePermission')) {
      content = content.replace(/(import.*from.*@\/lib\/auth.*)/, "$1\nimport { requirePermission } from '@/lib/rbac';");
    }
  }

  const putPattern = /const\s+user\s*=\s*await\s+getUserFromCookie\(\);\s*if\s*\(!user\s*\|\|\s*\(user\.role\s*!==\s*'SUPER_ADMIN'\s*&&\s*user\.role\s*!==\s*'ADMIN'\)\)\s*{\s*return\s*NextResponse\.json\(\{\s*success:\s*false,\s*message:\s*'Unauthorized'\s*},\s*{\s*status:\s*403\s*}\);\s*}/g;

  // We map the HTTP method to CRUD action inside the replace by looking at the function it's in.
  // Actually, standardizing on replacing `getUserFromCookie()` auth blocks with `requirePermission`
  
  const replacements = [
    {
      regex: /export\s+async\s+function\s+POST[\s\S]*?(?:const\s+user\s*=\s*await\s+getUserFromCookie\(\);)\s*if\s*\(!user[\s\S]*?status:\s*403\s*}\);?\s*}/g,
      action: 'add'
    },
    {
      regex: /export\s+async\s+function\s+PUT[\s\S]*?(?:const\s+(?:user|currentUser)\s*=\s*await\s+getUserFromCookie\(\);)\s*if\s*\(!(?:user|currentUser)[\s\S]*?status:\s*403\s*}\);?\s*}/g,
      action: 'modify'
    },
    {
      regex: /export\s+async\s+function\s+DELETE[\s\S]*?(?:const\s+(?:user|currentUser)\s*=\s*await\s+getUserFromCookie\(\);)\s*if\s*\(!(?:user|currentUser)[\s\S]*?status:\s*403\s*}\);?\s*}/g,
      action: 'delete'
    }
  ];

  // For GET, we want to check for 'view' permission, but only block if not CITIZEN and unauthorized.
  // This is tricky to do safely via regex across all files.

  let newContent = content;
  for (const { regex, action } of replacements) {
    newContent = newContent.replace(regex, (match) => {
      // Find the auth check block inside the matched function and replace just that part
      return match.replace(
        /(const\s+(?:user|currentUser)\s*=\s*await\s+getUserFromCookie\(\);\s*if\s*\(!(?:user|currentUser)[\s\S]*?status:\s*403\s*}\);?\s*})/,
        `const user = await requirePermission('${moduleName}', '${action}');\n    if (!user) {\n      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });\n    }`
      );
    });
  }
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file === 'route.ts') {
      // Extract module from path
      const parts = fullPath.split(path.sep);
      let moduleMatch = null;
      for (const [folder, moduleName] of Object.entries(MODULE_MAP)) {
        if (parts.includes(folder)) {
          moduleMatch = moduleName;
          break;
        }
      }
      if (moduleMatch) {
        processFile(fullPath, moduleMatch);
      }
    }
  }
}

walkDir(API_DIR);
console.log('Done!');
