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
    if (req.body?.object) {
        const insert = gql`
      mutation MyMutation ($id: Int!){
        update_his_ace_company_service_packs(where: {id: {_eq: $id}}, _set: {name: "${req.body?.object?.name}", number_of_employees: ${req.body?.object?.number_of_employees}, price: ${req.body?.object?.price}, register_year: ${req.body?.object?.register_year}}) {
          affected_rows
          returning {
            id
          }
        }
      }
    `;
        console.log('insert', insert);
        const variables = {
            id: req.body?.object?.id
        };
        request(endpoint, insert, variables, headers)
            .then(function (data) {
                console.log(data)
                res.json(data)
            })
            .catch(error => {
                console.error(error)
                res.status(500).json({ message: 'Cập nhật thông tin gói khám không thành công!' });
            });
    } else {
        res.status(500).json({ message: 'Không có thông tin object!' });
    }
};