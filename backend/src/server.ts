import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import userRoutes from "./routes/user.routes.js";
import groupRoutes from "./routes/group.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import eventRoutes from "./routes/event.routes.js";


import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";


export const app = express();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());
app.use(arcjetMiddleware);

app.get("/", (req, res) => res.send("Bonjour from server"))

app.use("/api/users", userRoutes)
app.use("/api/group", groupRoutes)
app.use("/api/activity", activityRoutes)
app.use("/api/event", eventRoutes)

export const startServer = async () => {
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
export default app;
