import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SedesService } from './sedes.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('sedes')
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Get()
  findAll(@Query('ciudad') ciudad?: string) {
    return this.sedesService.findAll(ciudad);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sedesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador')
  create(@Body() createSedeDto: CreateSedeDto) {
    return this.sedesService.create(createSedeDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador')
  update(@Param('id') id: string, @Body() updateSedeDto: UpdateSedeDto) {
    return this.sedesService.update(id, updateSedeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador')
  remove(@Param('id') id: string) {
    return this.sedesService.remove(id);
  }

  // ============ CANCHAS ============

  @Get(':id/canchas')
  findCanchas(@Param('id') sedeId: string) {
    return this.sedesService.findCanchasBySede(sedeId);
  }

  @Post(':id/canchas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador', 'encargado')
  createCancha(@Param('id') sedeId: string, @Body() createCanchaDto: CreateCanchaDto) {
    return this.sedesService.createCancha(sedeId, createCanchaDto);
  }

  @Patch('canchas/:canchaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador', 'encargado')
  updateCancha(@Param('canchaId') canchaId: string, @Body() updateCanchaDto: Partial<CreateCanchaDto>) {
    return this.sedesService.updateCancha(canchaId, updateCanchaDto);
  }

  @Delete('canchas/:canchaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizador', 'encargado')
  removeCancha(@Param('canchaId') canchaId: string) {
    return this.sedesService.removeCancha(canchaId);
  }
}
