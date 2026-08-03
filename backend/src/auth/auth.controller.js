import {registerUser, loginUser} from './auth.service.js';
import {registerSchema, loginSchema} from './auth.validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const register = asyncHandler(async (req, res, next) => {
    const result=registerSchema.safeParse(req.body);

    if(!result.success){
        const err = new AppError("Validation failed", 400);
        err.name = 'ZodError';
        err.errors = result.error.issues;
        return next(err);
    }

    try {
        const user = await registerUser(result.data);
        return res.status(200).json({
            success: true,
            message: "Registration successful",
            ...user,
        });
    } catch (error) {
        if (error.message === "Email already exists") {
            return next(new AppError(error.message, 409));
        }
        return next(error);
    }
});

export const login = asyncHandler(async (req, res, next) => {
    const validateData=loginSchema.safeParse(req.body);

    if(!validateData.success){
        const err = new AppError("Validation failed", 400);
        err.name = 'ZodError';
        err.errors = validateData.error.issues;
        return next(err);
    }

    try {
        const { token } = await loginUser(validateData.data);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token:token,
        });
    } catch (error) {
        if (error.message === "Invalid credentials") {
            return next(new AppError(error.message, 401));
        }
        return next(error);
    }
});

export const me = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user
    });
});