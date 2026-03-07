import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSolicitudInstructorDto {
  @IsInt()
  experienciaAnios: number;

  @IsString()
  @IsOptional()
  certificaciones?: string;

  @IsString()
  @IsOptional()
  especialidades?: string;

  @IsString()
  @IsOptional()
  nivelesEnsenanza?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsOptional()
  precioIndividual?: number;

  @IsInt()
  @IsOptional()
  precioGrupal?: number;

  @IsString()
  @IsOptional()
  ciudades?: string;
}
