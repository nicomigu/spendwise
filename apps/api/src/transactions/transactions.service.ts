import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TenantContext } from '../common/tenant/tenant.context';
import { UserRole } from '../common/enums';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateTransactionDto, userId: string) {
    const organizationId = TenantContext.get();

    const transaction = this.transactionRepository.create({
      ...dto,
      userId,
      organizationId,
      status: TransactionStatus.PENDING,
    });

    const saved = await this.transactionRepository.save(transaction);

    this.eventEmitter.emit('transaction.created', {
      transaction: saved,
      userId,
      organizationId,
    });

    return saved;
  }

  async findAll(
    filters: FilterTransactionDto,
    userId: string,
    userRole: UserRole,
  ) {
    const organizationId = TenantContext.get();
    const {
      page = 1,
      limit = 20,
      type,
      status,
      category,
      accountId,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
    } = filters;

    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.organizationId = :organizationId', { organizationId })
      .orderBy('transaction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userRole === UserRole.VIEWER || userRole === UserRole.MEMBER) {
      query.andWhere('transaction.userId = :userId', { userId });
    }
    if (type) query.andWhere('transaction.type = :type', { type });
    if (status) query.andWhere('transaction.status = :status', { status });
    if (category)
      query.andWhere('transaction.category = :category', { category });
    if (accountId)
      query.andWhere('transaction.accountId = :accountId', { accountId });
    if (dateFrom)
      query.andWhere('transaction.transactionDate >= :dateFrom', { dateFrom });
    if (dateTo)
      query.andWhere('transaction.transactionDate <= :dateTo', { dateTo });
    if (amountMin)
      query.andWhere('transaction.amount >= :amountMin', { amountMin });
    if (amountMax)
      query.andWhere('transaction.amount <= :amountMax', { amountMax });

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const organizationId = TenantContext.get();

    const transaction = await this.transactionRepository.findOne({
      where: { id, organizationId },
      relations: ['account', 'user'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (userRole === UserRole.VIEWER || userRole === UserRole.MEMBER) {
      if (transaction.userId !== userId) {
        throw new NotFoundException('Transaction not found');
      }
    }

    return transaction;
  }

  async update(
    id: string,
    dto: UpdateTransactionDto,
    userId: string,
    userRole: UserRole,
  ) {
    const transaction = await this.findOne(id, userId, userRole);

    if (
      transaction.userId !== userId &&
      userRole !== UserRole.MANAGER &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this transaction',
      );
    }

    if (transaction.status === TransactionStatus.RECONCILED) {
      throw new BadRequestException('Cannot edit a reconciled transaction');
    }

    Object.assign(transaction, dto);
    return this.transactionRepository.save(transaction);
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const transaction = await this.findOne(id, userId, userRole);

    if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only managers and admins can delete transactions',
      );
    }

    // Soft delete
    transaction.status = TransactionStatus.VOID;
    return this.transactionRepository.save(transaction);
  }
}
