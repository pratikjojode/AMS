const express = require("express");
const user_route = express();
const session = require("express-session");
const config = require("../config/config");
const auth = require("../middleware/auth");
const userController = require("../controllers/alumniController");
const multer = require("multer");
const path = require("path");

// Session middleware
user_route.use(
  session({
    secret: config.sessionSec,
    resave: false,
    saveUninitialized: false
  })
);

// View engine setup
user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");



// static path

user_route.use(express.static('public'))
// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/userImages"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});
const upload = multer({ storage: storage });

// Body parser middleware
user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

// Routes
user_route.get("/register", auth.isLogOut, userController.loadRegister);
user_route.get("/verify", userController.verifyMail);
user_route.post("/register", upload.single("image"), userController.insertAlumni);
user_route.post("/login", userController.verifyLogin);
user_route.get("/", auth.isLogOut, userController.loginLoad);
user_route.get("/login", auth.isLogOut, userController.loginLoad);
user_route.get("/home", auth.isLogin, userController.loadHome);
user_route.get("/logout", auth.isLogin, userController.userLogout); 
user_route.get("/forget", auth.isLogOut, userController.forgetload);
user_route.post("/forget", userController.forgetVerify);
user_route.get('/forget-password', auth.isLogOut, userController.forgetpassawordLoad);
user_route.post('/forget-password', userController.resetPassword);
user_route.get('/verification', userController.verificationLoad);
user_route.post('/verification', userController.sendVerificationLink);
user_route.get('/edit',auth.isLogin,userController.editProfile)
user_route.post('/edit',upload.single('image'),userController.updateProfile)

// user home rouyte
user_route.get('/user-home',userController.renderUserHome);

module.exports = user_route;
