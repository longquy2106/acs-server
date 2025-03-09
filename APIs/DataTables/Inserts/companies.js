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
  if (req.query && req.query.objects) {
    // Câu lệnh truy vấn
    console.log(req.query.objects);
    const tempObject = customStringify(req.query.objects, null, 2).replace(/\\/g, '').replace(/"{/g, '{').replace(/}"/g, '}')
    // tempObject.replace(/\\/g, '')

    console.log('insert data companies tempObject', tempObject);
    const insert = gql`
            mutation MyMutation($objects: [his_ace_companies_insert_input!] = [${tempObject}]) {
            insert_his_ace_companies(objects: $objects) {
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
        res.json(data)
      })
      .catch(error => console.error(error));
  } else {
  }
};