import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { type Booking, CreateBookingSchema } from '@handoff/contracts';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(): Promise<Booking[]> {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Booking> {
    return this.bookingsService.findOne(id);
  }

  @Post()
  create(@Body() body: unknown): Promise<Booking> {
    const result = CreateBookingSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.bookingsService.create(result.data);
  }
}
