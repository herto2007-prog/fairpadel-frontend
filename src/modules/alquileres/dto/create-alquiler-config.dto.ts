import { IsString, IsOptional, IsBoolean, IsInt, IsEmail } from 'class-validator';

export class CreateAlquilerConfigDto {
  @IsString()
  sedeId: string;

  @IsString()
  @IsOptional()
  encargadoId?: string;

  @IsBoolean()
  @IsOptional()
  habilitado?: boolean;

  @IsBoolean()
  @IsOptional()
  requiereAprobacion?: boolean;

  @IsInt()
  @IsOptional()
  duracionSlotMinutos?: number;

  @IsInt()
  @IsOptional()
  anticipacionMaxDias?: number;

  @IsInt()
  @IsOptional()
  cancelacionMinHoras?: number;

  @IsString()
  @IsOptional()
  mensajeBienvenida?: string;

  @IsString()
  @IsOptional()
  telefonoNotificaciones?: string;

  @IsEmail()
  @IsOptional()
  emailNotificaciones?: string;
}
