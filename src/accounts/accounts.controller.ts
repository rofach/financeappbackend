import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './domain/account';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'accounts',
  version: '1',
})
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<Account> {
    return this.accountsService.create(request.user.id, createAccountDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Request() request): Promise<Account[]> {
    return this.accountsService.findAll(request.user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Request() request, @Param('id') id: string): Promise<Account> {
    return this.accountsService.findOne(request.user.id, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    return this.accountsService.update(request.user.id, id, updateAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() request, @Param('id') id: string): Promise<void> {
    return this.accountsService.remove(request.user.id, id);
  }
}
