import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tournament.findMany({
      where: { estado: 'PUBLICADO' },
      include: {
        sede: true,
        organizador: {
          select: { id: true, nombre: true, apellido: true },
        },
        categorias: {
          include: { category: true },
        },
      },
      orderBy: { fechaInicio: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.tournament.findUnique({
      where: { id },
      include: {
        sede: true,
        organizador: {
          select: { id: true, nombre: true, apellido: true },
        },
        categorias: {
          include: { category: true },
        },
        sedes: {
          include: { sede: true },
        },
        canchas: {
          include: { sedeCancha: true },
        },
      },
    });
  }
}
