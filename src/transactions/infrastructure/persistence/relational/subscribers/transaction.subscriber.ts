import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  SoftRemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { TransactionEntity } from '../entities/transaction.entity';
import { AccountEntity } from '../../../../../accounts/infrastructure/persistence/relational/entities/account.entity';

@EventSubscriber()
export class TransactionSubscriber implements EntitySubscriberInterface<TransactionEntity> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return TransactionEntity;
  }

  private getTransactionValue(entity: TransactionEntity | undefined): number {
    if (!entity) return 0;
    const amount = Number(entity.amount) || 0;

    return entity.type === 1 ? amount : -amount;
  }

  async afterInsert(event: InsertEvent<TransactionEntity>) {
    if (!event.entity || !event.entity.account) return;

    const value = this.getTransactionValue(event.entity);
    if (value === 0) return;

    await event.manager
      .createQueryBuilder()
      .update(AccountEntity)
      .set({ balance: () => `balance + ${value}` })
      .where('id = :id', { id: event.entity.account.id })
      .execute();
  }

  async afterUpdate(event: UpdateEvent<TransactionEntity>) {
    if (!event.entity || !event.databaseEntity) return;

    const oldAccountId = event.databaseEntity.account?.id;

    let newAccountId = oldAccountId;
    if (event.entity.account && event.entity.account.id) {
      newAccountId = event.entity.account.id;
    }

    const oldValue = this.getTransactionValue(event.databaseEntity);

    const mergedEntity = Object.assign(
      {},
      event.databaseEntity,
      event.entity,
    ) as TransactionEntity;
    const newValue = this.getTransactionValue(mergedEntity);

    if (oldAccountId === newAccountId) {
      const delta = newValue - oldValue;
      if (delta !== 0) {
        await event.manager
          .createQueryBuilder()
          .update(AccountEntity)
          .set({ balance: () => `balance + ${delta}` })
          .where('id = :id', { id: oldAccountId })
          .execute();
      }
    } else {
      if (oldAccountId) {
        await event.manager
          .createQueryBuilder()
          .update(AccountEntity)
          .set({ balance: () => `balance - ${oldValue}` })
          .where('id = :id', { id: oldAccountId })
          .execute();
      }

      if (newAccountId) {
        await event.manager
          .createQueryBuilder()
          .update(AccountEntity)
          .set({ balance: () => `balance + ${newValue}` })
          .where('id = :id', { id: newAccountId })
          .execute();
      }
    }
  }

  async afterRemove(event: RemoveEvent<TransactionEntity>) {
    await this.handleRemove(event);
  }

  async afterSoftRemove(event: SoftRemoveEvent<TransactionEntity>) {
    await this.handleRemove(event);
  }

  private async handleRemove(
    event: RemoveEvent<TransactionEntity> | SoftRemoveEvent<TransactionEntity>,
  ) {
    if (!event.databaseEntity || !event.databaseEntity.account) return;

    const value = this.getTransactionValue(event.databaseEntity);
    if (value === 0) return;

    await event.manager
      .createQueryBuilder()
      .update(AccountEntity)
      .set({ balance: () => `balance - ${value}` })
      .where('id = :id', { id: event.databaseEntity.account.id })
      .execute();
  }
}
