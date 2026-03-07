import { IsString, IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';
import { MetodoPagoInstructor, ConceptoPago } from '@prisma/client';

export class CreatePagoInstructorDto {
  @IsString()
  instructorId: string;

  @IsString()
  @IsOptional()
  alumnoId?: string;

  @IsString()
  @IsOptional()
  alumnoExternoNombre?: string;

  @IsString()
  @IsOptional()
  alumnoExternoTelefono?: string;

  @IsString()
  @IsOptional()
  reservaId?: string;

  @IsInt()
  monto: number;

  @IsEnum(MetodoPagoInstructor)
  metodoPago: MetodoPagoInstructor;

  @IsEnum(ConceptoPago)
  @IsOptional()
  concepto?: ConceptoPago;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  fecha: string;

  @IsInt()
  @IsOptional()
  numeroRecibo?: number;
}
