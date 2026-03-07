import { IsString, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { TournamentStatus } from '@prisma/client';

export class CreateTournamentDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsDateString()
  fechaLimiteInscripcion: string;

  @IsString()
  ciudad: string;

  @IsNumber()
  costoInscripcion: number;

  @IsEnum(TournamentStatus)
  @IsOptional()
  estado?: TournamentStatus;

  @IsString()
  @IsOptional()
  sedeId?: string;
}
