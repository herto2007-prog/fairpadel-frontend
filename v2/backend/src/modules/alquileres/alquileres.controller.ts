import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AlquileresService } from './alquileres.service';
import { CreateAlquilerConfigDto } from './dto/create-alquiler-config.dto';
import { CreateReservaDto, ConfirmarReservaDto, CancelarReservaDto } from './dto/create-reserva.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('alquileres')
export class AlquileresController {
  constructor(private readonly alquileresService: AlquileresService) {}

  // ============ CONFIGURACIÓN ============

  @Post('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador', 'encargado')
  crearConfig(@Body() createDto: CreateAlquilerConfigDto) {
    return this.alquileresService.crearConfig(createDto);
  }

  @Get('config/:sedeId')
  obtenerConfig(@Param('sedeId') sedeId: string) {
    return this.alquileresService.obtenerConfig(sedeId);
  }

  // ============ DISPONIBILIDAD ============

  @Get('disponibilidad')
  consultarDisponibilidad(
    @Query('sedeId') sedeId: string,
    @Query('fecha') fecha: string,
    @Query('canchaId') canchaId?: string,
  ) {
    return this.alquileresService.consultarDisponibilidad(sedeId, fecha, canchaId);
  }

  // ============ RESERVAS PÚBLICAS ============

  @Post('reservas')
  crearReserva(@Body() createDto: CreateReservaDto, @Request() req) {
    const userId = req.user?.id || null;
    return this.alquileresService.crearReserva(userId, createDto);
  }

  // ============ RESERVAS AUTENTICADAS ============

  @Get('mis-reservas')
  @UseGuards(JwtAuthGuard)
  obtenerMisReservas(@Request() req) {
    return this.alquileresService.obtenerMisReservas(req.user.id);
  }

  @Post('reservas/:id/confirmar')
  @UseGuards(JwtAuthGuard)
  confirmarReserva(
    @Param('id') reservaId: string,
    @Body() confirmarDto: ConfirmarReservaDto,
    @Request() req,
  ) {
    return this.alquileresService.confirmarReserva(reservaId, confirmarDto, req.user.id);
  }

  @Post('reservas/:id/cancelar')
  @UseGuards(JwtAuthGuard)
  cancelarReserva(
    @Param('id') reservaId: string,
    @Body() cancelarDto: CancelarReservaDto,
    @Request() req,
  ) {
    return this.alquileresService.cancelarReserva(reservaId, cancelarDto, req.user.id);
  }

  // ============ GESTIÓN ENCARGADO ============

  @Get('sede/:sedeId/reservas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador', 'encargado')
  obtenerReservasSede(
    @Param('sedeId') sedeId: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.alquileresService.obtenerReservasSede(sedeId, fecha);
  }

  @Post('reservas/:id/aprobar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador', 'encargado')
  aprobarReserva(@Param('id') reservaId: string) {
    return this.alquileresService.aprobarReserva(reservaId);
  }

  @Post('reservas/:id/rechazar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador', 'encargado')
  rechazarReserva(
    @Param('id') reservaId: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.alquileresService.rechazarReserva(reservaId, motivo);
  }
}
