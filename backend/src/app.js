import express from "express";
import cors from "cors";
import { corsOrigins } from "./config/env.js";
import { router } from "./routes/index.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);
