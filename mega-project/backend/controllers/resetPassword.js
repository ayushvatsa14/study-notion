const User=require('../models/User');
const {mailsender}=require('../utils/mailSender');
const bcrypt=require("bcryptjs");
const crypto=require("crypto");

exports.resetPasswordToken=async(req, res) => {
    try{
        const {email}=req.body;
        const user=await User.findOne({email});

        if(!user){
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        const token=crypto.randomBytes(20).toString('hex');

        const updatedUser=await User.findOneAndUpdate({email: email}, {
            token: token,
            resetPasswordExpires: Date.now() + 5*60*1000
        }, {new: true});

        const resetPasswordUrl=`http://localhost:3000/update-password/${token}`;

        await mailsender(email, 
            'Reset Password', 
            `Your Link for email verification is ${url}. 
            Please click this url to reset your password.`
        )

        res.status(200).json({
            success: true,
            message: "Email sent successfully"
        });
    }
    catch(error){
        return res.status(500).json({
            success: true,
            message: "Failed to send mail to reset password"
        });
    }
}

exports.resetPassword=async(req, res) => {
    try{
        const {password, confirmPassword, token}=req.body;
        const user=await User.findOne({token: token});

        if(!user){
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        if(user.resetPasswordExpires<Date.now()){
            return res.status(403).json({
                success: false,
                message: "Token expired, generate token again"
            });
        }

        if (confirmPassword !== password) {
			return res.status(401).json({
				success: false,
				message: "Password and Confirm Password Does not Match"
			});
		}

        const hashedPassword=await bcrypt.hash(password, 10);

        await User.findOneAndUpdate(
			{token: token},
			{password: hashedPassword},
			{new: true}
		);

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    }
    catch(error){
        return res.status(500).json({
            success: true,
            message: "Failed to reset password"
        });
    }
}