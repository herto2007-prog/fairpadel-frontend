import { IsString, IsDateString, IsOptional } from 'class-validator';

export class ConsultarDisponibilidadDto {
  @IsString()
  sedeId: string;

  @IsDateString()
  fecha: string;

  @IsString()
  @IsOptional()
  sedeCanchaId?: string;
}

export class CrearAlquilerPrecioDto {
  @IsString()
  sedeId: string;

  @IsString()
  tipoCancha: string;

  @IsString()
  tipoDia: string;

  @IsString()
  franja: string;

  @IsString()
  precio: number;
}
