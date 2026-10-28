import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RentalClient } from './rental-client';
import { SameOriginGuard } from './auth/same-origin.guard';
// Explicit routes prevent the gateway from exposing internal endpoints or acting
// as a general proxy. Credentials/identity headers from callers are not forwarded.
@Controller()
@UseGuards(SameOriginGuard)
export class RentalGatewayController {
  constructor(private readonly rental: RentalClient) {}
  @Get([
    'vehicles',
    'vehicles/:id',
    'locations',
    'geocode',
    'quote',
    'catalog',
    'terms',
    'bookings',
    'bookings/:id',
    'bookings/:id/email',
  ])
  async read(@Req() request: Request, @Res() response: Response) {
    await this.respond(request, response);
  }
  @Post('bookings')
  async create(@Req() request: Request, @Res() response: Response) {
    await this.respond(request, response);
  }
  private async respond(request: Request, response: Response) {
    const result = await this.rental.forward(request);
    response.setHeader('Cache-Control', 'no-store');
    response.status(result.status).json(result.body);
  }
}
