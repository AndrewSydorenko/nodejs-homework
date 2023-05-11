const express = require("express");
const ctrl = require("../../controlers/contactsControler");
const { validateBody, isValidId,
    validateFavorite } = require("../../middlewares");
const { schemas } = require("../../models/contact");

const router = express.Router();

router.get("/", ctrl.getAll);

router.get("/:contactId", ctrl.getById);

router.post("/", validateBody(schemas.addSchema), ctrl.add);

router.delete("/:contactId", ctrl.deleteById);

router.put("/:contactId", validateBody(schemas.addSchema), ctrl.updateById);

router.patch(
    "/:contactId/favorite",
    isValidId,
    validateFavorite(schemas.updateFavoriteSchema),
    ctrl.updateFavorite
);


module.exports = router;
