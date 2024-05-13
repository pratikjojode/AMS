const User = require("../models/userModels");
const bcrypt = require("bcrypt");
const nodeMailer = require("nodemailer");
const randomSring = require("randomstring");
const config = require("../config/config");

// for hashing
const securePass = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    throw new Error("Error hashing password");
  }
};

// Verify mail method
const sendVerifyMail = async (name, email, user_id) => {
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
      subject: "This mail is for verification",
      html:
        "<p>Hello " +
        name +
        ', Check here to <a href="http://127.0.0.1:3000/verify?id=' +
        user_id +
        '">Verify</a> your mail</p>',
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

const loadRegister = (req, res) => {
  res.render("registration");
};

const insertAlumni = async (req, res) => {
  try {
    const tightpass = await securePass(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      image: req.file ? req.file.filename : "",
      password: tightpass,
      is_admin: 0,
      branch: req.body.branch,
      year: req.body.year,
    });

    // Validate user data before saving
    const validationError = user.validateSync();
    if (validationError) {
      throw new Error(validationError.message);
    }

    const savedUser = await user.save();

    if (savedUser) {
      sendVerifyMail(req.body.name, req.body.email, savedUser._id);
      res.render("registration", { message: "User registered successfully" });
    } else {
      res.render("registration", { message: "Registration failed" });
    }
  } catch (error) {
    console.log(error.message);
    res.render("registration", { message: "An error occurred" });
  }
};

const verifyMail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );
    console.log(updateInfo);
    res.send("Email verified successfully!");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred while verifying email.");
  }
};

// Login methods for users

const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// logout user
const userLogout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
      } else {
        res.redirect("/login");
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          res.render("login", { message: "Please verify your email" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("login", { message: "Email and password are incorrect" });
      }
    } else {
      res.render("login", { message: "Wrong email or password" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// edit profile

const editProfile = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// update profile

const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            image: req.file.filename,
            branch: req.body.branch, 
            year: req.body.year,
          },
        }
      );
    } else {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            branch: req.body.branch, 
            year: req.body.year,
          },
        }
      );
    }
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

// load home
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("home", { user: userData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Forget password methods

const forgetload = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
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
      html: `<p>Hello ${name}, Click <a href="http://127.0.0.1:3000/forget-password?token=${token}">here</a> to reset your password</p>`,
    };

    const info = await mailTransport.sendMail(mailOptions);
    console.log("Email sent successfully", info.response);
  } catch (error) {
    console.log(error.message);
    throw new Error("Error sending reset password email");
  }
};

// forget verify
const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_verified === 0) {
        res.render("forget", { message: "Please verify your email" });
      } else {
        const randomstring = randomSring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomstring } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomstring);
        res.render("forget", {
          message: "Check your email for password reset instructions.",
        });
      }
    } else {
      res.render("forget", { message: "Wrong email, please check" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// forget password load

const forgetpassawordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// reset pass
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const secure_pass = await securePass(password);

    const updatedData = await User.findByIdAndUpdate(user_id, {
      $set: { password: secure_pass, token: "" },
    });
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// for verifivation2nd time for link

const verificationLoad = async (req, res) => {
  try {
    res.render("verification");
  } catch (error) {
    console.log(error.message);
  }
};

const sendVerificationLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      sendVerifyMail(userData.name, userData.email, userData._id);
      res.render("verification", {
        message: "resend verification mail ,please check gmail",
      });
    } else {
      res.render("verification", { message: "This email Dosent exist" });
    }
  } catch (error) {
    console.log(error.message);
  }
};



// user-home

const renderUserHome=async(req,res)=>{
  try {
    
   
    res.render('user-home')
  } catch (error) {
    console.log(error);
    res.status(500).send("INternal server error")
  }
}

module.exports = {
  loadRegister,
  insertAlumni,
  verifyMail,
  loginLoad,
  verifyLogin,
  loadHome,
  forgetload,
  forgetVerify,
  forgetpassawordLoad,
  resetPassword,
  userLogout,
  verificationLoad,
  sendVerificationLink,
  editProfile,
  updateProfile,
  renderUserHome
  
};
