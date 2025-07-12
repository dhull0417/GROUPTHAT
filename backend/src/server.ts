import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./config/env";
import { connectDB } from "./config/db";


const app = express();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());

connectDB();

app.get("/", (req, res) => res.send("Hello from server"))

//app.use("api/users", userRoutes)
//app.use("api/group", groupRoutes)
//app.use("api/activity", activityRoutes)
//app.use("api/event", eventRoutes)

const startServer = async () => {
    try {
        await connectDB();

        app.listen(ENV.PORT, () => console.log("Server is up and running on PORT:", ENV.PORT));
    } catch (error) {
        if (error instanceof Error){
        console.error("Failed to start server:", error.message);
        } else {
            console.error("An unknown error occured:", error);
        }
        process.exit(1);
    }
}

startServer();
