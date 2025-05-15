// backend/services/userService.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, getUserByEmail } from "../models/userModel.js";

export const registerUserService = async (name, email, password, role) => {
  const existingUser = await getUserByEmail(email);
  if (existingUser) throw new Error("Email sudah terdaftar");

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await createUser(name, email, hashedPassword, role);
  if (result.affectedRows === 0) throw new Error("Gagal mendaftarkan user");

  return "Registrasi berhasil!";
};

export const loginUserService = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) throw new Error("Email atau password salah");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("Email atau password salah");

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return { 
    message:'Login berhasil',
    token,
    user:{ 
    id: user.id, name: user.name, email: user.email, role: user.role 
  }
  };
}
