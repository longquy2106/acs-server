// server/APIs/login.js
const { query } = require('express');
const client = require('../../../ConnectDatabase/his_ace')
const { request, gql } = require('graphql-request');
require('dotenv').config();

const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
require('dotenv').config();
module.exports = function (req, res) {
  // console.log('req.body.package_add', req.body.package_add);
  // console.log('req.body.package_add.session_packs', req.body.package_add.session_packs);
  function customStringify(obj, replacer, spaces) {
    const stringify = (key, value) => {
      if (replacer) {
        return replacer(key, value);
      }

      // Nếu giá trị là một đối tượng và không phải là mảng, không thêm nháy kép cho khóa
      if (typeof value === 'object' && !Array.isArray(value)) {
        return `{${Object.keys(value).map(k => `${k}:${stringify(k, value[k])}`).join(',')}}`;
      }

      // Sử dụng JSON.stringify cho tất cả các giá trị khác
      return JSON.stringify(value);
    };

    return JSON.stringify(obj, stringify, spaces);
  }
  if (req.body?.variables) {
    console.log('req.body?.variables', req.body?.variables);
    req.body.variables.id = req.body.variables.id.toString()
    if (!req.body.variables.session_id) {
      req.body.variables.session_id = null
    }
    // Câu lệnh truy vấn
    const update = gql`
      mutation MyMutation {
        update_his_ace_patients(where: {id: {_eq: "${req.body.variables.id}"}}, _set: {appointment_session_id: ${req.body.variables.session_id}}) {
          affected_rows
        }
      }
    `;
    console.log('update', update);

    const variables = {

    };
    request(endpoint, update, variables, headers)
      .then(async function (data) {
        const totalPatients = []
        console.log(data)
        if (data?.update_his_ace_patients?.affected_rows > 0 && req.body.sessionPacks) {
          const tempSessionPacks = req.body.sessionPacks
          for (let index = 0; index < tempSessionPacks.length; index++) {
            let query =
              `
              query MyQuery {
                his_ace_patients_aggregate(where: {company_service_pack_id: {_eq: ${req.body.variables.company_pack_id}}, appointment_session_id: {_eq: ${req.body.sessionPacks[index].session_id}}}) {
                  aggregate {
                    count
                  }
                }
              }
            `
            const totalPatientVariables = {}
            await client.query(
              query,
              totalPatientVariables,
              function (req, res) {
                // callback trả về kết quả hoặc nếu có lỗi diễn ra
                if (res.status === 401)
                  throw new Error('Not authorized')
              }).then(function (body) {
                console.log('body.data', body.data);
                if (body.data?.his_ace_patients_aggregate?.aggregate?.count >= 0) {
                  totalPatients.push({
                    session_id: req.body.sessionPacks[index].session_id,
                    total_patient: body.data.his_ace_patients_aggregate.aggregate.count
                  })
                }
              }).catch(function (err) {
                console.log(err.message)
              })
          }
          console.log('totalPatients', totalPatients);
        }
        // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
        res.json({
          data: data,
          totalPatients: totalPatients
        })
      })
      .catch(error => console.error(error));
  } else {
  }
};