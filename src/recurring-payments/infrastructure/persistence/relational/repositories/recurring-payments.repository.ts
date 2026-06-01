import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RecurringPaymentsEntity } from '../entities/recurring-payments.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { RecurringPayments } from '../../../../domain/recurring-payments';
import { RecurringPaymentsRepository } from '../../recurring-payments.repository';
import { RecurringPaymentsMapper } from '../mappers/recurring-payments.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class RecurringPaymentsRelationalRepository implements RecurringPaymentsRepository {
  constructor(
    @InjectRepository(RecurringPaymentsEntity)
    private readonly recurringPaymentsRepository: Repository<RecurringPaymentsEntity>,
  ) {}

  async create(data: RecurringPayments): Promise<RecurringPayments> {
    const persistenceModel = RecurringPaymentsMapper.toPersistence(data);
    const newEntity = await this.recurringPaymentsRepository.save(
      this.recurringPaymentsRepository.create(persistenceModel),
    );
    return RecurringPaymentsMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<RecurringPayments[]> {
    const entities = await this.recurringPaymentsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => RecurringPaymentsMapper.toDomain(entity));
  }

  async findDuePayments(date: Date): Promise<RecurringPayments[]> {
    const qb = this.recurringPaymentsRepository.createQueryBuilder('rp');
    const entities = await qb
      .leftJoinAndSelect('rp.user', 'user')
      .leftJoinAndSelect('rp.account', 'account')
      .leftJoinAndSelect('rp.category', 'category')
      .where('rp.isActive = :isActive', { isActive: true })
      .andWhere('rp.nextExecuteDate <= :date', { date })
      .getMany();

    return entities.map((entity) => RecurringPaymentsMapper.toDomain(entity));
  }

  async findById(
    id: RecurringPayments['id'],
  ): Promise<NullableType<RecurringPayments>> {
    const entity = await this.recurringPaymentsRepository.findOne({
      where: { id },
    });

    return entity ? RecurringPaymentsMapper.toDomain(entity) : null;
  }

  async findByIds(
    ids: RecurringPayments['id'][],
  ): Promise<RecurringPayments[]> {
    const entities = await this.recurringPaymentsRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => RecurringPaymentsMapper.toDomain(entity));
  }

  async update(
    id: RecurringPayments['id'],
    payload: Partial<RecurringPayments>,
  ): Promise<RecurringPayments> {
    const entity = await this.recurringPaymentsRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.recurringPaymentsRepository.save(
      this.recurringPaymentsRepository.create(
        RecurringPaymentsMapper.toPersistence({
          ...RecurringPaymentsMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return RecurringPaymentsMapper.toDomain(updatedEntity);
  }

  async remove(id: RecurringPayments['id']): Promise<void> {
    await this.recurringPaymentsRepository.delete(id);
  }
}
