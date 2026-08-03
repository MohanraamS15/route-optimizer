import {registerUser, loginUser} from './auth.service.js';
import {registerSchema, loginSchema} from './auth.validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res, next) => {
    const result=registerSchema.safeParse(req.body);

    if(!result.success){
        return next(Object.assign(new Error(), { name: 'ZodError', errors: result.error.issues, statusCode: 400 }));
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
            error.statusCode = 409;
        }
        return next(error);
    }
});

export const login = asyncHandler(async (req, res, next) => {
    const validateData=loginSchema.safeParse(req.body);

    if(!validateData.success){
        return next(Object.assign(new Error(), { name: 'ZodError', errors: validateData.error.issues, statusCode: 400 }));
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
            error.statusCode = 401;
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