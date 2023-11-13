import { Module } from '@nestjs/common';
import { EnvModule } from './env/env.module';
import { DatabaseModule } from './database/database.module';
import { SystemModule } from './system/system.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DomainModule } from './domains/domain.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    EnvModule,
    DatabaseModule,
    SystemModule,
    DomainModule,
  ],
})
export class AppModule {}
