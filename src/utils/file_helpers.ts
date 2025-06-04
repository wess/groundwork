import fse from 'fs-extra';
import path from 'path';
import nunjucks from 'nunjucks';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Ensure Nunjucks is configured to look into our `templates` folder
nunjucks.configure(TEMPLATES_DIR, { autoescape: false });

export async function ensureDir(dirPath: string) {
  await fse.ensureDir(dirPath);
}

export async function renderTemplate(
  templateName: string,  // e.g. 'schema.njk'
  outputPath: string,    // absolute path to write
  data: Record<string, any>
) {
  // Render the template with data
  const rendered = nunjucks.render(templateName, data);
  await fse.writeFile(outputPath, rendered, 'utf8');
}