const express = require("express");
const admin_route = express();
const session = require("express-session");
const config = require("../config/config");

const multer = require("multer");
const path = require("path");

admin_route.use(express.static('public'))


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
const auth = require("../middleware/adminAuth");
admin_route.use(
  session({
    secret: config.sessionSec,
  })
);

const bodyParser = require("body-parser");

admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

const adminController = require("../controllers/adminController");


// Routes
admin_route.get("/", auth.isLogout, adminController.loadLogin);
admin_route.post("/", adminController.verLogin);
admin_route.get("/home", auth.isLogin, adminController.loadDashboard);
admin_route.get("/logout", auth.isLogin, adminController.logout);
admin_route.get("/forget", auth.isLogout, adminController.forgetLoad);
admin_route.post("/forget", adminController.forgetVerified);
admin_route.get(
  "/forget-password",
  auth.isLogout,
  adminController.forgetPasswordLoad
);
admin_route.post("/forget-password", adminController.resetPassword);
admin_route.get("/dashboard", auth.isLogin, adminController.adminDashboardLoad);

admin_route.get("/new-user", auth.isLogin, adminController.newUserLoad);
admin_route.post("/new-user",upload.single('image'), adminController.addAlumni);

admin_route.post('/edit-user',adminController.updateAlumni)
admin_route.get('/edit-user',auth.isLogin,adminController.editAlumni)

admin_route.get('/delete-user',adminController.deleteAlumni)
admin_route.get("*", function (req, res, next) {
  if (req.path !== "/admin") {
    res.redirect("/admin");
  } else {
    next();
  }
});

module.exports = admin_route;
