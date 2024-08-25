import "reflect-metadata";
import express, { Request, Response } from "express";
import { AppDataSource } from "./db/datasource";
import { ContactService } from "./service/contactService";

const app = express();
const port = 3000;

app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

const contactService = new ContactService();

app.post("/identify", async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;
  const result = await contactService.identifyContact(email, phoneNumber);
  res.status(200).json(result);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
