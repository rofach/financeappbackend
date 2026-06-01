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
} from '@nestjs/common';
import { RecurringPaymentsService } from './recurring-payments.service';
import { CreateRecurringPaymentsDto } from './dto/create-recurring-payments.dto';
import { UpdateRecurringPaymentsDto } from './dto/update-recurring-payments.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RecurringPayments } from './domain/recurring-payments';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Recurringpayments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'recurring-payments',
  version: '1',
})
export class RecurringPaymentsController {
  constructor(
    private readonly recurringPaymentsService: RecurringPaymentsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: RecurringPayments,
  })
  create(
    @Body() createRecurringPaymentsDto: CreateRecurringPaymentsDto,
    @Request() req,
  ) {
    return this.recurringPaymentsService.create(
      createRecurringPaymentsDto,
      req.user.id,
    );
  }

  @Get()
  @ApiOkResponse({
    type: [RecurringPayments],
  })
  findAll() {
    return this.recurringPaymentsService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: RecurringPayments,
  })
  findById(@Param('id') id: string) {
    return this.recurringPaymentsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: RecurringPayments,
  })
  update(
    @Param('id') id: string,
    @Body() updateRecurringPaymentsDto: UpdateRecurringPaymentsDto,
    @Request() req,
  ) {
    return this.recurringPaymentsService.update(
      id,
      updateRecurringPaymentsDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.recurringPaymentsService.remove(id, req.user.id);
  }
}
