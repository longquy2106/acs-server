// server/APIs/login.js
const { query } = require('express');
const client = require('../../../ConnectDatabase/his_ace')
require('dotenv').config();
module.exports = async function (req, res) {
  // console.log('req.body.package_add', req.body.package_add);
  // console.log('req.body.package_add.session_packs', req.body.package_add.session_packs);
  // console.log('req after verify', req);
  var variables = {
  }
  console.log('req.query.pack_id', req.query.pack_id);
  if (req.query?.pack_id && req.query?.session_id) {
    console.log('req.query.pack_id', req.query.pack_id);
    let query =
      `query totalPatient {
        his_ace_patients_aggregate(where: {appointment_session_id: {_eq: ${req.query.session_id}}, company_service_pack_id: {_eq: ${req.query.pack_id}}}) {
          aggregate {
            count
          }
          nodes {
            company_service_pack_id
            appointment_session_id
          }
        }
      }
      `
    await client.query(
      query,
      variables,
      function (req, res) {
        // callback trả về kết quả hoặc nếu có lỗi diễn ra
        if (res.status === 401)
          throw new Error('Not get patient info!')
      }).then(async function (body) {
        console.log('body.data', body.data);
        let patientCount = -1;
        if (body.data?.his_ace_patients_aggregate?.aggregate?.count || body.data?.his_ace_patients_aggregate?.aggregate?.count === 0) {
          patientCount = body.data?.his_ace_patients_aggregate?.aggregate?.count
        }

        // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
        res.json(patientCount)
      }).catch(function (err) {
        console.log(err.message)
      })
  }
};