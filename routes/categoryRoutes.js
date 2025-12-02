import express from 'express';
import { categoryController, createCategoryController, deleteCategoryController, singleCategoryController, updateCatgoryController } from '../controllers/categoryController.js';
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';

const router = express.Router();

//routes
//craete category
router.post('/create-category', requireSignIn, isAdmin, createCategoryController);

//update category
router.put('/update-category/:id', requireSignIn, isAdmin, updateCatgoryController)

//get all category
router.get('/get-category', categoryController);

//single category
router.get('/single-category/:slug', singleCategoryController)

//delete category
router.delete('/delete-category/:id', requireSignIn, isAdmin, deleteCategoryController)


export default router;