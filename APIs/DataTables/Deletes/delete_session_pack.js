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
    if (req.body && req.body.session_pack_id && req.verify) {
        // Câu lệnh truy vấn
        console.log(req.body.session_pack_id);

        const insert = gql`
            mutation MyMutation {
                delete_his_ace_appointment_company_service_packs(where: {id: {_eq: ${req.body.session_pack_id}}}) {
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
        res.json({ message: 'xóa không thành công' })
    }
};