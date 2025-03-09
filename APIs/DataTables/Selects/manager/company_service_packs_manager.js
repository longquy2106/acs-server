// server/APIs/login.js
const client = require('../../../../ConnectDatabase/his_ace')
require('dotenv').config();
module.exports = function (req, res) {
  var variables = {
  }
  console.log('after verify for chart');
  if (req.query.id) {
    // Câu lệnh truy vấn
    let query =
      `query MyQuery {
              his_ace_company_service_packs(order_by: {created_at: desc}, where: {is_accepted: {_neq: 0}, company: {created_by: {_eq: "${req.query.id}"}}}) {
                id
                code
                company_id
                name
                number_of_employees
                price
                register_year
                is_accepted
                appointment_company_service_packs(order_by: {appointment_session: {appointment_schedule: {date: asc}, name: asc}}) {
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
                company {
                  name
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
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      })
  } else {
  }
};