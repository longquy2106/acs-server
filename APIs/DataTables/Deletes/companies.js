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
  if (req.query && req.query.company_id && req.query.company_contact_id) {
    // Câu lệnh truy vấn
    console.log(req.query.company_id);
    console.log(req.query.company_contact_id);

    const insert = gql`
      mutation MyMutation {
        delete_his_ace_companies(where: {id: {_eq: ${req.query.company_id}}}) {
          affected_rows
          returning {
            id
          }
        }
        delete_his_ace_company_contacts(where: {id: {_eq: "${req.query.company_contact_id}"}}) {
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