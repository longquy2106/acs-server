// server/APIs/login.js
const client = require('../../../ConnectDatabase/his_ace')
require('dotenv').config();
module.exports = function (req, res) {
  var variables = {
  }
  console.log('after verify for chart');
  if (req) {
    // Câu lệnh truy vấn
    let query =
      `query MyQuery {
        his_ace_company_service_packs(order_by: {created_at: desc}, where: {is_accepted: {_eq: 0}}) {
          id
          code
          company_id
          company {
            name
          }
          name
          number_of_employees
          price
          register_year
          appointment_company_service_packs {
            id
            total_slot
            appointment_session {
              id
              name
              appointment_schedule {
                id
                date
              }
            }
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
        console.log('body.data', body.data);
        // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
        res.json(body.data)
      }).catch(function (err) {
        console.log(err.message)
      })
  } else {
  }
};