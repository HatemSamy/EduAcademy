import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as registrationRouter from "./controller/auth.js";
import * as validators from "../../modules/auth/auth.validation.js"
const router = Router()

router.post("/signup",registrationRouter.signup)
router.get("/confirmEmail/:token",registrationRouter.confirmEmail)
router.post("/login",validation(validators.login),registrationRouter.login)
router.post("/SendCode",registrationRouter.sendAccessCode)
router.post("/RestPassword",registrationRouter.forgetPassword)

export default router