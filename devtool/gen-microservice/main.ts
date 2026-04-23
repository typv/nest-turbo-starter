import { input } from '@inquirer/prompts';
import { camelCase, kebabCase, snakeCase, startCase } from 'lodash';
import { readdir, rename } from 'fs/promises';
import { join, dirname, basename } from 'path';

export class GenerateMicroservice {
  constructor() {}

  async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
    const serviceName = await input({
      message: 'What is the name of your microservice?',
      validate: (value) => {
        if (!value.trim()) {
          return 'Microservice name cannot be empty.';
        }
        if (!/^[a-z][a-z0-9-]*$/.test(value.trim())) {
          return 'Name must be lowercase, start with a letter, and contain only letters, numbers, or hyphens.';
        }
        return true;
      },
    });


    const name = serviceName.trim();

    const names = {
      camelCase: camelCase(name), // e.g. myService
      pascalCase: startCase(camelCase(name)).replace(/ /g, ''), // e.g. MyService
      upperCase: snakeCase(name).toUpperCase(), // e.g. MY_SERVICE
      kebabCase: kebabCase(name), // e.g. my-service
      snakeCase: snakeCase(name), // e.g. my_service
      titleCase: startCase(name), // e.g. My Service
    };
    console.log(names)

    // TODO: generate microservice files using `names`
    const templatePath = 'devtool/gen-microservice/product-service';
    await this.renamePaths(templatePath, 'product', names.kebabCase);

    // Rename the root input path itself — must be last
    const rootName = basename(templatePath);
    if (rootName.includes('product')) {
      const newRoot = join(dirname(templatePath), rootName.replaceAll('product', names.kebabCase));
      await rename(templatePath, newRoot);
      console.log(`  ✏️  ${rootName}  →  ${basename(newRoot)}`);
    }
  }

  parseOptions(val: string): string {
    return val;
  }

  /**
   * Recursively renames every file and directory under `basePath`
   * whose name contains `from`, replacing all occurrences of `from` with `to`.
   *
   * Traversal is **bottom-up** (deepest entries first) so that
   * renaming a parent directory does not invalidate its children's paths.
   *
   * @param basePath - Root directory to start renaming from
   * @param from     - Substring to search for in each entry name (e.g. "product")
   * @param to       - Replacement substring (e.g. "boiler-plate")
   *
   * @example
   * await renamePaths('devtool/gen-microservice/product-service', 'product', 'boiler-plate');
   * // product.controller.ts   → boiler-plate.controller.ts
   * // product-service/        → boiler-plate-service/
   */
   private async renamePaths(
    basePath: string,
    from: string,
    to: string,
  ): Promise<void> {
    const entries = await readdir(basePath, { withFileTypes: true });
  
    // 1. Recurse into subdirectories first so children are renamed before parents
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await this.renamePaths(join(basePath, entry.name), from, to);
      }
    }
  
    // 2. Rename files and directories at the current level
    for (const entry of entries) {
      if (entry.name.includes(from)) {
        const oldPath = join(basePath, entry.name);
        const newName = entry.name.replaceAll(from, to);
        const newPath = join(basePath, newName);
  
        await rename(oldPath, newPath);
        console.log(`  ✏️  ${entry.name}  →  ${newName}`);
      }
    }
  }
}

(async function bootstrap() {
  const generator = new GenerateMicroservice();
  await generator.run(process.argv.slice(2));
})();
