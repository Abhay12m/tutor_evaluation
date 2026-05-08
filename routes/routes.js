const router = require("express").Router();
const ctrl = require("../controllers/controller");

router.post("/evaluate", ctrl.evaluate);

module.exports = router;