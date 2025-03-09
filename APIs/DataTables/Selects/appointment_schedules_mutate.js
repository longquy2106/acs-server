// server/APIs/login.js
const client = require('../../../ConnectDatabase/his_ace')
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = function (req, res) {
    var variables = {
    }
    console.log('after verify for chart');
    if (req.query && req.query.internal_hospital_id) {
        console.log('req.query.internal_hospital_id', Number(req.query.internal_hospital_id));
        const dateNow = new Date()

        // Tăng thêm 3 ngày
        dateNow.setDate(dateNow.getDate() + 4);

        // Chuyển đổi thanhd chuỗi định dạng ISO
        const threeDaysLater = dateNow.toISOString().split('T')[0]

        console.log('dateNow', threeDaysLater);
        // Câu lệnh truy vấn
        let query =
            `query MyQuery {
        his_ace_appointment_schedules(order_by: {date: asc}, where: {date: {_gte: "${threeDaysLater}"}}) {
          id
          date
          appointment_sessions (order_by: {name: asc}){
            id
            name
            total_slot
            appointment_company_service_packs {
              id
              total_slot
              company_service_pack_id
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
                let permission = null;
                if (req.verify?.permission) {
                    permission = req.verify?.permission
                }
                console.log('req.verify', req.verify);
                res.json({
                    his_ace_appointment_schedules: body.data?.his_ace_appointment_schedules,
                    permission
                })
            }).catch(function (err) {
                console.log(err.message)
            })
    } else {
    }
};