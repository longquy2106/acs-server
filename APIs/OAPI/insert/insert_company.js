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
    company
  } = req.body

  // Hàm để loại bỏ thuộc tính từ đối tượng
  const removeProperty = (obj, prop) => {
    const { [prop]: _, ...rest } = obj;
    return rest;
  };
  if ((permission === 'admin' || permission === 'OS') && company && company.company_contacts) {
    const query = gql`
      query MyQuery {
        his_ace_companies(where: {ref_id: {_eq: "${company.ref_id}"}}, limit: 1) {
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
          update_his_ace_companies(
          _set: ${JSON.stringify(removeProperty(company, "company_contacts")).replace(/"([^"]+)":/g, '$1:')}, 
          where: {ref_id: {_eq: "${ref_id}"}}) {
            returning {
              address
              code
              created_at
              created_by
              internal_hospital_id
              name
              phone_number
              ref_id
              status
              updated_at
              updated_by
              url_image
              website
            }
            affected_rows
          }
            
          update_his_ace_company_contacts(
          where: {company: {ref_id: {_eq: "${ref_id}"}}}, 
          _set: ${JSON.stringify(company.company_contacts.data).replace(/"([^"]+)":/g, '$1:')}) {
            returning {
              address
              birthday
              code_name
              company {
                ref_id
              }
              created_at
              created_by
              email
              firstname
              fullname
              lastname
              phone_number
              position
              updated_at
              updated_by
            }
            affected_rows
          }
        }
      `;
      console.log('update', update)
      const variables = {
      };
      request(endpoint, update, variables, headers)
        .then(function (data) {
          console.log(data)
          res.json({ message: 'Cập nhật công ty thành công', data })
        })
        .catch(error => console.error(error));
    }
    request(endpoint, query, variables2, headers)
      .then(function (data) {
        if (data.his_ace_companies[0]?.ref_id) {
          console.log('Đã tồn tại ref_id');
          updateCompany(data.his_ace_companies[0].ref_id)
        } else {
          const insert = gql`
            mutation MyMutation {
              insert_his_ace_companies(objects: 
                ${JSON.stringify(company).replace(/"([^"]+)":/g, '$1:')}
                ) {
                affected_rows
                returning {
                  address
                  code
                  created_at
                  created_by
                  id
                  ref_id
                  internal_hospital_id
                  name
                  phone_number
                  status
                  updated_at
                  updated_by
                  url_image
                  website
                  company_contacts {
                    address
                    birthday
                    code_name
                    company_id
                    created_at
                    created_by
                    email
                    firstname
                    fullname
                    lastname
                    phone_number
                    position
                    updated_at
                    updated_by
                    id
                  }
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
              res.json({ message: 'Thêm công ty thành công', data })
            })
            .catch(error => console.error(error));
        }
      })
      .catch(error => console.error(error));


  } else {
  }
};