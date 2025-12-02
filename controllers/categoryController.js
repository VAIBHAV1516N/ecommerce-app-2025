import slugify from 'slugify';
import CategoryModel from '../models/categoryModel.js';

export const createCategoryController = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(401).send({ message: "Name is required" });
        }
        const existingCategory = await CategoryModel.findOne({ name });
        if (existingCategory) {
            return res.status(200).send({
                success: true,
                message: "Category Already Exists",
            });
        }
        const category = await new CategoryModel({ name, slug: slugify(name) }).save();
        res.status(201).send({
            success: true,
            message: "New Category Created",
            category,
        });
    }catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in Category",
            error,
        });
    }
};


//update category

export const updateCatgoryController = async(req,res) => {
    try{
        const { name } =req.body;
        const { id } = req.params;
        const category = await CategoryModel.findByIdAndUpdate(id,{ name, slug:slugify(name)},{new:true});
        res.status(200).send({
            success: true,
            message:'Category Updated Successfully',
            category,
        });
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while updating Category',
            error
        })
    }
};

//get all category
export const categoryController = async(req,res) => {
    try{
        const category = await CategoryModel.find({});
        res.status(200).send({
            success:true,
            message:'All Categories List',
            category,
        });
    }catch(error){
        console.log(error)
        res.status(500).send({
            success: false,
            message:'Error while getting all Categories',
            error,
        });
    }
};

//single category
export const singleCategoryController =async(req,res) =>{
    try{
        const category = await CategoryModel.findOne({slug:req.params.slug});
        res.status(200).send({
            success:true,
            message:'Get Single Category Successfully',
            category,
        })
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error While getting single Category',
            error,
        })
    }
}

//delete category
export const deleteCategoryController = async (req,res) =>{
    try{
        const { id } = req.params;
        await CategoryModel.findByIdAndDelete(id);
        res.status(200).send({
            success:true,
            message:'Category Deleted Successfully',
        })
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error While Deleting Category',
            error,
        })
    }
};