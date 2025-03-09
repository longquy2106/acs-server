// server/APIs/login.js
const client = require('../../../ConnectDatabase/his_ace')
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = function (req, res) {
  var variables = {
  }
  console.log('after verify for chart');
  if (req.query?.pack_id) {
    // Câu lệnh truy vấn
    let query =
      `query MyQuery {
        his_ace_patients(order_by: {created_at: desc}, where: {company_service_pack_id:{_eq: ${req.query.pack_id}}}) {
          id
          medical_code
          fullname
          birthday
          phone_number
          email
          company_service_pack_id
          appointment_session_id
          appointment_session {
            id
            name
            appointment_schedule {
              id
              date
            }
          }
          shortlink {
            id
            short_url
          }
        }
      }
    `
    client.query(
      query,
      variables,
      function (req, res) {
        // callback trả về kết quả hoặc nếu có lỗi diễn ra
        if (res.status === 401)
          throw new Error('Not authorized')
      }).then(function (body) {
        // console.log('body.data', body.data);
        console.log('Lấy danh sách bệnh nhân theo gói khám');
        // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
        res.json(body.data)
      }).catch(function (err) {
        console.log(err.message)
      })
  } else {
  }
};