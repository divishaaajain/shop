/* VALIDATING USER INPUT

STEP-1: INSATLL PACKAGE:-       npm install -- save express-validator                                - express middleware

STEP-2: IMPORT PACKAGE:- 
            const expValidator = require('express-validator);                  
                            ORRR...
            const {check} = require('express-validator')                          // there are several other properties like {check}
                     |
destructuring the {check} property of the package that holds a function 


We validate incoming data i.e., data coming from POST request like email, password, etc.


STEP-3: TO VALIDATE EMAIL:- In the route where we get the POST request of the email:-

                                 or [array of field names]
                                           |
        router.post('/signup', check('fieldName').isEmail(), authController.postSignup);             
                                   |                   |
                       returns a middleware    returns a middleware

- fieldName = which field we want to validate    
- check('fieldName') = we want to check this field
- .isEmail() - check method what we want to perform on the field


E.g. router.post('/signup', check('email').isEmail(), authController.postSignup);                    // fieldName = email

NOTE:- 1. We are using this package to 'check' the 'email' field on the incoming request and it looks for that field in the BODY, QUERY PARAMETERS, HEADERS, COOKIES and when it finds the field(email) it check if the email is valid or not.

2. The 'check' property will only checkfor the validation i.e., if the email is valid or not (BOOLEAN VALUE). It will not terminate/block the false values. It will only store the result.


To perform opeartion on the valid/invalid value:- 'controllers/auth.js'



---> CUSTOMIZED ERROR MESSAGE

router.post('/signup', check('email').isEmail().withMessage('message'), authController.postSignup);

NOTE:- We can add multiple 'check' methods and customize their respective error messages with 'withMeassage('message')'. A particular 'withMessage()' will refer to method prior to it.             -- here withMessage contains the message of the method isEmail()





BUILT-IN CUSTOM VALIDATORS - .custom() function

We can add our own custom made validators.                    
                                                             object(location, path, req) from which we can extract our value (OPTIONAL)
                                                                               |
router.post('/signup', check('email').isEmail().withMessage().custom((value, {   })=>{
                                                                       |       
}));                                                       value of the field
                                                             we are checking

 
E.g. router.post('/signup', check('email').isEmail().withMessage().custom((value, {req})=>{                   // value = value from email
        if(value === 'test@test.com'){
            return new Error('Invalid email');                     // errorMessage
        }
        return true;
     }));

i.e., If we will give input as - 'test@test.com', we will get error 'Invalid email'.




WE CAN A DIFFERENT FUNCTION BESIDES 'CHECK'

         we use check to look for the field in header, cookie, params, query, body. We can pass a particular area like this to only look for the field in this (to use this we have to use this particluar function instead of check)
                |
const {check, body} = require('express-validator');                                          // body = function


                                                           body function   fieldName
                                                                      |       |
E.g., router.post('/signup', check('email').isEmail().withMessage(), body('password').isLength({min: 5}).isAlphanumeric());


isLength({min: _, max:__}) -  to set min and max characters a password should contain
isAlphanumeric() - password should only contain numbers and alphabets


NOTE:- In a middleware, we can add '.withMessage()' with every validator function. E.g., isLength().withMessage().isAlphanumeric().withMessage(), etc

To provide default '.withMessage()' with all the validators of a middleware, we can add the message as a second argument to the middleware function after the fieldName(I parameter)

                                                                                         errorMessage(II agrument)
                                                                                                  |                              
E.g., router.post('/signup', [check('email', 'Invalid password').isEmail().withMessage(), body('password').isLength({min: 5}).isAlphanumeric()]);                                       // WE CAN ASLO ENCLOSE THE CHECK MIDDLEWARES IN AN ARRAY

This will be applicable to all the validators inside the body middleware.                                                           




NOTE:- WE CAN ALSO ADD ASYNC FUNCTIONS IN THE VALIDATOR FUNCTIONS

router.post('/signup', check('email', 'Invalid password')
    .isEmail()
    .withMessage()
    .custom((value, {req})=>{
        return User.findOne({email: value})
            .then((user)=>{
                if (user)=>{
                    return Promise.reject('Email already exists');                       // error, otherwise no error
                }
            });
    }),





DATA SANITIZATION- To make user input uniform                            (Included in the express-validator package)

1. .normalizeEmail(email, [options]) - to make email:-

- case insensitive(converts all to lowercase)
- removes extra whitespaces from all ends
- removes sub-addresses(foo+bar@gmail.com - foo@gmail.com)                -- for doamins given in the sanitizer docs


2. .trim(input, [chars]) - removes extra white spaces from both ends

etcccc.....                                                                                                         */


const express = require('express');
// const expValidator = require('express-validator');                                
// Or...
const { check, body } = require('express-validator');                              // destructuring the 'check' property

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();


router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
    check('email', 'Invalid email or password')
        .isEmail()
        .normalizeEmail(),
    body('password', 'Invalid email or password')
        .isLength({min: 6})
        .isAlphanumeric()
        .trim()    
], authController.postLogin);

router.post('/signup', [
    body("email")
        .isEmail()
        .withMessage('Invalid user email!')
        .normalizeEmail()
        .custom((value, { req }) => {
            return User.findOne({email: value})
                .then((user)=>{
                    if(user){
                        return Promise.reject('Email already exists!');
                    }
                });
        }),
    body('password', "Password should be minimum 6 characters long and should only contain alphabets and numerals!")
        .trim()
        .isLength({ min: 6 })
        // .withMessage('Password should be minimum 6 characters long!')
        .isAlphanumeric(),
        // .withMessage('Password should only contain alphabets and numerals!'),
    body('confirmPassword')
        .trim()
        .custom((value, {req})=>{
            if(value !== req.body.password){
                throw new Error('Passwords do not match!')
            }
            return true;
        })
],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getResetPassword);

router.post('/reset', authController.postResetPassword);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;