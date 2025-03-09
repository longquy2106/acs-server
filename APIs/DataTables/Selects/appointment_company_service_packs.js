// server/APIs/login.js
const client = require('../../../ConnectDatabase/his_ace')
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = function (req, res) {
  var variables = {
  }
  console.log('after verify for chart');
  if (req.query) {
    // Câu lệnh truy vấn
    let query =
      `query MyQuery {
        his_ace_appointment_company_service_packs(order_by: {company_service_pack_id: asc, appointment_session: {appointment_schedule: {date: asc}}}) {
          id
          total_slot
          appointment_session_id
          company_service_pack_id
          appointment_session {
            id
            name
            total_slot
            appointment_schedule {
              id
              date
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
        // console.log('body.data', body.data);
        console.log('Lấy danh sách lịch hẹn của gói khám');
        const sessionPacks = []
        if (body.data?.his_ace_appointment_company_service_packs?.length > 0) {
          const tempSessionPacks = body.data.his_ace_appointment_company_service_packs
          for (let index = 0; index < tempSessionPacks.length; index++) {
            const tempSessionPack = {
              pack_id: null,
              session_id: null,
              session_name: null,
              date: null,
              session_pack_slots: 0,
              session_slots: 0,
              registered_patients: 0,
            };
            if (tempSessionPacks[index].company_service_pack_id) {
              tempSessionPack.pack_id = tempSessionPacks[index].company_service_pack_id
            }
            if (tempSessionPacks[index].appointment_session_id) {
              tempSessionPack.session_id = tempSessionPacks[index].appointment_session_id
            }
            if (tempSessionPacks[index].appointment_session?.name) {
              tempSessionPack.session_name = tempSessionPacks[index].appointment_session.name
            }
            if (tempSessionPacks[index].appointment_session?.appointment_schedule?.date) {
              tempSessionPack.date = tempSessionPacks[index].appointment_session.appointment_schedule.date
            }
            if (tempSessionPacks[index].appointment_session?.total_slot) {
              tempSessionPack.session_slots = tempSessionPacks[index].appointment_session.total_slot
            }
            if (tempSessionPacks[index].total_slot) {
              tempSessionPack.session_pack_slots = tempSessionPacks[index].total_slot
            }
            sessionPacks.push(tempSessionPack)
          }
        } else {
          console.log('không có data his_ace_appointment_company_service_packs');
        }
        // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
        res.json(sessionPacks)
      }).catch(function (err) {
        console.log(err.message)
      })
  } else {
  }
};