/* TO CHECK THE VALIDATION RESULT

const {validationResult} = require('express-validator');             // another property of 'express-validator' package


It gather all the errors introduced by the 'check' function in the routes being called on the 'request'

      const errors = validationResult(req);                          // storing errors in the error object
                            |
              calling validationResult on the 'request'           

if(!errors.isEmpty()){                                                      // isEmpty() - returns result in T/F
    return res.status(422).render({
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: errors.array()[0].msg                             // converting to array
    });
}

errors(ARRAY) = [{.., ..., ..., msg: errormessage}, {..., ..., ..., msg:____}, so on...]       // array of all the error objects
                                   |
                     'msg' key will store the error message(reason)
                     
status code - 422 = the server was unable to process the request because it contains invalid data


NOTE:- WE CAN SEND CUSTOMIZED ERROR MESSAGES:- In routes/auth.js
*/


const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');                       // built-in node.js library
const { validationResult } = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    // setting the empty array to null
    let resetMessage = req.flash('reset');
    if (resetMessage.length <= 0) {
        resetMessage = null;
    }
    let message = req.flash('error');
    if (message.length <= 0) {
        message = null;
    }
    let signupMessage = req.flash('signed');
    if (signupMessage.length <= 0) {
        signupMessage = null;
    }
    let updateMessage = req.flash('updated');
    if (updateMessage.length <= 0) {
        updateMessage = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message,                       // displaying error flash message
        signedupMessage: signupMessage,
        updatedMessage: updateMessage,
        resetMessage: resetMessage,
        oldInput: {emai:'', password: ''},
        validationErrors: []
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length <= 0) {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        errorMessage: message,
        oldInput: {email: '', password: '', confirmPassword: ''},
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            signedupMessage: null,
            updatedMessage: null,
            resetMessage: null,
            oldInput: {email: email, password: password},
            validationErrors: errors.array()
        });
    }
    User.findOne({email: email})
    .then((user)=>{
        if(!user){
            req.flash('error', 'User doesnot exist!')
            return res.redirect('/login');
        }
        bcrypt.compare(password, user.password)                     // user.password = our hashed password from database
        .then((result) => {
            if (result) {
                req.session.user = user;
                req.session.isLoggedIn = true;
                return req.session.save((err) => {
                    if (err) {
                        console.log(err);
                    }
                    res.redirect('/');
                });
            }
            req.flash('error', 'Invalid password!');
            res.redirect('/login');
        })
        .catch((err) => {
            console.log(err);
        });
    })
    .catch((err)=>{
        next(new Error(err));
    })
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup',
            path: '/signup',
            errorMessage: errors.array()[0].msg,                     // .array() - method of validationResult to convert to array
            oldInput: {email: email, password: password, confirmPassword: req.body.confirmPassword},
            validationErrors: errors.array()
        });
    }
    bcrypt.hash(password, 12)
        .then((hashedPassword) => {
            const newUser = new User({ email: email, password: hashedPassword, cart: { items: [] } });
            return newUser.save()
                .then((result) => {
                    req.flash('signed', 'Login to continue!');
                    res.redirect('/login');
                    return transporter.sendMail({
                        to: email,
                        from: 'divisha_40917703818@vipsedu.in',
                        subject: 'Successful signup',
                        text: 'You have successfully signed up!'
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
        })
        .catch((err) => {
            next(new Error(err));
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
};

exports.getResetPassword = (req, res, next) => {
    let message = req.flash('error');
    if (message.length <= 0) {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message
    });
};

exports.postResetPassword = (req, res, next) => {
    const email = req.body.email;
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                req.flash('error', 'Email doesnot exist!');
                return res.redirect('/reset');
            }
            crypto.randomBytes(32, (err, buffer) => {
                if (err) {
                    console.log(err);
                    return res.redirect('/');
                }
                const token = buffer.toString('hex');
                User.findOne({ email: email })
                    .then((user) => {
                        console.log('email', user)
                        user.resetToken = token;
                        user.resetTokenExpiration = Date.now() + 3600000;
                        return user.save();
                    })
                    .then(() => {
                        req.flash('reset', 'An email has been sent to your email account to reset your password.');
                        res.redirect('/login');
                        transporter.sendMail({
                            to: email,
                            from: 'divisha_40917703818@vipsedu.in',
                            subject: 'Password Reset',
                            html: `
                    <p>You requested a password reset.</p>
                    <p>Follow this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password. </p>`
                        });
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            });
        })
        .catch((err)=>{
            next(new Error(err));
        });
};

exports.getNewPassword = (req, res, next) => {
    let message = req.flash('error');
    if (message.length <= 0) {
        message = null;
    }
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then((user) => {
            res.render('auth/new-password', {
                pageTitle: 'Set new Password',
                path: '/new-password',
                userId: user._id.toString(),
                token: token,
                errorMessage: message
            });
        })
        .catch((err) => {
            next(new Error(err));
        });
};

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const newPassword = req.body.password;
    const newCnfPassword = req.body.confirmPassword;
    const token = req.body.token;
    if (newPassword !== newCnfPassword) {
        req.flash('error', 'Passwords do not match!');
        res.redirect(`/reset/${token}`);
    } else {
        User.findOne({ _id: userId, resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
            .then((user) => {
                if (!user) {
                    return res.redirect(`/reset/${token}`);
                }
                bcrypt.hash(newPassword, 12)
                    .then((hashedPassword) => {
                        user.password = hashedPassword;
                        user.resetToken = undefined;
                        user.resetTokenExpiration = undefined;
                        return user.save()
                    })
                    .then(() => {
                        req.flash('updated', 'Your password has been successfully updated!');
                        return res.redirect('/login');
                    });
            })
            .catch((err) => {
                next(new Error(err));
            });
    }
};


