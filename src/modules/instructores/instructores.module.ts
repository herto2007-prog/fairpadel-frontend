import { Module } from '@nestjs/common';
import { InstructoresService } from './instructores.service';
import { InstructoresController } from './instructores.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InstructoresController],
  providers: [InstructoresService],
  exports: [InstructoresService],
})
export class InstructoresModule {}
