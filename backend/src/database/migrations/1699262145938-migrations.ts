import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1699262145938 implements MigrationInterface {
    name = 'Migrations1699262145938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rewards" ("id" SERIAL NOT NULL, "chain_id" integer NOT NULL, "account" character varying NOT NULL, "token_address" character varying, "balance" character varying NOT NULL, "block_number" integer NOT NULL DEFAULT '0', "log_index" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a7f57b2ca829a0b72a7f68f179" ON "rewards" ("chain_id", "token_address", "account") `);
        await queryRunner.query(`CREATE TABLE "domains" ("id" SERIAL NOT NULL, "chain_id" integer NOT NULL, "name" character varying NOT NULL, "owner" character varying, "parent_id" integer, "additional_price" character varying NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE, "finished_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_05a6b087662191c2ea7f7ddfc4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0098b266e6691783004667114f" ON "domains" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_27dba55f7276b4b569a093e9ac" ON "domains" ("chain_id", "finished_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_f1cc8c4dad83da50b7995ec1db" ON "domains" ("chain_id", "created_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_671bfe82f68be1d1f209ad90bb" ON "domains" ("chain_id", "name") `);
        await queryRunner.query(`CREATE TABLE "tokens" ("id" SERIAL NOT NULL, "chain_id" integer NOT NULL, "address" character varying NOT NULL, "feed_address" character varying NOT NULL, "name" character varying, "symbol" character varying, "decimals" integer, CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_234cf91b074d8b361650ac45ae" ON "tokens" ("chain_id", "address") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_234cf91b074d8b361650ac45ae"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_671bfe82f68be1d1f209ad90bb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1cc8c4dad83da50b7995ec1db"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27dba55f7276b4b569a093e9ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0098b266e6691783004667114f"`);
        await queryRunner.query(`DROP TABLE "domains"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7f57b2ca829a0b72a7f68f179"`);
        await queryRunner.query(`DROP TABLE "rewards"`);
    }

}
