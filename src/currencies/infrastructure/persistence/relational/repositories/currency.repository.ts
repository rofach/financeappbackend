import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyEntity } from '../entities/currency.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Currency } from '../../../../domain/currency';
import { CurrencyRepository } from '../../currency.repository';
import { CurrencyMapper } from '../mappers/currency.mapper';

@Injectable()
export class CurrenciesRelationalRepository implements CurrencyRepository {
  constructor(
    @InjectRepository(CurrencyEntity)
    private readonly currenciesRepository: Repository<CurrencyEntity>,
  ) {}

  async create(data: Currency): Promise<Currency> {
    const persistenceModel = CurrencyMapper.toPersistence(data);
    const newEntity = await this.currenciesRepository.save(
      this.currenciesRepository.create(persistenceModel),
    );
    return CurrencyMapper.toDomain(newEntity);
  }

  async findByCode(code: string): Promise<NullableType<Currency>> {
    const entity = await this.currenciesRepository.findOne({
      where: { code },
    });

    return entity ? CurrencyMapper.toDomain(entity) : null;
  }

  async findMany(): Promise<Currency[]> {
    const entities = await this.currenciesRepository.find();
    return entities.map((entity) => CurrencyMapper.toDomain(entity));
  }

  async upsertMany(data: Currency[]): Promise<void> {
    const persistenceModels = data.map((d) => CurrencyMapper.toPersistence(d));
    await this.currenciesRepository.upsert(persistenceModels, ['code']);
  }
}
