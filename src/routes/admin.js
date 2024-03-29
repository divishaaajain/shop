const express = require('express');
const {body} = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// Request will only make it to the next middleware if it passes from the next(); of first middleware
router.get('/add-product', isAuth, adminController.getAddProduct);                   // 2 middlewares - request moves from left to right

router.get('/products', isAuth, adminController.getProducts);

router.post('/add-product', [
    body('title', 'Title should be bewteen 3 to 80 characters')
        .trim()
        .isString()
        .isLength({min: 3, max: 80}),
    body('price', 'Invalid number')
        .isNumeric(),                                                 // for integers and floats, .isFloat() - for floating point numbers
    body('description', 'Description should be bewteen 5 to 400 characters')
        .trim()
        .isLength({min: 5, max: 400})    
],
isAuth, 
adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title', 'Title should be bewteen 3 to 80 characters')
        .trim()
        .isString()
        .isLength({min: 3, max: 80}),
    body('price', 'Invalid number')
        .isNumeric(),                                                 
    body('description', 'Description should be bewteen 5 to 400 characters')
        .trim()
        .isLength({min: 5, max: 400})
],
isAuth, 
adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;

