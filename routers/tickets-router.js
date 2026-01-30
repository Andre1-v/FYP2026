import { Router } from "express";
import Model from "../models/Model.js";
import ticketsModel from "../models/tickets-model.js";
import database from "../database.js";
import Accessor from "../accessor/Accessor.js";
import Controller from "../controller/Controller.js";

const router = new Router();

// Model --------------------------------

const model = new Model(ticketsModel);

// Data accessors --------------------------------

const accessor = new Accessor(model, database);

// Controllers -----------------------------------

const controller = new Controller(accessor);

// Endpoints -------------------------------------

router.get("/", (req, res) => {
  const variant = req.query.status === "open" ? "open" : null;
  controller.get(req, res, variant);
});
router.get("/users/:id", (req, res) => controller.get(req, res, "user"));
router.get("/:id", (req, res) => controller.get(req, res, null));
router.post("/", controller.post);
router.put("/:id", controller.put);
router.delete("/:id", controller.delete);

export default router;
