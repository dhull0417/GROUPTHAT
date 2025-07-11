import express from "express";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";

const app = express();

connectDB();

app.get("/", (req, res) => res.send("Hello from server"))

app.listen(ENV.PORT, () => console.log("Server is up and running on PORT:", ENV.PORT));
