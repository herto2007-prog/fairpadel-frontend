import { Module } from '@nestjs/common';
import { InstructoresService } from './instructores.service';
import { InstructoresController } from './instructores.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstructoresController],
  providers: [InstructoresService],
  exports: [InstructoresService],
})
export class InstructoresModule {}
