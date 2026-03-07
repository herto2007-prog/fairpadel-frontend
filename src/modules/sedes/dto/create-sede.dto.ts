import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  nombre: string;

  @IsString()
  ciudad: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  mapsUrl?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}
