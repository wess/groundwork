import fse from "fs-extra";
import nunjucks from "nunjucks";

// Configure Nunjucks without templates directory since we'll pass content directly
nunjucks.configure({ autoescape: false });

export async function ensureDir(dirPath: string) {
  await fse.ensureDir(dirPath);
}

export async function renderTemplate(
  templateContent: string, // Template content as string
  outputPath: string, // absolute path to write
  data: Record<string, any>,
) {
  // Render the template with data
  const rendered = nunjucks.renderString(templateContent, data);
  await fse.writeFile(outputPath, rendered, "utf8");
}
