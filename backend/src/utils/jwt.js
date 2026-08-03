import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
