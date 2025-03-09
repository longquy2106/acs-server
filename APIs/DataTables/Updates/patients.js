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
  if (req.query && req.query.patient) {
    const patient = {}
    // Câu lệnh truy vấn
    if (req.query.patient.email) {
      patient.email = req.query.patient.email
    }
    if (req.query.patient.fullname) {
      patient.fullname = req.query.patient.fullname
    }
    if (req.query.patient.phone_number) {
      patient.phone_number = req.query.patient.phone_number
    }
    if (req.query.patient.birthday) {
      patient.birthday = req.query.patient.birthday
    }
    if (req.query.patient.pack_id) {
      patient.company_service_pack_id = req.query.patient.pack_id
    }
    if (req.query.patient.session_id) {
      patient.appointment_session_id = req.query.patient.session_id
    } else {
      patient.appointment_session_id = null
    }
    console.log('patient', patient);
    const update = gql`
      mutation MyMutation($_set: his_ace_patients_set_input = {
        email: ${patient.email ? `"${patient.email}"` : null}, 
        fullname: "${patient.fullname}", 
        phone_number: ${patient.phone_number ? `"${patient.phone_number}"` : null}, 
        birthday: "${patient.birthday}", 
        company_service_pack_id: ${patient.company_service_pack_id}, 
        appointment_session_id: ${patient.appointment_session_id}}) {
        update_his_ace_patients(where: {id: {_eq: "${req.query.patient.id}"}}, _set: $_set) {
          affected_rows
          returning {
            id
          }
        }
      }
    `;
    const variables = {
    };
    console.log('update mutation', update);
    request(endpoint, update, variables, headers)
      .then(function (data) {
        console.log(data)
        res.json(data)
      })
      .catch(error => console.error(error));
  } else {
  }
};