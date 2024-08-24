import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary";
import fs from "fs";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const avatar = req.files.avatar.tempFilePath;

         let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        const otp = Math.floor(Math.random() * 1000000);

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "todoApp"
        });

        fs.rmSync("./tmp", { recursive: true }) // to delete temp folder after upload

        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            },
            otp,
            otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000)
        });

        await sendMail(email, "Verify your account", `Your OTP is ${otp}`)

        sendToken(res, user, 201, "OTP sent to your email, please verify your account"); 

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}

export const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp);
        const user = await User.findById(req.user._id).select("+password");

        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        if (user.otp_expiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            })
        }

        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User verified successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "LogIn First"
            })
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        sendToken(res, user, 200, "Login Successfull");

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}

export const logout = async (req, res) => {
    try {

        res.status(200).cookie("token", null, {
            expires: new Date(Date.now()),
        }).json({
            success: true,
            message: "Logged out successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}



export const addTask = async (req, res) => {
    try {
        const { title, description } = req.body;

        const user = await User.findById(req.user._id);

        user.tasks.push({
            title,
            description,
            completed: false,
            createdAt: new Date(Date.now())
        })

        await user.save();
        res.status(200).json({
            success: true,
            message: "Task added successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



export const removeTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter((task) => task._id.toString() !== taskId.toString());

        await user.save();
        res.status(200).json({
            success: true,
            message: "Task Deleted Successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        const task = user.tasks.find((task) => task._id.toString() === taskId);

        task.completed = !task.completed;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Task Updated Successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        sendToken(res, user, 200, `Welcome Back ${user.name}`);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}


export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const { name } = req.body;
        const avatar = req.files.avatar.tempFilePath;

        if (name) user.name = name;
         if(avatar) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);

            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "todoApp"
            });

            fs.rmSync("./tmp", { recursive: true }) // to delete temp folder after upload

            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }

        await user.save();
        res.status(200).json({
            success: true,
            message: "Profile Updated Successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");
        const { oldPassword, newPassword } = req.body;
        const isMatch = await user.comparePassword(oldPassword);
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please enter old password and new password"
            })
        }

        if (!isMatch) return res.status(400).json({
            success: false,
            message: "Invalid Old Password"
        })

        user.password = newPassword;

        await user.save();
        res.status(200).json({
            success: true,
            message: "Password Updated Successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            })
        }

        const otp = Math.floor(Math.random() * 1000000);
        const message = `Your OTP for resetting password is ${otp}. If u did not request for this, please ignore this email`;

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;

        await user.save();
        await sendMail(email, "Request For Resetting Password", message)

        res.status(200).json({
            success: true,
            message: `OTP sent to ${email} successfully. Please check your email.  `
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordOtp: otp,
            resetPasswordOtpExpiry: { $gt: Date.now() }
        }).select("+password");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "OTP Invalid or has been Expired"
            })
        }

        user.password = newPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpiry = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: `Password Reset Successfull`
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
