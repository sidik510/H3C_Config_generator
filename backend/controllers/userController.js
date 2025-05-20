// backend/controller/userController.js
import userService from "../services/userService.js";

const userController = {
  registerUser: async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
      const message = await userService.registerUserService(name, email, password, role);
      res.status(201).json({ message });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  loginUser: async (req, res) => {
    const { email, password } = req.body;

    try {
      const { message, token, user } = await userService.loginUserService(email, password);
      res.status(200).json({ message, token, user });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }
};

export default userController;