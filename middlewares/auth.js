const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  try {
    console.log(req.query);
    let authHeader = null
    if (req.header('authentication')) {
      console.log("req.header('authentication')", req.header('authentication'));
      authHeader = req.header('authentication')
    } else if (req.body?.headers?.authentication) {
      console.log("req.body.headers.authentication", req.body.headers.authentication);
      authHeader = req.body.headers.authentication
    } else if (req.query?.headers?.authentication) {
      console.log("req.query.headers.authentication", req.query.headers.authentication);
      authHeader = req.query.headers.authentication
    }
    console.log('authHeader', authHeader)
    const verify = jwt.verify(authHeader, process.env.SECRET_KEY)
    console.log('verify', verify);
    if (!verify) {
      res.sendStatus(401);
    } else {
      req.verify = verify;
      next();
    }
  } catch (err) {
    res.sendStatus(401);
    console.log('auth false');
  }
}

module.exports = verifyToken