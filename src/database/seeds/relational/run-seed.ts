import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from './role/role-seed.service';
import { SeedModule } from './seed.module';
import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';

const runSeed = async () => {
  console.log('Starting Database Seeding Process...');

  console.log('Bootstrapping SeedModule...');
  const app = await NestFactory.create(SeedModule);

  console.log('Running Role Seed...');
  await app.get(RoleSeedService).run();
  console.log('Role Seed Completed!');

  console.log('Running Status Seed...');
  await app.get(StatusSeedService).run();
  console.log('Status Seed Completed!');

  console.log('Running User Seed...');
  await app.get(UserSeedService).run();
  console.log('User Seed Completed!');

  await app.close();
  console.log('All Seeding Tasks Finished Successfully!');
};

void runSeed();
