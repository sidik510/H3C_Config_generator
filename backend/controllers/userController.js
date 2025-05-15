// backend/controller/userController.js
import { registerUserService } from "../services/userService.js";
import { loginUserService } from "../services/userService.js";

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const message = await registerUserService(name, email, password, role);
    res.status(201).json({ message });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { message, token, user} = await loginUserService(email, password);
    res.status(200).json({ message, token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}