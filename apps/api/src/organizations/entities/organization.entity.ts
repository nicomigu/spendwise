import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SubscriptionTier } from '../../common/enums';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier;

  @Column({ default: 'UTC' })
  timezone: string;
}
