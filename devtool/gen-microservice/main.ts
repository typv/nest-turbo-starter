import { input } from '@inquirer/prompts';
import { cp, readdir, readFile, rename, writeFile } from 'fs/promises';
import { camelCase, kebabCase, snakeCase, startCase } from 'lodash';
import { basename, dirname, join } from 'path';

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

    // Placeholder name used inside the boilerplate template
    const PLACEHOLDER = 'boiler-plate';

    const templateNames = {
      camelCase: camelCase(PLACEHOLDER), // boilerPlate
      pascalCase: startCase(camelCase(PLACEHOLDER)).replace(/ /g, ''), // BoilerPlate
      upperCase: snakeCase(PLACEHOLDER).toUpperCase(), // BOILER_PLATE
      kebabCase: kebabCase(PLACEHOLDER), // boiler-plate
      snakeCase: snakeCase(PLACEHOLDER), // boiler_plate
      titleCase: startCase(PLACEHOLDER), // Boiler Plate
    };

    const names = {
      camelCase: camelCase(name), // e.g. myService
      pascalCase: startCase(camelCase(name)).replace(/ /g, ''), // e.g. MyService
      upperCase: snakeCase(name).toUpperCase(), // e.g. MY_SERVICE
      kebabCase: kebabCase(name), // e.g. my-service
      snakeCase: snakeCase(name), // e.g. my_service
      titleCase: startCase(name), // e.g. My Service
    };

    const templateDir = 'devtool/gen-microservice/boiler-plate-service';
    const destDir = join('apps', `${names.kebabCase}-service`);

    // ── Step 1: Copy boilerplate template → apps/<name> ──────────────────
    console.log(`\n📁  Copying template → ${destDir}`);
    await cp(templateDir, destDir, { recursive: true });

    // ── Step 2: Rename files and directories inside the destination ───────
    console.log('\n🔁  Renaming paths...');
    await this.renamePaths(destDir, templateNames.kebabCase, names.kebabCase);

    // ── Step 3: Replace name patterns inside every file's content ─────────
    console.log('\n📝  Replacing file contents...');
    await this.replaceFileContents(destDir, templateNames, names);

    console.log(`\n✅  Microservice "${names.kebabCase}" generated at ${destDir}`);
  }

  parseOptions(val: string): string {
    return val;
  }

  /**
   * Recursively renames every file and directory under `basePath`
   * whose name contains `from`, replacing all occurrences of `from` with `to`.
   * Traversal is bottom-up so parent dirs are renamed after their children.
   */
  private async renamePaths(basePath: string, from: string, to: string): Promise<void> {
    const entries = await readdir(basePath, { withFileTypes: true });

    // Recurse into subdirectories first (bottom-up)
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await this.renamePaths(join(basePath, entry.name), from, to);
      }
    }

    // Rename entries at the current level
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

  /**
   * Recursively walks all files under `dir` and replaces every occurrence
   * of each template name variant with the corresponding new name variant.
   *
   * @param dir           - Directory to walk
   * @param templateNames - Map of { camelCase, pascalCase, ... } for the placeholder
   * @param names         - Map of { camelCase, pascalCase, ... } for the new service name
   */
  private async replaceFileContents(
    dir: string,
    templateNames: Record<string, string>,
    names: Record<string, string>,
  ): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.replaceFileContents(fullPath, templateNames, names);
        continue;
      }

      let content = await readFile(fullPath, 'utf-8');
      let modified = false;

      for (const key of Object.keys(templateNames)) {
        const oldToken = templateNames[key];
        const newToken = names[key];
        if (oldToken && newToken && content.includes(oldToken)) {
          content = content.replaceAll(oldToken, newToken);
          modified = true;
        }
      }

      if (modified) {
        await writeFile(fullPath, content, 'utf-8');
        console.log(`  📝  ${entry.name}`);
      }
    }
  }
}

(async function bootstrap() {
  const generator = new GenerateMicroservice();
  await generator.run(process.argv.slice(2));
})();
