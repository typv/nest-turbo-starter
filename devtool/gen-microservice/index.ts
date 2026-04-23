import { input } from '@inquirer/prompts';
import { camelCase, kebabCase, snakeCase, startCase } from 'lodash';

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
      camelCase: camelCase(name),                                  // e.g. myService
      pascalCase: startCase(camelCase(name)).replace(/ /g, ''),    // e.g. MyService
      upperCase: snakeCase(name).toUpperCase(),                    // e.g. MY_SERVICE
      kebabCase: kebabCase(name),                                  // e.g. my-service
    };

    console.log('\n✅ Microservice name variants:');
    console.log(`  camelCase  : ${names.camelCase}`);
    console.log(`  PascalCase : ${names.pascalCase}`);
    console.log(`  UPPER_CASE : ${names.upperCase}`);
    console.log(`  kebab-case : ${names.kebabCase}`);

    // TODO: generate microservice files using `names`
  }

  parseOptions(val: string): string {
    return val;
  }
}

(async function bootstrap() {
  const generator = new GenerateMicroservice();
  await generator.run(process.argv.slice(2));
})();
