// islogin auth
const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
    } else {
      res.redirect("/admin");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

// logout

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect("/admin/home");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

// export trhe modules
module.exports = {
  isLogin,
  isLogout,
};
