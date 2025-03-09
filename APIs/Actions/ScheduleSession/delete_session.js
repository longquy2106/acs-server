// server/APIs/login.js
const { query } = require('express');
const { request, gql } = require('graphql-request');
require('dotenv').config();

const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
require('dotenv').config();
module.exports = function (req, res) {
  console.log('deleting...');
  console.log('req.verify', req.verify);
  console.log('req.query', req.body ? req.query : 'không có req.query');
  if (req.body && req.body.session_pack_id && req.verify && req.body.schedule_pack_id) {
    // Câu lệnh truy vấn
    console.log(req.body.session_pack_id);

    const insert = gql`
          mutation MyMutation {
            delete_his_ace_appointment_sessions(where: {id: {_eq: ${req.body.session_pack_id}}}) {
            affected_rows
              returning {
                id
              }
            }
          }
        `;
    const variables = {
    };
    request(endpoint, insert, variables, headers)
      .then(function (data) {
        console.log(data)
        const selectSchedule = gql`
          query MyQuery {
            his_ace_appointment_schedules(order_by: {date: asc}, where: {id: {_eq: "${req.body.schedule_pack_id}"}}) {
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
        `;
        const variableSchedules = {
        };
        request(endpoint, selectSchedule, variableSchedules, headers)
          .then(function (data) {
            console.log('schedule data', data)
            if (data.his_ace_appointment_schedules[0]?.date && data.his_ace_appointment_schedules[0]?.appointment_sessions?.length === 0) {
              console.log(`lịch ngày ${data.his_ace_appointment_schedules[0]?.date} trống`);
              const deleteSchedule = gql`
                mutation MyMutation {
                  delete_his_ace_appointment_schedules(where: {id: {_eq: ${req.body.schedule_pack_id}}}) {
                    affected_rows
                    returning {
                      id
                      date
                    }
                  }
                }
              `;
              const variableDeleteSchedules = {
              };
              request(endpoint, deleteSchedule, variableDeleteSchedules, headers)
                .then(function (data) {
                  console.log('schedule delete data', data)
                })
            } else if (data.his_ace_appointment_schedules[0]?.date && data.his_ace_appointment_schedules[0]?.appointment_sessions?.length) {
              console.log(`lịch ngày ${data.his_ace_appointment_schedules[0].date} còn ${data.his_ace_appointment_schedules[0].appointment_sessions.length} buổi`);

            }
          })
          .catch(error => console.error('xóa lịch ngày khám không thành công', error));
        res.json(data)
      })
      .catch(error => console.error('tìm lịch ngày khám không thành công', error));
  } else {
    res.json({ message: 'xóa không thành công' })
  }
};