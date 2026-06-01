import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyRepository } from './infrastructure/persistence/currency.repository';
import { Currency } from './domain/currency';
import { NullableType } from '../utils/types/nullable.type';
import { CurrencyRateEntity } from './infrastructure/persistence/relational/entities/currency-rate.entity';

@Injectable()
export class CurrenciesService {
  constructor(
    private readonly currencyRepository: CurrencyRepository,
    @InjectRepository(CurrencyRateEntity)
    private readonly currencyRateRepository: Repository<CurrencyRateEntity>,
  ) {}

  create(currency: Currency): Promise<Currency> {
    return this.currencyRepository.create(currency);
  }

  findByCode(code: string): Promise<NullableType<Currency>> {
    return this.currencyRepository.findByCode(code);
  }

  findAll(): Promise<Currency[]> {
    return this.currencyRepository.findMany();
  }

  async getExchangeRates(baseCode: string): Promise<Record<string, number>> {
    const uppercaseBase = baseCode.toUpperCase();
    const cacheDuration = 3 * 24 * 60 * 60 * 1000;

    const cachedRate = await this.currencyRateRepository.findOne({
      where: { baseCode: uppercaseBase },
    });

    if (cachedRate) {
      const age = Date.now() - new Date(cachedRate.updatedAt).getTime();
      if (age < cacheDuration) {
        return cachedRate.rates;
      }
    }

    try {
      const apiKey = process.env.CURRENCY_API_KEY;
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${uppercaseBase}`,
      );

      const data = await response.json();

      if (data.result === 'success' && data.conversion_rates) {
        const rates = data.conversion_rates;

        const rateRecord = this.currencyRateRepository.create({
          baseCode: uppercaseBase,
          rates,
          updatedAt: new Date(),
        });

        await this.currencyRateRepository.save(rateRecord);
        return rates;
      } else {
        throw new Error(
          data['error-type'] || 'Failed to retrieve conversion rates',
        );
      }
    } catch (error) {
      console.error(error);

      if (cachedRate) {
        return cachedRate.rates;
      }

      throw new Error(
        `Failed to fetch live exchange rates for ${uppercaseBase}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async syncCurrencies(): Promise<{ message: string; count: number }> {
    const apiKey = process.env.CURRENCY_API_KEY;
    if (!apiKey) {
      throw new Error(
        'CURRENCY_API_KEY is not defined in environment variables',
      );
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/codes`,
    );
    const data = await response.json();

    if (data.result !== 'success' || !data.supported_codes) {
      throw new Error(
        data['error-type'] || 'Failed to retrieve currency codes',
      );
    }

    const currenciesToUpsert: Currency[] = data.supported_codes.map(
      ([code, name]: [string, string]) => {
        return {
          code,
          name,
        } as Currency;
      },
    );

    await this.currencyRepository.upsertMany(currenciesToUpsert);

    return {
      message: 'Currencies synced successfully',
      count: currenciesToUpsert.length,
    };
  }
}
