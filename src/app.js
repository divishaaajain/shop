/* NODE_ENV=production MONGO_USER=divishajain07 MONGO_PASSWORD=AXEFvtUYQVfNRFeq MONGO_DEFAULT_DATABASE=shop STRIPE_KEY=sk_test_51OudMmSA1EwednIRn7SZRkfYj3SM2mPe7h10quX79hOnvCG5s0uo1UaPVhVTLyaXLVGqfoKRiXaaaTdwkbkv1RDc00wbi5FBWQ

"engines": {
    "node": ">=18.18.0 <19.0.0"
  },

  ?retryWrites=true&w=majority&appName=Cluster1


-----------         DEPLOYMENT PREPARATION          ------------

NOTE:- ADD ASSET COMPRESSION, CONFIGURE LOGGING, USE SSL/TLS ARE OFTEN HANDLED BY THE HOSTING PROVIDERS FOR US


1. Setting environment variables
2. USe production API keys
3. Reduce error output details

4. Set Secure Response Headers:- [PACKAGE = HELMET] - to secure Express Apps by setting various HTTP headers to the responses we send

5. Add Asset Compression:- To reduce the size of the file we send to the client(js scripts, css files)    [PACKAGE = COMPRESSION]
- Most modern browsers are able to download compressed, so zipped assets and unzip them on the fly directly in the browser.

NOTE:- 1. IMAGE FILES ARE NOT COMPRESSED.
       2. MOST HOSTING PROVIDERS WILL DO IT FOR US AUTOMATICALLY


6. Configure Logging:- We should configure logging (log our http requests), so that we are aware of what is happening on our server. We should stream data into 'log files'                                                                         [PACKAGE = MORGAN]

          >  const morgan = require('morgan');

          >  const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});                   

- access.log = file name into which we want to stream our data
- flags: 'a' = to append the new entry to the old entry otherwise every new entry will overwrite the old entry

          >  app.use(morgan('combined', {stream: accessLogStream}));

- 'combined' - predefined format that includes some data that will be logged into the file like IP address of the client, the date-time of the request, http method, the requested URL, etc.                                -- There are other formats also

- stream = where to log data (if not set it will log data to console).



7. USING SSL/TLS                                                                   (TLS is newer version of SSL)

SSL - SECURE SOCKETS LAYER
TLS - TRANSPORT LAYER SECURITY

Both are used to encrypt data in transit, so that the data which is being sent to or by the server to the client can't be stolen by third-party. To enable the encryption and to decrypt it we work with 'PUBLIC KEY'(TO ENCRYPT) and 'PRIVATE KEY'(TO DECRYPT) pair. BOTH IS KNOWN TO THE SERVER.

In SSL certificate (which is created by a 'certificate authority', but we can also create our own SSL certificate(which is free) but browser will show warning (SSL not secure)for this case), we bind the publick key to the server identity(like admin email, domain, etc - details we provide while CREATING THE CERTIFICATE - IN TERMINAL).

The SSL certificate, therefore, connects the public key and server and sends it ot the client(browser), so that the client is also aware of the public key and knows to which server it belongs. Now, the CLIENT CAN ENCRYPT THE DATA which it sends to the server and the SERVER CAN DECRYPT IT WITH THE PRIVATE KEY (ONLY THIS CAN DECRYPT THE DATA).


'openssl' - to create the ssl certificate                      (windows don't have it by default)

- Google -> openssl windows -> Binaries OpenSSL -> slproweb (INSTALL IT)

1. After adding the path to the environment variables in our system -> restart the system

2. IN TERMINAL -- openssl req -nodes -new -x509 -keyout server.key -out server.cert

3. fill out the details:- Common name - domain name on which we host our app (for now, localhost)

4. Two files are generated:- (i) 'server.cert'(certifacte we have to give to client)   (ii) 'server.key'(private key which we keep secret)

5. Read these files synchronously before moving to middlewares to establish a secure connection

6. Import 'https' module (for secure connection) to create the server



NOW:- Manual configuration of SSL

const privateKey = fs.readFileSync('server.key');                         // Reading SSL privateKey and certificate
const certificate = fs.readFileSync('server.cert');


mongoose.connect(MONGODB_URI)
.then((connection)=>{
    https.createServer({key: privateKey, cert: certificate}, app).listen(process.env.PORT || 3000);    
}).catch();                             |                     |
                            configures the server        request handler (express app)


Use 'https://localhost:3000' instead of http


NOTE:- THIS ALL WILL BE DONE BY THE HOSTING PROVIDER, THEREOFRE WE DON'T HAVE TO SETT SSL KEYS AND CERTIFCATE AND HTTPS SERVER MANUALLY. WE WILL USE OUR NORMAL (app.listen()) INSTEAD OF THIs.                                                                        */


const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
const https = require('https');
const dotenv = require('dotenv').config();

const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const errorsController = require('./controllers/errors');
const User = require('./models/user');

const app = express();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster1.digrd5x.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;        
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();


// Reading SSL privateKey and certificate
const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
      return cb(null, 'public/images');
    },
    filename: (req, file, cb)=>{
        return cb(null, new Date().toISOString().replace(/:/g, '-')+'-'+file.originalname);
    }
});

const fileFilter = (req, file, cb)=>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});
console.log(path.join(__dirname, 'public', 'views'))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));


// app.use(helmet());                                     // setting secure response headers middleware
// app.use(compression());                                // adding asset compression middleware - we can also configure it here
// app.use(morgan('combined', {stream: accessLogStream}));         // adding log requests middleware

app.use(bodyParser.urlencoded({extended:false}));
app.use(multer({storage: storage, fileFilter: fileFilter}).single("image"));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/images', express.static(path.join(__dirname, 'public', 'images')));

app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(csrfProtection); 
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn,
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Storing session cookie user data in 'req.user'
app.use((req, res, next)=>{
    if(!req.session.user){                            // if we are not logged in
        return next();
    }
    User.findById(req.session.user._id)
    .then((user)=>{
        req.user = user;          // data from session cookie user
        next();
    })
    .catch((err)=>{
        next(new Error(err));
    });
});

app.use(shopRoutes);
app.use('/admin', adminRoutes);
app.use(authRoutes);

// app.use(errorsController.get500);                              // because we are handling error by error-handling middleware
app.use(errorsController.get404);

app.use((error, req, res, next)=>{                          // error-handling middleware
    res.status(500).render('500', {
        pageTitle:'Error!', 
        path:'/500'
    });
});

mongoose.connect(MONGODB_URI)
.then((connection)=>{
    // https.createServer({key: privateKey, cert: certificate}, app).listen(process.env.PORT || 3000);         // manual configuration of SSL
    app.listen(process.env.PORT || 3000);
})
.catch((err)=>{
    console.log(err);
});
