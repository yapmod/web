import {readFile, writeFile} from 'node:fs/promises';

// Sync the version from package.json to both Chrome and Firefox manifests.
// This ensures all three version sources stay consistent after changelogen bumps package.json.

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const version = packageJson.version;

if (!version) {
  console.error('No version found in package.json');
  process.exit(1);
}

const chromeManifest = JSON.parse(await readFile('src/chrome/manifest.json', 'utf8'));
const firefoxManifest = JSON.parse(await readFile('src/firefox/manifest.json', 'utf8'));

chromeManifest.version = version;
firefoxManifest.version = version;

await writeFile('src/chrome/manifest.json', JSON.stringify(chromeManifest, null, 2) + '\n');
await writeFile('src/firefox/manifest.json', JSON.stringify(firefoxManifest, null, 2) + '\n');

console.log(`Synced version ${version} to chrome and firefox manifests`);
