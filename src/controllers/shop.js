/* stripe.redirectToCheckout({}) - It will redirect the user to some of stripe's pages where the user then enters the 'payment_method' details. Once the payment is done/confirmed there, the user is redirected back to the website. 


TO GET SESSIONID:- 

STEP:1 - Install 'stripe' package                    --         npm install --save stripe

STEP-2: - Import stripe package    

const stripe = require('stripe')('PRIVATE STRIPE KEY');                  - Always keep this key private in node.js
                          |
          this gives us a function to which we need to pass our 'PRIVATE STRIPE KEY'



Now in 'getCheckout':-

1. 'stripe.checkout.sessions.create({CONFIGURING OPTIONS})' - method provided by stripe API to create a new checkout session. This method is 

used to initiate the checkout process and generate a sessionID, which is then used to redirect the customer to the stripe checkout page where they can complete the payment.


CONFIGURING OPTIONS:- There are several other options as well

1. payment_method_types:- which payment methods we want to accept for payment - ['card', 'ideal'] etc.              // card = debit + credit

2. line_items:- allows to specify the details of the items to be checked out.

(i) name: title of the product
(ii) amount: amount(price) in cents                - *100
(iii) currency: currency of the country            - 'usd' = us dollar

3. success_url:- to redirect the customers to a specific URL after a successful payment

4. cancel_url:- to redirect the customers to a specific URL if they cancel the payment or the payment is cancelled due to any reason
*/


const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_KEY);     // private or test key
const Product = require('../models/product');
const Order = require('../models/orders');

const ITEMS_PER_PAGE = 2

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalProducts, lastPage;
    Product.find()
    .countDocuments()
    .then((num)=>{
        totalProducts = num;
        lastPage = Math.ceil(totalProducts/ITEMS_PER_PAGE);
        return Product.find()
        .skip((page-1)*ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
        res.render('shop/product-list', {
            pageTitle: 'All Products',
            prods: products,
            path: '/products',
            hasNextPage: page<lastPage,
            hasPreviousPage: page>1,
            nextPage: page+1,
            previousPage: page-1,
            lastPage: lastPage,
            currentPage: page
        });
    }).catch((err) => {
        next(new Error(err));
    });
};

exports.getProductDetails = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
    .then((product)=>{
        res.render('shop/product-detail', {
            product: product, 
            pageTitle: product.title, 
            path: '/products'
        });
    })
    .catch((err)=>{
        next(new Error(err));
    });
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;                                     // for localhost:3000/ - page = NaN, Therefore, page = 1
    let totalProducts, lastPage;
    Product.find()
    .countDocuments()                                    // to count total products
    .then((num)=>{
        totalProducts = num;
        lastPage = Math.ceil(totalProducts/ITEMS_PER_PAGE);
        return Product.find()
        .skip((page-1)*ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products)=>{
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/',
            hasNextPage: page<lastPage,
            hasPreviousPage: page>1,
            nextPage: page+1,
            previousPage: page-1,
            lastPage: lastPage,
            currentPage: page
        });
    })
    .catch((err)=>{
        next(new Error(err));
    })
};

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')                     // accessing the reference field
    .then((user)=>{
        // console.log(user)                                      // full user info because we are also accessing the user
        let totalPrice=0;
        const productsData = user.cart.items;                     // user.cart.items = populated with product info + qty
        productsData.forEach((prod)=>{
            totalPrice+=(prod.productId.price*prod.quantity);
        });
        res.render('shop/cart', {
            pageTitle: 'Your Cart',
            path: '/cart',
            products: productsData,
            totalPrice: totalPrice.toFixed(2)
        });
    })
    .catch((err)=>{
        next(new Error(err));
    });      
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.addToCart(prodId)
    .then((result)=>{
        res.redirect('/products');
    })
    .catch((err)=>{
        next(new Error(err));
    })
};

exports.postDeleteCartItem = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.deleteFromCart(prodId)
    .then((result)=>{
        res.redirect('/cart');
    })
    .catch((err)=>{
        next(new Error(err));
    });
}

exports.getCheckout = (req, res, next) =>{
    let totalPrice = 0;
    let productsData;
    req.user.populate('cart.items.productId')               
    .then((user)=>{                             
        productsData = user.cart.items;                    
        productsData.forEach((prod)=>{
            totalPrice+=(prod.productId.price*prod.quantity);
        });
        return stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: productsData.map((p)=>{                     // looping through all the items for checkout
                return {
                    price_data: {
                        unit_amount: p.productId.price * 100,                             // amount in cents
                        currency: 'usd',
                        product_data: {
                            name: p.productId.title,
                            description: p.productId.description,
                        }
                    },
                    quantity: p.quantity
                }
            }),
            mode: 'payment',
            success_url: req.protocol+'://'+req.get('host')+'/checkout/success',     // protocol = http or https
            cancel_url: req.protocol+'://'+req.get('host')+'/checkout/cancel'       // req.get('host') - to get the host name (localhost:3000)
        });                                                                        // https://localhost:3000/checkout/success
    })
    .then((session)=>{                                                // returns a session
        res.render('shop/checkout', {
            pageTitle: 'Checkout',
            path: '/checkout',
            products: productsData,
            totalPrice: totalPrice.toFixed(2),
            sessionId: session.id                        // session object we get in return
        });
    })
    .catch((err)=>{
        next(new Error(err));
    });
};

exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id}).select('products')
    .then((orders)=>{
        res.render('shop/orders', {
            pageTitle: 'Your Orders', 
            path: '/orders',
            orders: orders
        });
    })
    .catch((err)=>{
        next(new Error(err));
    });
};

exports.postOrder = (req, res, next)=>{
    return req.user.populate('cart.items.productId')
    .then((user)=>{
        const productData = user.cart.items.map((item)=>{
            return {product: {...item.productId}, quantity: item.quantity}
        });
        const order = new Order({
            products: productData,
            user : {
                userId: user._id,
                email: user.email
            }
        });
        return order.save();
    })
    .then((result)=>{
        req.user.clearCart();
    })
    .then((result)=>{
        res.redirect('/orders');
    })
    .catch((err)=>{
        next(new Error(err));
    });
};

exports.getInvoice = (req, res, next)=>{
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then((order)=>{
        if(!order){
            return next(new Error('No order found'));
        }
        if(req.user.id.toString() !== order.user.userId.toString()){
            return next(new Error('Unauthorized!'));
        }
        const invoiceName = `invoice-${orderId}.pdf`;
        const filePath = path.join(__dirname, '../', 'data', 'invoices', invoiceName);           // path of the file

        // fs.readFile(filePath, (err, data)=>{                                         // normal method - to read small files
        //     if (err){
        //         return next(new Error(err));
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', 'inline; filename="'+invoiceName+'"');
        //     res.send(data);
        // });


        // const file = fs.createReadStream(filePath);                                     // method for heavy files
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', `inline; filename=${invoiceName}`);
        // file.pipe(res);


        // USING PDFKIT - Generating pdf on fly

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${invoiceName}`);
        pdfDoc.pipe(fs.createWriteStream(filePath));
        pdfDoc.pipe(res);
        
        pdfDoc.fontSize(26).text('Invoice', {
            underline: true
        });
        pdfDoc.text('-----------------------------------');
        let totalPrice = 0;
        order.products.forEach((prod, idx)=>{
            pdfDoc.fontSize(16).text(`${idx+1}. ${prod.product.title}`);
            pdfDoc.fontSize(16).text(`Price:- $${prod.product.price} x ${prod.quantity} = $${prod.product.price*prod.quantity}`);
            pdfDoc.moveDown();                                                    // to leave space
            totalPrice+=(prod.product.price*prod.quantity);
        });
        pdfDoc.fontSize(26).text('-----------------------------------');
        pdfDoc.fontSize(18).text(`Total Price = $${totalPrice.toFixed(2)}`);
        pdfDoc.end();
    })
    .catch((err)=>{
        next(new Error(err));
    });
    
};