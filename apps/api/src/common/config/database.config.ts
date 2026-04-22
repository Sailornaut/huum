import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'huum'),
  password: configService.get<string>('DATABASE_PASSWORD', 'huum_secret'),
  database: configService.get<string>('DATABASE_NAME', 'huum'),
  autoLoadEntities: true,
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
});
