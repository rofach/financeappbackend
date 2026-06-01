import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { Post } from '@nestjs/common';

@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'currencies',
  version: '1',
})
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.currenciesService.findAll();
  }

  @Get('rates/:base')
  @HttpCode(HttpStatus.OK)
  async getRates(@Param('base') base: string): Promise<Record<string, number>> {
    return this.currenciesService.getExchangeRates(base);
  }

  @Post('sync')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  async syncCurrencies() {
    return this.currenciesService.syncCurrencies();
  }
}
