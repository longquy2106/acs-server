// server/APIs/login.js
const client = require('../../../../ConnectDatabase/his_ace')
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = function (req, res) {
  var variables = {
  }
  const user = req?.query?.user
  console.log('after verify for chart');
  function isUUID(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
  if (req?.query?.user?.id && isUUID(req.query.user.id) && req.query?.rangeDate?.startDate && req.query?.rangeDate?.endDate) {
    const startDate = req.query.rangeDate?.startDate
    let tempEndDate = new Date(req.query.rangeDate?.endDate)
    tempEndDate.setDate(tempEndDate.getDate() + 1);
    const endDate = tempEndDate.toISOString()
    // Câu lệnh truy vấn
    let query =
      `query MyQuery {
        his_ace_patients(where: {company_service_pack: {created_at: {_gte: "${startDate}"}, _and: {created_at: {_lte: "${endDate}"}},  company: {created_by: {_eq: "${req.query.user.id}"}}}}) {
          id
          medical_code
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
          throw new Error('Lỗi khi lấy báo cáo!')
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
      console.log('Không đủ params 2!');

      res.status(500).send('Không đủ params 2!');
    }
  }
};