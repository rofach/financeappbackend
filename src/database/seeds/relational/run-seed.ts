import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { RoleSeedService } from './role/role-seed.service';
import { SeedModule } from './seed.module';
import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';

const runSeed = async () => {
  const logger = new Logger('Seed');
  logger.log('Starting Database Seeding Process...');

  logger.log('Bootstrapping SeedModule...');
  const app = await NestFactory.create(SeedModule);

  logger.log('Running Role Seed...');
  await app.get(RoleSeedService).run();
  logger.log('Role Seed Completed!');

  logger.log('Running Status Seed...');
  await app.get(StatusSeedService).run();
  logger.log('Status Seed Completed!');

  logger.log('Running User Seed...');
  await app.get(UserSeedService).run();
  logger.log('User Seed Completed!');

  await app.close();
  logger.log('All Seeding Tasks Finished Successfully!');
};

void runSeed();
