import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

/** Reduce iCloud Drive sync thrash when the repo lives under ~/Documents. */
if (process.platform !== 'darwin') {
  process.exit(0);
}

const IGNORE_XATTR = 'com.apple.fileprovider.ignore#1';

function ignoreFromIcloud(dir) {
  if (!existsSync(dir)) return;
  try {
    writeFileSync(`${dir}/.nosync`, '');
  } catch {
    // ignore
  }
  try {
    execFileSync('xattr', ['-w', IGNORE_XATTR, '1', dir], { stdio: 'ignore' });
  } catch {
    // ignore (non-iCloud volume, permissions, etc.)
  }
}

ignoreFromIcloud('node_modules');
ignoreFromIcloud('.next');
