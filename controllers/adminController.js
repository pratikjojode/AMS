const User = require("../models/userModels");
const bcrypt = require("bcrypt");
const session = require("express-session");
const randomString1 = require("randomstring");
const config = require("../config/config");
const nodeMailer = require("nodemailer");

// for hashing
const securePass = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    throw new Error("Error hashing password");
  }
};

// Reset password
const sendResetPasswordMail = async (name, email, token) => {
  try {
    const mailTransport = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "Reset Password Verification",
      html: `<p>Hello ${name}, Click <a href="http://127.0.0.1:3000/admin/forget-password?token=${token}">here</a> to reset your password</p>`,
    };

    const info = await mailTransport.sendMail(mailOptions);
    console.log("Email sent successfully", info.response);
  } catch (error) {
    console.log(error.message);
    throw new Error("Error sending reset password email");
  }
};

// Verify mail method
const addUserMail = async (name, email, password, user_id) => {
  try {
    const mailTransport = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "Admin can add you and verify mail",
      html:
        "<p>Hello " +
        name +
        ', Check here to <a href="http://127.0.0.1:3000/verify?id=' +
        user_id +
        '">Verify</a> your mail</p> <br> <b>Email:</b>+' +
        email +
        "<br>" +
        password +
        "",
    };
    mailTransport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        throw new Error("Error sending verification email");
      } else {
        console.log("Email sent successfully", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
    throw new Error("Error sending verification email");
  }
};

// Load login page
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

// Verify login credentials
const verLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 1) {
          req.session.user_id = userData._id;
          res.redirect("/admin/home");
        } else {
          res.render("login", { message: "" });
        }
      } else {
        res.render("login", { message: "Email and password are incorrect." });
      }
    } else {
      res.render("login", { message: "Email and password are incorrect." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Load admin dashboard
const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("home", { admin: userData });
  } catch (error) {
    console.log(error.message);
  }
};

// const adminDashboard = async (req, res) => {
//   try {
//     res.render("dashboard");
//   } catch (error) {
//     console.log(error.message);
//   }
// };
// logout method

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

// forget method

const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

// forget verified method
const forgetVerified = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.is_admin == 0) {
        res.render("forget", { message: "Wrong credentials" });
      } else {
        const randomString = randomString1.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomString);
        res.render("forget", {
          message: "Pzz check your mail for reset password",
        });
      }
    } else {
      res.render("forget", { message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// forgetPasswordLoad

const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokendata = await User.findOne({ token: token });

    if (tokendata) {
      res.render("forget-password", { user_id: tokendata._id });
    } else {
      res.render("404", { message: "Invalid Link" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// resert password fro foregt

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const securePassword = await securePass(password);
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: securePassword, token: "" } }
    );
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
// dashboard method
const adminDashboardLoad = async (req, res) => {
  try {
    const userData = await User.find({ is_admin: 0 });
    res.render("dashboard", { users: userData });
  } catch (error) {
    console.log(error.message);
  }
};

// add new user froma admin method

const newUserLoad = async (req, res) => {
  try {
    res.render("new-user");
  } catch (error) {
    console.log(error.message);
  }
};

// add new alumin

const addAlumni = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const image = req.file.filename;
    const password = randomString1.generate(8);
    const branch = req.body.branch; 
    const year = req.body.year; 

    const spassword = await securePass(password);
    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      image: image,
      password: spassword,
      is_admin: 0,
      branch: branch, // Include branch field
      year: year, // Include year field
    });

    const userData = await user.save();

    if (userData) {
      addUserMail(name, email, password, userData._id);
      res.redirect("/admin/dashboard");
    } else {
      res.render("new-user", { message: "something went wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// editAlumni

const editAlumni = async (req, res) => {
  try {
    const _id = req.query.id;
    const userData = await User.findById({ _id: _id });
    if (userData) {
      res.render("edit-user", { user: userData });
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// updateAlumni
const updateAlumni = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          is_verified: req.body.is_verified,
          branch: req.body.branch, // Include branch field
          year: req.body.year, // Include year field
        },
      }
    );

    if (userData) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("edit-user", { message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// deleteAlumni

const deleteAlumni = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.deleteOne({ _id: id });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  verLogin,
  logout,
  forgetLoad,
  forgetVerified,
  sendResetPasswordMail,
  forgetPasswordLoad,
  resetPassword,
  securePass,
  loadDashboard,
  adminDashboardLoad,
  newUserLoad,
  addAlumni,
  addUserMail,
  editAlumni,
  updateAlumni,
  deleteAlumni,
};
