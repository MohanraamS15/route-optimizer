import bcrypt from "bcrypt";
import {generateToken,verifyToken} from '../utils/jwt.js';
import prisma from "../config/prisma.js";
import dotenv from "dotenv";
dotenv.config();

export const registerUser = async (userData) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
};

export const loginUser = async (loginData) => {
  const user = await prisma.user.findUnique({
    where: {
      email: loginData.email,
    },
  });



  if (!user) {
    throw new Error("Invalid credentials");
  }

  const passwordMatch = await bcrypt.compare(loginData.password, user.password);

  if (!passwordMatch) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user);
  console.log("Generated Token:", token);
  return {
    token,
  };

};
