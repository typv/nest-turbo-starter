import { hashData, Role } from '@app/common';
import { EntityManager } from '@mikro-orm/core';
import chalk from 'chalk';
import { Command, CommandRunner, InquirerService, Option } from 'nest-commander';
import { User, UserRepository } from 'src/data-access/user';
import { commandConstants, questionConstants } from './command.constant';

@Command({
  name: commandConstants.createAdmin,
  description: 'Create a system admin',
  arguments: '[email] [password]',
})
export class CreateAdminCommand extends CommandRunner {
  constructor(
    private readonly inquirer: InquirerService,
    private readonly userRepo: UserRepository,
    private readonly em: EntityManager,
  ) {
    super();
  }

  async run(): Promise<void> {
    const em = this.em.fork();

    const answers = await this.inquirer.prompt<{
      email: string;
      password: string;
    }>(questionConstants.createAdmin, undefined);
    const email = answers.email.trim();
    const pass = answers.password.trim();

    const hasAccount = await em.findOne(User, { email });
    if (hasAccount) {
      console.log(chalk.red('CreateAdminCommand Error: Email already exist.'));
      return;
    }

    // Password hashing
    const passwordHash = await hashData(pass);
    try {
      const userData = {
        email: email,
        password: passwordHash,
        fullName: 'ADMIN',
        isActive: true,
        emailVerified: true,
        role: Role.Admin,
      };
      const newAdmin = em.create(User, userData);
      await em.persistAndFlush(newAdmin);
      console.log(chalk.green('Create admin successfully.'));
    } catch (err) {
      console.log(chalk.green('CreateAdminCommand Error: '), err);
    }
  }

  @Option({
    flags: '-s, --shell <shell>',
  })
  parseShell(val: string) {
    return val;
  }
}
