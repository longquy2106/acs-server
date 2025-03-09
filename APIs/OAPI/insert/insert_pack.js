// server/APIs/login.js
const { request, gql } = require('graphql-request');
require('dotenv').config();

const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
require('dotenv').config();
module.exports = function (req, res) {
  const { permission } = req.verify
  const {
    pack
  } = req.body

  // Hàm để loại bỏ thuộc tính từ đối tượng
  const removeProperty = (obj, prop) => {
    const { [prop]: _, ...rest } = obj;
    return rest;
  };
  if ((permission === 'admin' || permission === 'OS') && pack.ref_id && pack.company_ref_id) {
    const query = gql`
      query MyQuery {
        his_ace_companies(where: {ref_id: {_eq: "${pack.company_ref_id}"}}) {
          id
          ref_id
        }
        his_ace_company_service_packs(where: {ref_id: {_eq: "${pack.ref_id}"}}, limit: 1) {
            id
            ref_id
        }
      }
    `
    const variables2 = {
    };
    function updateCompany(ref_id) {
      const update = gql`
        mutation MyMutation {
          update_his_ace_company_service_packs(where: {ref_id: {_eq: "${pack.ref_id}"}}, 
          _set: ${JSON.stringify(pack).replace(/"([^"]+)":/g, '$1:')}) {
            affected_rows
            returning {
              code
              company_id
              is_accepted
              name
              number_of_employees
              price
              ref_id
              register_year
              updated_at
              updated_by
              company_ref_id
            }
          }
        }
      `;
      console.log('update', update)
      const variables = {
      };
      request(endpoint, update, variables, headers)
        .then(function (data) {
          console.log(data)
          res.json({ message: 'Cập nhật gói khám thành công', data })
        })
        .catch(error => console.error(error));
    }
    request(endpoint, query, variables2, headers)
      .then(function (data) {
        if (data.his_ace_companies[0]?.id) {
          pack.company_id = data.his_ace_companies[0]?.id
          if (data.his_ace_company_service_packs[0]?.ref_id
            && data.his_ace_companies[0]?.id
          ) {
            console.log('đã tồn tại ref_id');
            updateCompany(data.his_ace_company_service_packs[0].ref_id)
          } else {
            const insert = gql`
              mutation MyMutation {
                insert_his_ace_company_service_packs(objects: 
                  ${JSON.stringify(pack).replace(/"([^"]+)":/g, '$1:')}
                  ) {
                  affected_rows
                  returning {
                    code
                    company_id
                    created_at
                    created_by
                    is_accepted
                    name
                    number_of_employees
                    price
                    ref_id
                    register_year
                    updated_at
                    updated_by
                    company_ref_id
                  }
                }
              }
            `;
            console.log('insert', insert)
            const variables = {
            };
            request(endpoint, insert, variables, headers)
              .then(function (data) {
                console.log(data)
                res.json({ message: 'Thêm gói khám thành công', data })
              })
              .catch(error => console.error(error));
          }
        } else {
          res.json({ message: 'Công ty với ref_id ' + pack.company_ref_id + ' không tồn tại' })
        }
      })
      .catch(error => console.error(error));


  } else {
  }
};