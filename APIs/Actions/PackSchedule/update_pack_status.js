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
  console.log('update pack status', req.body);
  if (req.body?.pack_id && (req.body?.status || req.body?.status === 0)) {
    let mutate = gql`
        mutation MyMutation {
          update_his_ace_company_service_packs(where: {id: {_eq: ${req.body.pack_id}}}, _set: {is_accepted: ${req.body.status}}) {
            affected_rows
          }
        }
      `;
    console.log('mutate', mutate);

    const variables = {
    };
    request(endpoint, mutate, variables, headers)
      .then(function (data) {
        console.log('data update', data)
        res.status(200).json(data)
      })
      .catch(error => {
        console.error(error)
        res.status(500).json({ success: false, error: 'Internal Server Error' })
      });
  } else {
    console.log('req.body?.session_pack', req.body);
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
};