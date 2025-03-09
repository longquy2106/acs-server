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
    if (req.body?.session_pack) {
        const insert = gql`
      mutation MyMutation ($id: Int!, $real_num: Int!){
        update_his_ace_appointment_company_service_packs(where: {id: {_eq: $id}}, _set: {real_num: $real_num}) {
          affected_rows
          returning {
            id
          }
        }
      }
    `;
        console.log('insert', insert);
        const variables = {
            id: req.body?.session_pack?.id,
            real_num: req.body?.session_pack?.real_num
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