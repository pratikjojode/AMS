const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/alumni_management_system");

const express = require("express");
const session = require("express-session"); 
const app = express();

app.use(session({
  secret: 'secret', 
  resave: false,
  saveUninitialized: false
}));

// user routes
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);


// admin routes
const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

app.listen(3000, () => {
  console.log("server is running");
});
