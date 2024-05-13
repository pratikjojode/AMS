const isLogin = async (req, res, next) => {
    try {
      if (req.session.user_id) {
       
        next();
      } else {
        
        res.redirect("/login");
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  
  const isLogOut = async (req, res, next) => {
    try {
      if (req.session.user_id) {
       
        res.redirect("/home");
      } else {
      
        next();
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  
  module.exports = {
    isLogin,
    isLogOut,
  };
  