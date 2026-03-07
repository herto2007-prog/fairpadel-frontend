import { Module } from '@nestjs/common';
import { AlquileresService } from './alquileres.service';
import { AlquileresController } from './alquileres.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlquileresController],
  providers: [AlquileresService],
  exports: [AlquileresService],
})
export class AlquileresModule {}
