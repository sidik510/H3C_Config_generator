// backend/routes/userRoute.js
import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import { registerUser, loginUser } from "../controllers/userController.js";

const router = express.Router();

// Route register (tidak perlu autentikasi)
router.post("/register", registerUser);
router.post("/login", loginUser);

// Route terlindungi (butuh token)
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user }); // ✅ req.user berasal dari hasil decode JWT
});

export default router;
