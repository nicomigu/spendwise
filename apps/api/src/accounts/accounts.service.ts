import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { TenantContext } from '../common/tenant/tenant.context';
import { UserRole } from '../common/enums';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async create(dto: CreateAccountDto, userId: string, userRole: UserRole) {
    const organizationId = TenantContext.get();

    if (userRole === UserRole.VIEWER || userRole === UserRole.MEMBER) {
      throw new ForbiddenException(
        'Only managers and admins can create accounts',
      );
    }

    const account = this.accountRepository.create({
      ...dto,
      organizationId,
      ownerId: userId,
      balance: 0,
    });

    return this.accountRepository.save(account);
  }

  async findAll(userId: string, userRole: UserRole) {
    const organizationId = TenantContext.get();

    const query = this.accountRepository
      .createQueryBuilder('account')
      .where('account.organizationId = :organizationId', { organizationId });

    // VIEWER and MEMBER only see their own accounts
    if (userRole === UserRole.VIEWER || userRole === UserRole.MEMBER) {
      query.andWhere('account.ownerId = :userId', { userId });
    }

    return query.orderBy('account.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const organizationId = TenantContext.get();

    const account = await this.accountRepository.findOne({
      where: { id, organizationId },
      relations: ['owner'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // VIEWER and MEMBER can only view their own accounts
    if (userRole === UserRole.VIEWER || userRole === UserRole.MEMBER) {
      if (account.ownerId !== userId) {
        throw new NotFoundException('Account not found');
      }
    }

    return account;
  }

  async update(
    id: string,
    dto: UpdateAccountDto,
    userId: string,
    userRole: UserRole,
  ) {
    const account = await this.findOne(id, userId, userRole);

    // Only owner, manager, or admin can update
    if (
      account.ownerId !== userId &&
      userRole !== UserRole.MANAGER &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this account',
      );
    }

    Object.assign(account, dto);
    return this.accountRepository.save(account);
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const account = await this.findOne(id, userId, userRole);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete accounts');
    }

    // Soft delete
    account.isActive = false;
    return this.accountRepository.save(account);
  }
}
