import { Router } from "express";
import database from "../database.js";
import Model from "../models/Model.js";
import usersModel from "../models/users-model.js";
import Accessor from "../accessor/Accessor.js";
import Controller from "../controller/Controller.js";

const router = Router();

// Query builders --------------------------------
const model = new Model(usersModel);

// Data accessors --------------------------------

const accessor = new Accessor(model, database);
// Controllers -----------------------------------

const controller = new Controller(accessor);

// Endpoints -------------------------------------

router.get("/", (req, res) => controller.get(req, res, null));
router.get("/client", (req, res) => controller.get(req, res, "client"));
router.get("/dispatcher", (req, res) => controller.get(req, res, "dispatcher"));
router.get("/tradesperson", (req, res) =>
  controller.get(req, res, "tradesperson")
);
router.get("/administrator", (req, res) =>
  controller.get(req, res, "administrator")
);
router.get("/:id", (req, res) => controller.get(req, res, null));

router.post("/", controller.post);
router.put("/:id", controller.put);
router.delete("/:id", controller.delete);

export default router;
