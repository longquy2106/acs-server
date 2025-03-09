// server/APIs/login.js
const client = require('../ConnectDatabase/his_ace')
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = function (req, res) {
  console.log('api login run');
  console.log('api login run2');
  console.log('req.query', req.query);
  console.log('req.param', req.param);
  // console.log('req', req);
  var variables = {
  }
  if (req.query && req.query.email && req.query.password) {
    // Câu lệnh truy vấn
    let queryLogin =
      `query MyQuery {
          his_ace_users(where: {email: {_eq: "${req.query.email}"}, password: {_eq: "${req.query.password}"}}) {
            id
            internal_hospital_id
            permission
            company_id
          }
        }

        `
    console.log('queryLogin', queryLogin);
    client.query(
      queryLogin,
      variables,
      function (req, res) {
        // callback trả về kết quả hoặc nếu có lỗi diễn ra
        if (res.status === 401)
          throw new Error('Not authorized')
      }).then(function (body) {
        console.log('body query Login', body?.data?.his_ace_users[0]?.id);
        if (body?.data?.his_ace_users[0]?.id) {
          console.log('process.env.SECRET_KEY', process.env.SECRET_KEY);
          // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
          // res.json(body.data)
          res.json({
            ToKen: jwt.sign({
              permission: body?.data?.his_ace_users[0]?.permission ? body?.data?.his_ace_users[0]?.permission : '',
              company_id: body?.data?.his_ace_users[0]?.company_id ? body?.data?.his_ace_users[0]?.company_id : '',
              id: body?.data?.his_ace_users[0]?.id ? body?.data?.his_ace_users[0]?.id : '',
            },
              process.env.SECRET_KEY,
              {
                expiresIn: "3 days"
              }),
            RefreshToken: jwt.sign({
              permission: body?.data?.his_ace_users[0]?.permission ? body?.data?.his_ace_users[0]?.permission : '',
              company_id: body?.data?.his_ace_users[0]?.company_id ? body?.data?.his_ace_users[0]?.company_id : '',
              id: body?.data?.his_ace_users[0]?.id ? body?.data?.his_ace_users[0]?.id : '',
            },
              process.env.REFRESS_SECRET_KEY,
              {
                expiresIn: "7 days"
              }),
            internal_hospital_id: body?.data?.his_ace_users[0]?.internal_hospital_id,
            permission: body?.data?.his_ace_users[0]?.permission ? body?.data?.his_ace_users[0]?.permission : '',
            company_id: body?.data?.his_ace_users[0]?.company_id ? body?.data?.his_ace_users[0]?.company_id : '',
            id: body?.data?.his_ace_users[0]?.id ? body?.data?.his_ace_users[0]?.id : '',
          })
        } else {
          console.log('else from loging!');
          res.json({
            ToKen: null
          })
        }
      }).catch(function (err) {
        console.log('err Login false!', err)
        res.status(500).json({ error: 'Login false!' });
      })
  } else {
    res.status(500).json({ error: 'Login false!' });
  }
};