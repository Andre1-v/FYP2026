import { Router } from "express";
import database from "../database.js";
import Model from "../models/Model.js";
import officesModel from "../models/offices-model.js";
import Accessor from "../accessor/Accessor.js";
import Controller from "../controller/Controller.js";

const router = Router();

// Query builders --------------------------------

const model = new Model(officesModel);

// Data accessors --------------------------------

const accessor = new Accessor(model, database);

// Controllers -----------------------------------

const controller = new Controller(accessor);

// Endpoints -------------------------------------

router.get("/", (req, res) => controller.get(req, res, null));
router.get("/active", (req, res) => controller.get(req, res, "active"));
router.get("/:id", (req, res) => controller.get(req, res, null));
router.post("/", controller.post);
router.put("/:id", controller.put);
router.delete("/:id", controller.delete);

export default router;
