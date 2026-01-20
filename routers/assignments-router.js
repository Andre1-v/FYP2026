import { Router } from "express";
import Model from "../models/Model.js";
import assignmentsModel from "../models/assignments-model.js";
import database from "../database.js";
import Accessor from "../accessor/Accessor.js";
import Controller from "../controller/Controller.js";

const router = Router();

// Query builders --------------------------------

const model = new Model(assignmentsModel);

// Data accessors --------------------------------

const accessor = new Accessor(model, database);

// Controllers -----------------------------------

const controller = new Controller(accessor);

// Endpoints -------------------------------------

router.get("/", (req, res) => controller.get(req, res, null));
router.get("/:id", (req, res) => controller.get(req, res, null));
router.get("/users/:id", (req, res) => controller.get(req, res, "user"));
router.post("/", controller.post);
router.put("/:id", controller.put);
router.delete("/:id", controller.delete);
export default router;
