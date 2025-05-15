import dashboardService from "../services/dashboardService.js";

const dashboardController = {
  getConfigHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const history = await dashboardService.getConfigHistory(userId);
      res.status(200).json(history);
    } catch (error) {
      console.error("Error loading config history:", error);
      res.status(500).json({ message: "Error loading config history" });
    }
  },

  saveConfig: async (req, res) => {
    try {
      const configData = {
        user_id: req.user.id,
        device_type: req.body.device_type,
        hostname: req.body.hostname,
        config_text: req.body.config_text,
      };

      const savedConfig = await dashboardService.saveConfig(configData);
      res.status(201).json({
        message: "Configuration saved successfully",
        config: savedConfig,
      });
    } catch (error) {
      console.error("Error saving configuration:", error);
      res.status(500).json({
        message: error.message || "Error saving configuration",
      });
    }
  },

  deleteConfig: async (req, res) => {
    try {
      const configId = req.params.configId;
      const userId = req.user.id;

      await dashboardService.deleteConfig(configId, userId);
      res.status(200).json({
        message: "Configuration deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting configuration:", error);
      res.status(500).json({
        message: error.message || "Error deleting configuration",
      });
    }
  },

  getDeletedHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const history = await dashboardService.getDeletedHistory(userId);
      res.status(200).json(history);
    } catch (error) {
      res.status(500).json({ message: "Error loading deleted history" });
    }
  },

  restoreConfig: async (req, res) => {
    try {
      const configId = req.params.configId;
      const userId = req.user.id;

      await dashboardService.restoreConfig(configId, userId);
      res.status(200).json({ message: "Configuration restored successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Error restoring configuration" });
    }
  },
};

export default dashboardController;
