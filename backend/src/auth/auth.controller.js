import {registerUser, loginUser} from './auth.service.js';
import {registerSchema, loginSchema} from './auth.validation.js';


export const register = async (req, res) => {
    const result=registerSchema.safeParse(req.body);

    if(!result.success){
        return res.status(400).json({
            success: false,
            error: result.error
        });
    }

    const user = await registerUser(result.data);

    return res.status(200).json({
        success: true,
        message: "Registration successful",
        ...user,
    });





};

export const login = async (req, res) => {
    const validateData=loginSchema.safeParse(req.body);

    if(!validateData.success){
        return res.status(400).json({
            success: false,
            error: validateData.error
        });
    }

    const { token } = await loginUser(validateData.data);

    return res.status(200).json({
        success: true,
        message: "Login successful",
        token:token,

    });


};

export const me = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user
    });
};