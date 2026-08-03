import { verifyToken } from "../utils/jwt.js";
import prisma from "../config/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    // Read Authorization Header
    const authHeader = req.headers.authorization;

    // Header Exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, error: "Unauthorized: Invalid token payload" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      select:{
        id:true,
        name:true,
        email:true,
        createdAt:true,
      }
    });

    // User Exists?
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized: User not found" });
    }

    
    req.user = user;
    

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid or expired token" });
  }
};
