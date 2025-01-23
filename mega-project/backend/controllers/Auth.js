const User=require('../models/User');
const Otp=require('../models/Otp');
const Profile=require('../models/Profile');
const {mailSender}=require('../utils/mailSender');
const otpGenerator=require('otp-generator');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
require('dotenv').config();

exports.sendOtp=async(req, res) => {
    try{
        const {email}=req.body;

        const existingUser=await User.findOne({email: email});

        if(existingUser){
            res.status(401).json({
                success: false,
                message: "User already exists"
            });
        }

        var otp=otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        var result=await Otp.findOne({otp: otp});

        if(result){
            otp=otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            });
    
            result=await Otp.findOne({otp: otp});
        }

        const otp_payload={email, otp};

        const otpResponse=await Otp.create(otp_payload);        

        res.status(200).json({
            success: true,
            message: 'Otp sent successfully',
            otp
        });
    }
    catch(error){
        return res.status(401).json({
            success: false,
            message: `Unable to send otp, ${error.message}`
        });
    }
}

exports.signUp=async(req, res) => {
    try{
        const {firstname, lastname, email, password, 
        confirmPassword, accountType, otp}=req.body;

        if(!firstname || !lastname || !email || !password || 
        !confirmPassword || !otp){
            return res.status(403).json({
                success: false,
                message: "All fields required"
            });
        }

        const existingUser=await User.findOne({email: email});

        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password do not match"
            });
        }

        const recentOtp=await Otp.find({email}).sort({createdAt: -1}).limit(1);

        if(!recentOtp){
            return res.status(400).json({
                success: false,
                message: "Otp not found"
            });
        }

        if(otp !== recentOtp.otp){
            return res.status(400).json({
                success: false,
                message: "Incorrect otp"
            });
        }

        const hashedPassword=await bcrypt(password, 10);

        const userProfile=await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null
        });

        const user=await User.create({
            firstName: firstname,
            lastName: lastname,
            email: email,
            password: hashedPassword,
            accountType,
            additionalDetails: userProfile._id,
            image: `https://api.dicebear.com/9.x/initials/svg?seed=${firstname} ${lastname}`
        });

        res.status(200).json({
            success: true,
            message: "User created successfully",
            user
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: `User cannot be created, ${error.message}`
        });
    }
}

exports.logIn=async(req, res) => {
    try{
        const {email, password}=req.body;

        if(!email || !password){
            return res.status(403).json({
                success: false,
                message: "All fields required"
            });
        }

        const registeredUser=await User.findOne({email: email});

        if(!registeredUser){
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        if(await bcrypt.compare(password, registeredUser.password)){
            const payload={
                email: registeredUser.email,
                id: registeredUser._id,
                accountType: registeredUser.accountType
            };

            const token=jwt.sign(payload, process.env.Jwt_Secret, {
                expiresIn: '2h'
            });

            const user=registeredUser.toObject;
            user.token=token;
            user.password=undefined;

            const options={
                expires: Date.now(Date.now() + 3*24*60*60*1000),
                httpOnly: true
            };

            res.cookies('token', token, options).status(200).json({
                success: true,
                token,
                user,
                message: 'Logged in successfully'
            });
        }
        else{
            res.status(401).json({
                success: false,
                message: "Wrong password"
            });
        }
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
}

exports.changePassword=async(req, res) => {
    try{
        const {email, password, newPassword, confirmNewPassword}=req.body;

        if(newPassword !== confirmNewPassword){
            return res.status(400).json({
                success: false,
                message: "New password do not match"
            });
        }

        const user=await User.findOne({email: email});

        if(await bcrypt.compare(password, user.password)){
            const newHashedPassword=await bcrypt.hash(newPassword, 10);

            const updatedPassword=await User.findByIdAndUpdate({id: user._id}, {password: newHashedPassword}, {new: true, runValidators: true});
            await mailSender(user.email, 'Change Password', 'Your password was changed');

            res.status(200).json({
                success: true,
                message: "Password changed successfully"
            });
        }
        else{
            return res.status(403).json({
                success: false,
                message: "Current password does not match"
            });
        }
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Password change failed"
        });
    }
}