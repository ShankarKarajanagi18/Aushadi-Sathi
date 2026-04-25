const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '..', 'src', 'features');
const targetDir = path.resolve(__dirname, '..', 'public', 'features');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function syncHtmlFiles() {
  ensureDir(targetDir);

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.html')) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    fs.copyFileSync(sourcePath, targetPath);
    copiedCount += 1;
  }

  console.log(`[sync-feature-html] Synced ${copiedCount} HTML files to public/features`);
}

syncHtmlFiles();
