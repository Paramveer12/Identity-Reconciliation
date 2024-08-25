import { DataSource } from "typeorm";
import { Contact}  from "../entity/contact";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres" ,
  password: "postgres"   ,
  database: "bitespeed_db",
  synchronize: true,  // Automatically synchronize the schema
  logging: false,
  entities: [Contact],
  migrations: [],
  subscribers: [],
});
