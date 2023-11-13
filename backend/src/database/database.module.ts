import 'pg';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './typeorm-config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'default',
      imports: [],
      inject: [TypeOrmConfigService],
      useClass: TypeOrmConfigService,
    }),
  ],
  providers: [TypeOrmConfigService],
})
export class DatabaseModule {}
