import { Controller, Get, Param } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  findAll() {
    return this.tournamentsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tournamentsService.findById(id);
  }
}
