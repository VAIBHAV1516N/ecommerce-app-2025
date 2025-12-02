import JWT from 'jsonwebtoken';
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import orderModel from '../models/orderModel.js';
import userModel from "../models/userModel.js";
//REGISTER USER

export const registerController = async(req, res) => {
    try{
        const {name, email, password, phone, address, question} = req.body;
        //validation
        if(!name){
            return res.send({message:"Name is Required"});
        }
        if(!email){
            return res.send({message:"Email is Required"});
        }
        if(!password){
            return res.send({message:"Password is Required"});
        }
        if(!phone){
            return res.send({message:"Phone no is Required"});
        }
        if(!address){
            return res.send({message:"Address is Required"});
        }
        if(!question){
            return res.send({message:"Security Question is Required"});
        }

        //check user
        const existingUser = await userModel.findOne({email});
        //existing user
        if(existingUser){
            return res.status(200).send({
                success:false,
                message:"Already Registered Please Login"
            });
        }
        //register user
        const hashedPassword = await hashPassword(password);
        //save
        const user = await new userModel({
            name,
            email,
            phone,
            address,
            password:hashedPassword,
            question
        }).save();

        res.status(201).send({
            success:true,
            message:"User Registered Successfully",
            user
        });
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            Message:"Error in Registration",
            error
        })
    }
};

//POST LOGIN
export const loginController = async(req, res)=>{
    try{
        const {email, password} = req.body;
        //validation
        if(!email || !password){
            return res.status(400).send({
                success:false,
                message:"Invalid Email or Password "
            });
        }
        //check user
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(404).send({
                success:false,
                message:"Email is not registered"
            });
        }
        //check password
        const match = await comparePassword(password, user.password);
        if(!match){
            return res.status(200).send({
                success:false,
                message:"Invalid Password"
            });
        }
        //token
        const token = await JWT.sign({_id:user._id}, process.env.JWT_SECRET, {
            expiresIn:"7d"
        });
        res.status(200).send({
            success:true,
            message:"Login Successful",
            user:{
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                role:user.role,
            },
            token
        });
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            Message:"Error in Login",
            error
        })
    }
};

//forgot password controller
export const forgotPasswordController = async(req, res)=>{
    try{
        const {email, question, newPassword} = req.body;
        if(!email){
            res.status(400).send({message:"Email is required"});
        }
        if(!question){
            res.status(400).send({message:"Security Question is required"});
        }
        if(!newPassword){
            res.status(400).send({message:"New Password is required"});
        }
        //check
        const user = await userModel.findOne({email, question});
        //validation
        if(!user){
            return res.status(404).send({
                success:false,
                message:"Wrong Email or Security Answer"
            });
        }
        const hashed = await hashPassword(newPassword);
        await userModel.findByIdAndUpdate(user._id, {password:hashed});
        res.status(200).send({
            success:true,
            message:"Password Reset Successfully"
        });
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            Message:"Something went wrong",
            error
        })
    }
}

//test controller
export const testController = (req, res) => {
    try {
        res.send("Protected Routes");
    } catch (error) {
        console.log(error);
        res.send({ error });
    }
};

//update profile controller
export const updateProfileController = async(req, res) => {
    try {
        const { name, email, password, address, phone } = req.body;
        const user = await userModel.findById(req.user._id);

        //password
        if (password && password.length < 6) {
            return res.json({ error: "Password is required and 6 characters long" });
        }
        const hashedPassword = password ? await hashPassword(password) : undefined;

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user._id,
            {
                name: name || user.name,
                password: hashedPassword || user.password,
                phone: phone || user.phone,
                address: address || user.address,
            },
            { new: true }
        );
        res.status(200).send({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error in updating profile",
            error,
        });
    }
};

//orders controller
//orders
export const getOrdersController = async (req, res) => {
    try {
        const orders = await orderModel
        .find({ buyer: req.user._id })
        .populate("products", "-photo")
        .populate("buyer", "name");
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
        success: false,
        message: "Error While Geting Orders",
        error,
        });
    }
};

//orders
export const getAllOrdersController = async (req, res) => {
    try {
    // String-based sort is robust across mongoose versions
    const orders = await orderModel.find({})
      .sort('-createdAt')          // <<-- use string form, not object
      .populate('buyer', 'name email') // populate buyer fields
      .populate('products');           // adjust populate path to match your schema

    return res.status(200).json(orders);
    } catch (err) {
        console.error('getAllOrdersController error:', err);
        return res.status(500).send({
        success: false,
        message: 'Error while getting orders',
        error: err?.message ?? err,
        });
    }
};

//order status
export const orderStatusController = async (req, res) => {
    try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    return res.json(order);
  } catch (err) {
    console.error('updateOrderStatusController error:', err);
    return res.status(500).send({ success: false, error: err?.message ?? err });
  }
};