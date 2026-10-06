import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { API_DEFAULT_VERSION } from '../../common/utils/configure-app.js';
import type { User } from '../../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AppointmentsService } from './appointments.service.js';
import type {
  AppointmentListResponseDto,
  AppointmentResponseDto,
} from './dto/appointment-response.dto.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { QueryAppointmentDto } from './dto/query-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'appointments', version: API_DEFAULT_VERSION })
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query() query: QueryAppointmentDto,
  ): Promise<AppointmentListResponseDto> {
    return this.appointmentsService.findAll(user, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.update(user, id, dto);
  }
}
