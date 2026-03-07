import { IsString, IsOptional, IsDateString, IsInt, IsEnum } from 'class-validator';
import { TipoClase } from '@prisma/client';

export class CreateReservaInstructorDto {
  @IsString()
  instructorId: string;

  @IsEnum(TipoClase)
  tipo: TipoClase;

  @IsDateString()
  fecha: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsInt()
  @IsOptional()
  duracionMinutos?: number;

  @IsInt()
  precio: number;

  @IsString()
  @IsOptional()
  mensaje?: string;
}

export class ConfirmarReservaInstructorDto {
  @IsString()
  @IsOptional()
  respuesta?: string;
}

export class CancelarReservaInstructorDto {
  @IsString()
  @IsOptional()
  motivo?: string;
}
