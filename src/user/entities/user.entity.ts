import { Exclude } from 'class-transformer';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  PROVIDER = 'provider',
  DRIVER = 'driver',
  COMMUTER = 'commuter',
}

@Entity()
@Unique(['email'])
@Unique(['phoneNumber'])
@Check(`"age" > 5`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column()
  age: number;

  @Exclude()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.COMMUTER,
  })
  role: UserRole;

  @Exclude()
  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
