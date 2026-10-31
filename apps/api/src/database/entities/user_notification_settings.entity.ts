import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { BaseEntity } from "../common/base.entity";
import { User } from "./user.entity";

@Entity('user_notification_settings')
@Unique(['user'])
export class UserNotificationSettings extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'email_enabled', type: 'boolean', default: true })
  emailEnabled!: boolean;

  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  pushEnabled!: boolean;

  @Column({ name: 'message_alerts_enabled', type: 'boolean', default: true })
  messageAlertsEnabled!: boolean;
}