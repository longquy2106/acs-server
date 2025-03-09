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
  if (req.body?.package_add) {
    console.log('req.body?.package_add');
    let tempObject = req.body?.package_add
    for (index = 0; index < tempObject.session_packs.length; index++) {
      tempObject.session_packs[index] = {
        appointment_session_id: tempObject.session_packs[index].appointment_session_id,
        total_slot: tempObject.session_packs[index].total_slot
      }
      tempObject.session_packs[index] = customStringify(tempObject.session_packs[index], null, 2).replace(/\\/g, '').replace(/"{/g, '{').replace(/}"/g, '}')
    }
    console.log('for tempObject');
    const jsonObject = {
      name: tempObject.name,
      number_of_employees: tempObject.number_of_employees,
      price: tempObject.price,
      register_year: tempObject.register_year,
      company_id: tempObject.company_id,
      appointment_company_service_packs: {
        data: tempObject.session_packs
      },
    }

    console.log('jsonObject');
    console.log('objects', jsonObject);
    console.log('objects.appointment_company_service_packs', jsonObject.appointment_company_service_packs);

    // Câu lệnh truy vấn
    const objects = customStringify(jsonObject, null, 2).replace(/\\/g, '').replace(/"{/g, '{').replace(/}"/g, '}')
    let insert = ``;
    if (req.body?.package_add?.session_packs?.length === 1) {
      insert = gql`
          mutation MyMutation($objects: [his_ace_company_service_packs_insert_input!]! = ${objects}) {
            insert_his_ace_company_service_packs(objects: $objects) {
              affected_rows
              returning {
                id
              }
            }
          }
        `;
    }
    else {
      insert = gql`
          mutation MyMutation($objects: [his_ace_company_service_packs_insert_input!] = ${objects}) {
            insert_his_ace_company_service_packs(objects: $objects) {
              affected_rows
              returning {
                id
              }
            }
          }
        `;
    }
    console.log('insert', insert);

    const variables = {
    };
    request(endpoint, insert, variables, headers)
      .then(function (data) {
        console.log(data)
        res.json(data)
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      });
  } else {
  }
};