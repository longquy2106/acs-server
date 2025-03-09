const jwt = require('jsonwebtoken');
const conn = require('../ConnectDatabase')
require('dotenv').config();

const check = (async (req, res, next) => {
    let a = new Promise(function checkUserPassUser(resolve) {

    })
    if ((await a).Result) {
        let result = (await a);
        res.json({
            ToKen: jwt.sign({
                user: result.IDUser,
                permisstion: result.Permission
            },
                process.env.SECRET_KEY,
                {
                    expiresIn: "3 days"
                }),
            RefreshToken: jwt.sign({
                user: result.IDUser,
                permisstion: result.Permission
            },
                process.env.REFRESS_SECRET_KEY,
                {
                    expiresIn: "7 days"
                }),
        })
        next();
    }
    else
        res.sendStatus(401);
})

module.exports = check;