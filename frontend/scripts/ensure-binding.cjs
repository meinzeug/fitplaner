const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getPlatformSuffix() {
  const platform = process.platform;
  const arch = process.arch;

  const isMusl = () => {
    try {
      const ldd = execSync('ldd --version', { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
      return !ldd.includes('GLIBC') && !ldd.includes('GNU');
    } catch {
      return false;
    }
  };

  if (platform === 'linux') {
    const libc = isMusl() ? 'musl' : 'gnu';
    if (arch === 'x64') return `linux-x64-${libc}`;
    if (arch === 'arm64') return `linux-arm64-${libc}`;
    if (arch === 'arm') return 'linux-arm-gnueabihf';
  } else if (platform === 'darwin') {
    if (arch === 'arm64') return 'darwin-arm64';
    if (arch === 'x64') return 'darwin-x64';
  } else if (platform === 'win32') {
    if (arch === 'x64') return 'win32-x64-msvc';
    if (arch === 'arm64') return 'win32-arm64-msvc';
  }
  return null;
}

function ensureBindings() {
  const suffix = getPlatformSuffix();
  if (!suffix) return;

  const nodeModulesDir = path.resolve(__dirname, '..', 'node_modules');
  const packagesToInstall = [];

  const rolldownPkg = `@rolldown/binding-${suffix}`;
  if (!fs.existsSync(path.join(nodeModulesDir, '@rolldown', `binding-${suffix}`))) {
    packagesToInstall.push(rolldownPkg);
  }

  const oxlintPkg = `@oxlint/binding-${suffix}`;
  if (!fs.existsSync(path.join(nodeModulesDir, '@oxlint', `binding-${suffix}`))) {
    packagesToInstall.push(oxlintPkg);
  }

  if (packagesToInstall.length > 0) {
    console.log(`[FitPlaner] Installing required native bindings: ${packagesToInstall.join(', ')}...`);
    try {
      execSync(`npm install --no-save ${packagesToInstall.join(' ')}`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
      });
    } catch (err) {
      console.warn('[FitPlaner] Could not install native bindings:', err.message);
    }
  }
}

ensureBindings();
