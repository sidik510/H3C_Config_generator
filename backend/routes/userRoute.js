import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import userController from "../controllers/userController.js";

const router = express.Router();

// Route register dan login
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// Route terlindungi (butuh token)
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
