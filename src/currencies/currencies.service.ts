import { Injectable, Inject } from '@nestjs/common';

import { CurrencyRepository } from './infrastructure/persistence/currency.repository';
import { Currency } from './domain/currency';
import { NullableType } from '../utils/types/nullable.type';

import { CURRENCY_CACHE_TIME_SECONDS } from '../utils/cache.constants';

@Injectable()
export class CurrenciesService {
  constructor(
    private readonly currencyRepository: CurrencyRepository,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
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
    const cacheKey = `exchange_rates_${uppercaseBase}`;

    const cached = await this.redisClient.get(cacheKey);
    const redisCachedRates = cached ? JSON.parse(cached) : null;
    if (redisCachedRates) {
      return redisCachedRates;
    }

    try {
      const apiKey = process.env.CURRENCY_API_KEY;
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${uppercaseBase}`,
      );

      const data = await response.json();

      if (data.result === 'success' && data.conversion_rates) {
        const rates = data.conversion_rates;

        await this.redisClient.set(cacheKey, JSON.stringify(rates), {
          EX: CURRENCY_CACHE_TIME_SECONDS,
        });

        return rates;
      } else {
        throw new Error('Failed to retrieve conversion rates');
      }
    } catch (error) {
      console.error(error);
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
      throw new Error('Failed to retrieve currency codes');
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
