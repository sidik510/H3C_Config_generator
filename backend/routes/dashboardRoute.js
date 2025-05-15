// routes/dashboardRoute.js
import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Route untuk mendapatkan riwayat konfigurasi
router.get("/history", authMiddleware, dashboardController.getConfigHistory);

// Route untuk menyimpan konfigurasi
router.post("/", authMiddleware, dashboardController.saveConfig);

// Route untuk menghapus konfigurasi
router.delete("/:configId", authMiddleware, dashboardController.deleteConfig);

// Riwayat yang sudah dihapus
router.get("/deleted", authMiddleware, dashboardController.getDeletedHistory);

// Pulihkan konfigurasi
router.patch("/restore/:configId", authMiddleware, dashboardController.restoreConfig);


export default router;
