import { readFile, writeFile } from 'node:fs/promises';
import { format } from 'oxfmt';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const options = JSON.parse(await readFile('.oxfmtrc.json', 'utf8'));
if (!version) throw new Error('No version found in package.json');

for (const browser of ['chrome', 'firefox']) {
  const path = `src/${browser}/manifest.json`;
  const source = await readFile(path, 'utf8');
  const manifest = { ...JSON.parse(source), version };
  const { code, errors } = await format(path, JSON.stringify(manifest), options);
  if (errors.length) throw new Error(`Could not format ${path}: ${errors[0].message}`);
  if (code !== source) await writeFile(path, code);
}

console.log(`Synced version ${version} to Chrome and Firefox manifests`);
