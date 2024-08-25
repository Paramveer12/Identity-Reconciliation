import { DataSource } from "typeorm";
import { Contact}  from "../entity/contact";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "dpg-cr5p98dumphs73e70ovg-a",
  port: 5432,
  username: "user" ,
  password: "JC7pxdnJRf6UG5RyIr7tcJTYLCsqoAbZ"   ,
  database: "bitespeed_db_bwdj",
  synchronize: true,  // Automatically synchronize the schema
  logging: false,
  entities: [Contact],
  migrations: ["dist/db/migrations/*{.ts,.js}"],
  subscribers: [],
});
