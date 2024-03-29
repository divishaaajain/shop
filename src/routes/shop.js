const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProductDetails)                      // :productId = route parameter

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postDeleteCartItem);

router.get('/checkout', isAuth, shopController.getCheckout);

router.get('/checkout/success', shopController.postOrder);                // in case of payment success, redirect to orders page

router.get('/checkout/cancel', shopController.getCheckout);               // in case of payment cancel, redirect to checkout page again

// router.post('/create-order', isAuth, shopController.postOrder);        // we dont need this anymore

router.get('/orders', isAuth, shopController.getOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;

