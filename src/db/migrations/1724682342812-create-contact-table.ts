import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContactTable1724682342812 implements MigrationInterface {
    name = 'CreateContactTable1724682342812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contact" ("id" BIGSERIAL NOT NULL, "phoneNumber" character varying, "email" character varying, "linkedId" bigint, "linkPrecedence" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "contact"`);
    }

}
