import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { SedesModule } from './modules/sedes/sedes.module';
import { AlquileresModule } from './modules/alquileres/alquileres.module';
import { InstructoresModule } from './modules/instructores/instructores.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    TournamentsModule,
    SedesModule,
    AlquileresModule,
    InstructoresModule,
  ],
})
export class AppModule {}
