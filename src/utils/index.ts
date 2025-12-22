import * as fs from 'fs';
import * as path from 'path';

export function getAvailableHowToResources(): string[] {
  const howToDir = path.join(process.cwd(), 'src', 'resources', 'how-to');
  try {
    const files = fs.readdirSync(howToDir);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  } catch {
    return [];
  }
}

export async function readMarkdownFromDirectory(directory: string, filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'src', 'resources', directory, `${filename}.md`);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return `Resource '${filename}' not found in ${directory} directory.`;
  }
}

export async function readAllMarkdownFromDirectories(directories: string[]): Promise<string> {
  let content = '';

  for (const directory of directories) {
    const dirPath = path.join(process.cwd(), 'src', 'resources', directory);

    try {
      const files = fs.readdirSync(dirPath);
      const mdFiles = files.filter(file => file.endsWith('.md'));

      for (const file of mdFiles) {
        const filePath = path.join(dirPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        content += `\n\n## ${file.replace('.md', '').replace(/-/g, ' ').toUpperCase()}\n\n${fileContent}`;
      }
    } catch (error) {
      content += `\n\n## ${directory.toUpperCase()} - Directory not found\n\n`;
    }
  }

  return content || 'No content found in specified directories.';
}
