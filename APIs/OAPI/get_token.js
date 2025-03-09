
const jwt = require('jsonwebtoken');
const client = require('../../ConnectDatabase/his_ace')
module.exports = function (req, res) {
  const { email, password } = req.body
  var variables = {
  }
  if (email && password) {
    // Câu lệnh truy vấn
    let queryLogin =
      `query MyQuery {
          his_ace_users(where: {email: {_eq: "${email}"}, password: {_eq: "${password}"}}) {
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
              })
          })
        } else {
          console.log('else from get token!');
          res.json({
            ToKen: null
          })
        }
      }).catch(function (err) {
        console.log('err Get token false!', err)
        res.status(500).json({ error: 'Get token false!' });
      })
  } else {
    res.status(500).json({ error: 'Get token false!' });
  }
}