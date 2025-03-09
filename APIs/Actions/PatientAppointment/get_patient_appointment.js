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
  let bodyCount = []
  console.log('verify get-patient-appointment', req.verify);
  if (req.verify?.id && (req.verify?.email || req.verify?.phone_number)) {
    let query =
      `query MyQuery {
        his_ace_patients(where: {id: {_eq: "${req.verify.id}"}}) {
          id
          medical_code
          fullname
          birthday
          phone_number
          email
          company_service_pack_id
          appointment_session_id
          company_service_pack {
            id
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
          }
        }
      } 
      `
    console.log('query session and mail', query);
    await client.query(
      query,
      variables,
      function (req, res) {
        // callback trả về kết quả hoặc nếu có lỗi diễn ra
        if (res.status === 401)
          throw new Error('Not get patient info!')
      }).then(async function (body) {
        console.log('body.data', body.data);
        if (body.data?.his_ace_patients[0]?.company_service_pack?.appointment_company_service_packs?.length > 0) {
          const tempSessionPacks = body.data.his_ace_patients[0].company_service_pack.appointment_company_service_packs
          const tempSessions = []
          for (let index = 0; index < tempSessionPacks.length; index++) {
            tempSessions.push({
              session_id: tempSessionPacks[index].appointment_session.id,
              pack_id: body.data?.his_ace_patients[0]?.company_service_pack_id
            })
          }
          if (tempSessions.length > 0) {
            for (let index2 = 0; index2 < tempSessions.length; index2++) {

              const totalPatientVariables = {}
              let queryTotalPatient =
                `query totalPatient {
                  his_ace_patients_aggregate(where: {appointment_session_id: {_eq: ${tempSessions[index2].session_id}}, company_service_pack_id: {_eq: ${tempSessions[index2].pack_id}}}) {
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
              console.log('queryTotalPatient', queryTotalPatient);
              await client.query(
                queryTotalPatient,
                totalPatientVariables,
                function (req, res) {
                  // callback trả về kết quả hoặc nếu có lỗi diễn ra
                  if (res.status === 401)
                    throw new Error('Not get patient aggregate!')
                }).then(function (tempBodyCount) {
                  if (tempBodyCount.data?.his_ace_patients_aggregate?.aggregate?.count || tempBodyCount.data?.his_ace_patients_aggregate?.aggregate?.count === 0) {
                    tempSessions[index2].total_patient = tempBodyCount.data?.his_ace_patients_aggregate?.aggregate?.count
                  }
                  bodyCount.push(tempSessions[index2])
                  console.log('bodyCount', bodyCount);
                  console.log('tempSessions', tempSessions);
                }).catch(function (err) {
                  console.log('error: his_ace_patients_aggregate', err.message)
                })
            }
          }
        }

        // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
        res.json({
          data: body.data,
          data_count: bodyCount,
          acceptLogin: true
        })
      }).catch(function (err) {
        console.log(err.message)
      })
  }
};