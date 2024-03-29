/* 
*/

const {validationResult} = require('express-validator');

const Product = require('../models/product');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasErrors: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;                                            // extracting file through incoming request
    const description = req.body.description;
    const price = req.body.price;
    const userId = req.user._id;
    if(!image){
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            product: {
                title: title,
                price: price,
                description: description
            },
            hasErrors: true,
            errorMessage: 'Attached file is not an image.',
            validationErrors: []
        });
    }
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            product: {
                title: title,
                price: price,
                description: description
            },
            hasErrors: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
    const product = new Product({
        title: title, 
        price: price,
        imageUrl: image.path,
        description: description,
        userId: userId
    }); 
    product.save()
    .then((result)=>{
        res.redirect('/products');
    })
    .catch((err)=>{ 
        const error = new Error(err);                                       // creating a new error object
        error.httpStatusCode = 500;
        next(error);
        console.log(err);
    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;                                                 // we get result in string
    if (editMode === "false") {
        res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then((product)=>{
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            errorMessage: null,
            validationErrors: []
        });
    })
    .catch((err)=>{
        next(new Error(err));
    });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedtitle = req.body.title;
    const image = req.file;
    const updateddescription = req.body.description;
    const updatedprice = req.body.price;

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            product: {
                title: updatedtitle,
                price: updatedprice,
                description: updateddescription,
                _id: prodId
            },
            hasErrors: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product.findById(prodId)
    .then((product)=>{
        if(product.userId.toString() !== req.user._id.toString()){
            return res.redirect('/');
        }
        product.title = updatedtitle;
        product.price = updatedprice;
        if(image){
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = image.path;
        }
        product.description = updateddescription;
        return product.save()
        .then((result)=>{
            res.redirect('/admin/products');
        });
    })
    .catch((err)=>{
        next(new Error(err));
    });
}

exports.postDeleteProduct = (req, res, next) => {
    prodId = req.body.productId;
    Product.findById(prodId)
    .then((product)=>{
        if(!product){
            return next(new Error('Product not found'))
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id: prodId, userId: req.user._id})
    })
    .then((product)=>{
        res.redirect('/admin/products');
    })
    .catch((err)=>{
        next(new Error(err));
    });
}

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id})        
    .then((products) => {
        res.render('admin/products', {
            pageTitle: 'Admin Products',
            prods: products,
            path: '/admin/products'
        });
    })
    .catch((err) => {
        next(new Error(err));
    });
};
