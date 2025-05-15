import dashboardModel from "../models/dashboardModel.js";
import crypto from "crypto";

const generateConfigHash = (configText) => {
  return crypto.createHash("sha256").update(configText).digest("hex");
};

const dashboardService = {
  saveConfig: async (configData) => {
    const configHash = generateConfigHash(configData.config_text);
    const configWithHash = { ...configData, config_hash: configHash };

    return await dashboardModel.saveConfig(configWithHash);
  },

  getConfigHistory: async (userId) => {
    return await dashboardModel.getConfigHistory(userId);
  },

  deleteConfig: async (userId, configId) => {
    const affectedRows = await dashboardModel.deleteConfig(configId, userId);
    if (affectedRows === 0) {
      throw new Error("Configuration not found or already deleted");
    }
    return affectedRows;
  },

  getDeletedHistory: async (userId) => {
    return await dashboardModel.getDeletedHistory(userId);
  },

  restoreConfig: async (configId, userId) => {
    const affectedRows = await dashboardModel.restoreConfig(configId, userId);
    if (affectedRows === 0) {
      throw new Error("Configuration not found or already restored");
    }
    return affectedRows;
  },
};

export default dashboardService;
