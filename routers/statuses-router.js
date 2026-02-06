import { Router } from "express";
import database from "../database.js";
import Model from "../models/Model.js";
import StatusesModel from "../models/statuses-model.js";
import Accessor from "../accessor/Accessor.js";
import Controller from "../controller/Controller.js";

const router = Router();

// Query builders --------------------------------

const model = new Model(StatusesModel);

// Data accessors --------------------------------

const accessor = new Accessor(model, database);

// Controllers -----------------------------------

const controller = new Controller(accessor);

// Endpoints -------------------------------------

router.get("/", (req, res) => controller.get(req, res, null));
router.get("/:id", (req, res) => controller.get(req, res, null));
router.post("/", controller.post);
router.put("/:id", controller.put);
router.delete("/:id", controller.delete);

export default router;
