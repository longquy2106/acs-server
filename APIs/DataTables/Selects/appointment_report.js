// server/APIs/login.js
const client = require('../../../ConnectDatabase/his_ace')
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = function (req, res) {
  var variables = {
  }
  console.log('after verify for chart');
  if (req.query?.rangeDate?.startDate && req.query?.rangeDate?.endDate) {
    const startDate = req.query.rangeDate?.startDate
    let tempEndDate = new Date(req.query.rangeDate?.endDate)
    tempEndDate.setDate(tempEndDate.getDate() + 1);
    const endDate = tempEndDate.toISOString()
    // Câu lệnh truy vấn
    let query =
      `query MyQuery {
      his_ace_patients(where: {company_service_pack: {created_at: {_gte: "${startDate}"}, _and: {created_at: {_lte: "${endDate}"}}}}) {
        id
        email
        birthday
        medical_code
        phone_number
        fullname
        is_mess_sent
        checkin_date
        checkout_date
        appointment_session {
          id
          name
          appointment_schedule {
            id
            date
          }
        }
        company_service_pack {
          id
          name
          company {
            id
            name
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
        if (!res.headersSent) {
          res.status(500).send('Lấy báo cáo không thành công!');
        }
      })
  } else {
    if (!res.headersSent) {
      console.log('Không đủ params!');

      res.status(500).send('Không đủ params!');
    }
  }
};