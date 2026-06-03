import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          socket: {
            host:
              configService.get<string>('REDIS_HOST', { infer: true }) ??
              'localhost',
            port:
              configService.get<number>('REDIS_PORT', { infer: true }) ?? 6379,
          },
        });
        await client.connect();
        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
