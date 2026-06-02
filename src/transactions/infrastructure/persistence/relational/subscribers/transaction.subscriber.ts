import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  SoftRemoveEvent,
  UpdateEvent,
  EntityManager,
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
    const amount = entity.amount || 0;

    return entity.type === 1 ? amount : -amount;
  }

  private async updateAccountBalance(
    manager: EntityManager,
    accountId: string,
    delta: number,
  ) {
    if (delta === 0) return;

    const account = await manager.findOneBy(AccountEntity, { id: accountId });
    if (account) {
      account.balance += delta;
      await manager.save(account);
    }
  }

  async afterInsert(event: InsertEvent<TransactionEntity>) {
    if (!event.entity || !event.entity.account) return;
    const value = this.getTransactionValue(event.entity);
    await this.updateAccountBalance(
      event.manager,
      event.entity.account.id,
      value,
    );
  }

  async afterUpdate(event: UpdateEvent<TransactionEntity>) {
    if (!event.entity || !event.databaseEntity) return;

    const oldAccountId = event.databaseEntity.account?.id;
    const newAccountId = event.entity.account?.id || oldAccountId;

    const oldValue = this.getTransactionValue(event.databaseEntity);
    const mergedEntity = Object.assign(
      {},
      event.databaseEntity,
      event.entity,
    ) as TransactionEntity;
    const newValue = this.getTransactionValue(mergedEntity);

    if (oldAccountId === newAccountId) {
      if (oldAccountId) {
        await this.updateAccountBalance(
          event.manager,
          oldAccountId,
          newValue - oldValue,
        );
      }
    } else {
      if (oldAccountId) {
        await this.updateAccountBalance(event.manager, oldAccountId, -oldValue);
      }
      if (newAccountId) {
        await this.updateAccountBalance(event.manager, newAccountId, newValue);
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
    await this.updateAccountBalance(
      event.manager,
      event.databaseEntity.account.id,
      -value,
    );
  }
}
