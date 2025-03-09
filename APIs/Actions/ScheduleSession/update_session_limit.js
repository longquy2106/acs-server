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
  if (req.body
    && req.body?.appointment_session_id
    && req.body?.total_slot) {
    let mutate = gql`
        mutation MyMutation {
          update_his_ace_appointment_sessions(where: {id: {_eq: ${Number.isInteger(Number(req.body.appointment_session_id))
        ? Number(req.body.appointment_session_id) : 0
      }}}, _set: {total_slot: ${Number.isInteger(Number(req.body.total_slot))
        ? Number(req.body.total_slot) : 0
      }}) {
            affected_rows
            returning {
              id
            }
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
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Internal Server Error' })
        }
      });
  } else {
    console.log('req.body?.session_pack', req.body);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal Server Error' })
    }
  }
};