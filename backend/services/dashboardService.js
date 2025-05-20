import dashboardModel from "../models/dashboardModel.js";
import crypto from "crypto";

const generateConfigHash = (configText) => {
  return crypto.createHash("sha256").update(configText).digest("hex");
};

const dashboardService = {
  saveConfig: async (configData, ports) => {
  const configHash = generateConfigHash(configData.config_text);
  return await dashboardModel.saveConfig(
    { ...configData, config_hash: configHash },
    ports
  );
},

  getConfigHistory: async (userId) => {
    return await dashboardModel.getConfigHistory(userId);
  },

  deleteConfig: async (configId, userId) => {
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