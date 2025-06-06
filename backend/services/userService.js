import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const userService = {
  registerUserService: async (name, email, password, role) => {
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) throw new Error("Email sudah terdaftar");

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await userModel.createUser({name, email, password: hashedPassword, role});
    if (result.affectedRows === 0) throw new Error("Gagal mendaftarkan user");

    return "Registrasi berhasil!";
  },

  loginUserService: async (email, password) => {
    const user = await userModel.getUserByEmail(email);
    if (!user) throw new Error("Email atau password salah");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Email atau password salah");

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
};

export default userService;
