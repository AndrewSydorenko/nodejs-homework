const express = require("express");
const ctrl = require("../../controlers/contactsControler");
const { validateBody } = require("../../middlewares");
const schemas = require("../../schemas/contactsSchema");

const router = express.Router();

router.get("/", ctrl.getAll);

router.get("/:contactId", ctrl.getById);

router.post("/", validateBody(schemas.addSchema), ctrl.add);

router.delete("/:contactId", ctrl.deleteById);

router.put("/:contactId", validateBody(schemas.addSchema), ctrl.updateById);

module.exports = router;
