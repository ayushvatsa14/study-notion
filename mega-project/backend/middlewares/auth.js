const User=require('../models/User');
const jwt=require('jsonwebtoken');
require('dotenv').config();

exports.auth=async(req, res, next) => {
    try{
        const token=req.cookies.token || req.body.token
        || header("Authorisation").replace("Bearer ", "");

        if(!token){
            return res.status(401).json({
                success: false,
                message: "Token not found"
            });
        }

        try{
            const decode=await jwt.verify(token, process.env.Jwt_Secret);
            req.user(decode);
            next();
        }
        catch(error){
            return res.status(401).json({
                success: false,
                message: "Token invalid"
            });
        }
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
}

exports.isStudent=async(req, res, next) => {
    try{
        if(req.user.accountType !== 'Student'){
            return res.status(401).json({
                success: false,
                message: "This is a protected route for students only"
            });
        }

        next();
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Failed to verify student route"
        });
    }
}

exports.isInstructor=async(req, res, next) => {
    try{
        if(req.user.accountType !== 'Instructor'){
            return res.status(401).json({
                success: false,
                message: "This is a protected route for instructor only"
            });
        }

        next();
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Failed to verify instructor route"
        });
    }
}

exports.isAdmin=async(req, res, next) => {
    try{
        if(req.user.accountType !== 'Admin'){
            return res.status(401).json({
                success: false,
                message: "This is a protected route for admin only"
            });
        }

        next();
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Failed to verify admin route"
        });
    }
}