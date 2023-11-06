import { Module } from '@nestjs/common';
import * as controllers from './controllers';

import { DatabaseModule } from '../database/database.module';
import { DomainListener } from './domain.listener';
import { SystemModule } from '../system/system.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from "./entities";
import { TokenListener } from './token.listener';

const Entities = TypeOrmModule.forFeature(Object.values(entities));

@Module({
  imports: [Entities, DatabaseModule, SystemModule],
  controllers: Object.values(controllers),
  providers: [
    DomainListener, TokenListener
  ],
  exports: [Entities]
})
export class DomainModule {}
