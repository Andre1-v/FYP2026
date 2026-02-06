// Imports ---------------------------------------
import express from "express";
import cors from "cors";
import assignmentsRouter from "./routers/assignments-router.js";
import jobTypesRouter from "./routers/jobtypes-router.js";
import jobsRouter from "./routers/jobs-router.js";
import officesRouter from "./routers/offices-router.js";
import ticketsRouter from "./routers/tickets-router.js";
import usersRouter from "./routers/users-router.js";
import statusesRouter from "./routers/statuses-router.js";
import jobFrequenciesRouter from "./routers/jobfrequencies-router.js";
import assignmentStatusesRouter from "./routers/assignmentstatuses-router.js";
import apiRouter from "./routers/api-router.js";

// Configure express app -------------------------
const app = new express();

// Configure middleware --------------------------
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoints -------------------------------------
app.use("/api", apiRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/jobtypes", jobTypesRouter);
app.use("/api/offices", officesRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/users", usersRouter);
app.use("/api/statuses", statusesRouter);
app.use("/api/jobfrequencies", jobFrequenciesRouter);
app.use("/api/assignmentstatuses", assignmentStatusesRouter);

// Start server ----------------------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
