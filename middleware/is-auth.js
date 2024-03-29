/* TO PROTECT THE ROUTES FROM GETTING NORAMLLY ACCESSED

We can add a check on every controller action but it will be a cumbersome process. Instead, we can create a new middleware and put the check in it and then pass it to the desired routes we want to protect from being accessed.

NOTE:- WHILE SETTING A ROUTE WE CAN PASS AS MANY MIDDLEWARES AS WE WANT, THE REQUEST MOVES FROM LEFT TO RIGHT.                 */


module.exports = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/login');
    }
    next();
};