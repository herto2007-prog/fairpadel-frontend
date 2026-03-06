import { IsString, IsOptional, IsDateString, IsDecimal, IsInt, Min } from 'class-validator';

export class UpdateTournamentDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsOptional()
  nombre?: string;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsOptional()
  descripcion?: string;

  @IsDateString({}, { message: 'La fecha de inicio no es válida' })
  @IsOptional()
  fechaInicio?: string;

  @IsDateString({}, { message: 'La fecha de fin no es válida' })
  @IsOptional()
  fechaFin?: string;

  @IsDateString({}, { message: 'La fecha límite de inscripción no es válida' })
  @IsOptional()
  fechaLimiteInscr?: string;

  @IsString({ message: 'La ciudad debe ser texto' })
  @IsOptional()
  ciudad?: string;

  @IsString({ message: 'El país debe ser texto' })
  @IsOptional()
  pais?: string;

  @IsDecimal({}, { message: 'El costo de inscripción debe ser un número' })
  @IsOptional()
  costoInscripcion?: string;

  @IsInt({ message: 'Los minutos por partido deben ser un número entero' })
  @Min(30, { message: 'Mínimo 30 minutos por partido' })
  @IsOptional()
  minutosPorPartido?: number;
}
