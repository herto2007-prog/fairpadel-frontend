import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InstructoresService } from './instructores.service';
import { CreateSolicitudInstructorDto } from './dto/create-solicitud.dto';
import { CreateReservaInstructorDto, ConfirmarReservaInstructorDto, CancelarReservaInstructorDto } from './dto/create-reserva-instructor.dto';
import { CreatePagoInstructorDto } from './dto/create-pago.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('instructores')
export class InstructoresController {
  constructor(private readonly instructoresService: InstructoresService) {}

  // ============ PÚBLICO ============

  @Get()
  obtenerInstructores(@Query('ciudad') ciudad?: string) {
    return this.instructoresService.obtenerInstructores(ciudad);
  }

  @Get(':id')
  obtenerInstructor(@Param('id') id: string) {
    return this.instructoresService.obtenerInstructor(id);
  }

  // ============ SOLICITUDES ============

  @Post('solicitudes')
  @UseGuards(JwtAuthGuard)
  crearSolicitud(@Body() createDto: CreateSolicitudInstructorDto, @Request() req) {
    return this.instructoresService.crearSolicitud(req.user.id, createDto);
  }

  @Get('solicitudes/my')
  @UseGuards(JwtAuthGuard)
  obtenerMisSolicitudes(@Request() req) {
    return this.instructoresService.obtenerMisSolicitudes(req.user.id);
  }

  @Get('solicitudes/pendientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  obtenerSolicitudesPendientes() {
    return this.instructoresService.obtenerSolicitudesPendientes();
  }

  @Post('solicitudes/:id/aprobar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  aprobarSolicitud(@Param('id') id: string) {
    return this.instructoresService.aprobarSolicitud(id);
  }

  @Post('solicitudes/:id/rechazar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  rechazarSolicitud(@Param('id') id: string, @Body('motivo') motivo?: string) {
    return this.instructoresService.rechazarSolicitud(id, motivo);
  }

  // ============ RESERVAS ============

  @Post('reservas')
  @UseGuards(JwtAuthGuard)
  crearReserva(@Body() createDto: CreateReservaInstructorDto, @Request() req) {
    return this.instructoresService.crearReserva(req.user.id, createDto);
  }

  @Get('reservas/my')
  @UseGuards(JwtAuthGuard)
  obtenerMisReservasComoAlumno(@Request() req) {
    return this.instructoresService.obtenerMisReservasComoAlumno(req.user.id);
  }

  // ============ PANEL INSTRUCTOR ============

  @Get('panel/mi-perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  obtenerMiPerfil(@Request() req) {
    return this.instructoresService.obtenerMiPerfil(req.user.id);
  }

  @Patch('panel/mi-perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  actualizarPerfil(@Body() data: any, @Request() req) {
    return this.instructoresService.actualizarPerfil(req.user.id, data);
  }

  @Post('reservas/:id/confirmar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  confirmarReserva(
    @Param('id') id: string,
    @Body() confirmarDto: ConfirmarReservaInstructorDto,
    @Request() req,
  ) {
    return this.instructoresService.confirmarReserva(id, req.user.id, confirmarDto);
  }

  @Post('reservas/:id/cancelar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  cancelarReserva(
    @Param('id') id: string,
    @Body() cancelarDto: CancelarReservaInstructorDto,
    @Request() req,
  ) {
    return this.instructoresService.cancelarReserva(id, req.user.id, cancelarDto);
  }

  @Post('reservas/:id/completar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  completarReserva(
    @Param('id') id: string,
    @Body('asistio') asistio: boolean,
    @Request() req,
  ) {
    return this.instructoresService.completarReserva(id, req.user.id, asistio);
  }

  // ============ PAGOS ============

  @Post('pagos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  registrarPago(@Body() createDto: CreatePagoInstructorDto, @Request() req) {
    return this.instructoresService.registrarPago(req.user.id, createDto);
  }

  @Get('pagos/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  obtenerMisPagos(@Request() req) {
    return this.instructoresService.obtenerMisPagos(req.user.id);
  }
}
