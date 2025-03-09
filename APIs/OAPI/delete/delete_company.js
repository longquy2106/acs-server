const { request, gql } = require('graphql-request');
require('dotenv').config();

const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
require('dotenv').config();

module.exports = function (req, res) {
  const { permission } = req.verify
  const {
    company
  } = req.body

  if ((permission === 'admin' || permission === 'OS') && company && company.ref_id) {
    const deleteMutate = gql`
    mutation MyMutation {
      delete_his_ace_company_contacts(where: {company: {ref_id: {_eq: "${company.ref_id}"}}}) {
        affected_rows
        returning {
          id
        }
      }
      delete_his_ace_patients(where: {company_service_pack: {company: {ref_id: {_eq: "${company.ref_id}"}}}}) {
        affected_rows
      }
      delete_his_ace_company_service_packs(where: {company: {ref_id: {_eq: "${company.ref_id}"}}}) {
        affected_rows
      }
      delete_his_ace_companies(where: {ref_id: {_eq: "${company.ref_id}"}}) {
        affected_rows
        returning {
          id
          ref_id
        }
      }
    }
  `
    const variables = {
    };

    request(endpoint, deleteMutate, variables, headers)
      .then(function (data) {
        console.log(data)
        res.json({ message: 'Xóa công ty thành công', data })
      })
      .catch(error => console.error(error));
  }
}