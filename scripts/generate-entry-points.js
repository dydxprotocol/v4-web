import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const currentPath = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(currentPath);
const templateFilePath = path.resolve(projectRoot, '../template.html');
const entryPointsDir = path.resolve(projectRoot, '../entry-points');

const ENTRY_POINTS = [
    {
        title: 'dYdX',
        description: 'dYdX',
        fileName: 'index.html',
    },
];

try {
    fs.mkdir(entryPointsDir, { recursive: true });

    for (const entryPoint of ENTRY_POINTS) {
        const html = await fs.readFile(templateFilePath, 'utf-8');
        const destinationFilePath = path.resolve(entryPointsDir, entryPoint.fileName);
        const injectedHtml = html.replace(
            '<title>dYdX</title>',
            `<title>${entryPoint.title}</title>\n    <meta name="description" content="${entryPoint.description}" />`
        );
        await fs.writeFile(destinationFilePath, injectedHtml, 'utf-8');
    }
} catch (err) {
    console.error('Error generating entry points:', err);
}
