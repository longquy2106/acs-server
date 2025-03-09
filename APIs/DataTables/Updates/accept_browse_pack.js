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
  if (req.body?.pack_id) {
    // Câu lệnh truy vấn
    // const CompanyStr = customStringify(req.query.company, null, 2).replace(/\\/g, '').replace(/"{/g, '{').replace(/}"/g, '}')
    // const CompanyContactStr = customStringify(req.query.company_contact, null, 2).replace(/\\/g, '').replace(/"{/g, '{').replace(/}"/g, '}')

    // console.log('insert data companies CompanyStr', CompanyStr);
    // console.log('insert data companies CompanyContactStr', CompanyContactStr);
    const insert = gql`
      mutation MyMutation {
        update_his_ace_company_service_packs(where: {id: {_eq: ${req.body.pack_id}}}, _set: {is_accepted: 3}) {
          affected_rows
          returning {
            id
          }
        }
      }
    `;
    console.log('insert', insert);
    const variables = {
    };
    request(endpoint, insert, variables, headers)
      .then(function (data) {
        console.log(data)
        res.json(data)
      })
      .catch(error => console.error(error));
  } else {
    res.status(500).json({ message: 'Duyệt gói khám không thành công!' });
  }
};