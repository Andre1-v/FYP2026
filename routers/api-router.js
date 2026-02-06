import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "FYP API - Available Endpoints",
    endpoints: [
      {
        path: "/api/assignments",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage assignments and their statuses"
      },
      {
        path: "/api/jobs",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage jobs and their details"
      },
      {
        path: "/api/jobtypes",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage job types and priorities"
      },
      {
        path: "/api/offices",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage office locations"
      },
      {
        path: "/api/tickets",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage support tickets"
      },
      {
        path: "/api/users",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage users"
      },
      {
        path: "/api/statuses",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage ticket and job statuses"
      },
      {
        path: "/api/jobfrequencies",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage job frequencies (Once, Daily, Weekly, etc.)"
      },
      {
        path: "/api/assignmentstatuses",
        methods: ["GET", "POST", "PUT", "DELETE"],
        description: "Manage assignment statuses (Pending, Accepted, Rejected)"
      }
    ]
  });
});

export default router;
