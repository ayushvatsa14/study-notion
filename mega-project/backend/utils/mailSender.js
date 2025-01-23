const nodemailer=require("nodemailer");
require('dotenv').config();

const mailSender=async(email, title, body) => {
    try{
        let transporter=nodemailer.createTransport({
            service: "gmail",
            secure: true,
            port : 465,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        let info=await transporter.sendMail({
            from: process.env.MAIL_USER,
            to:`${email}`,
            subject: `${title}`,
            html: `${body}`
        });

        console.log(info);
        return info;
    }
    catch(error){
        console.log(error.message);
    }
}

module.exports=mailSender;