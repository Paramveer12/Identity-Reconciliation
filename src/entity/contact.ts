import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Contact {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true, type: "uuid" })
  linkedId?: string;

  @Column({ nullable: true })
  linkPrecedence?: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  updatedAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}
