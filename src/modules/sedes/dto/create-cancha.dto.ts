import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { TipoCancha } from '@prisma/client';

export class CreateCanchaDto {
  @IsString()
  nombre: string;

  @IsEnum(TipoCancha)
  @IsOptional()
  tipo?: TipoCancha;

  @IsBoolean()
  @IsOptional()
  tieneLuz?: boolean;

  @IsBoolean()
  @IsOptional()
  cubierta?: boolean;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}
