import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'budgets',
  version: '1',
})
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Body() createBudgetDto: CreateBudgetDto, @Request() req) {
    return this.budgetsService.create(createBudgetDto, req.user.id);
  }

  @Get()
  findAll(@Request() req, @Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.budgetsService.findByCategoryId(req.user.id, categoryId);
    }
    return this.budgetsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.budgetsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Request() req,
  ) {
    return this.budgetsService.update(req.user.id, id, updateBudgetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.budgetsService.remove(req.user.id, id);
  }
}
