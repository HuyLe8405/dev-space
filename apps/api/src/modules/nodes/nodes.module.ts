import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';
import { NodeRelationshipsController } from './node-relationships.controller';
import { NodeRelationshipsService } from './node-relationships.service';

@Module({
  imports: [PrismaModule],
  controllers: [NodesController, NodeRelationshipsController],
  providers: [NodesService, NodeRelationshipsService],
  exports: [NodesService, NodeRelationshipsService],
})
export class NodesModule {}
