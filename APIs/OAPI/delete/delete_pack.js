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
    pack
  } = req.body

  if ((permission === 'admin' || permission === 'OS') && pack && pack.ref_id) {
    const deleteMutate = gql`
    mutation MyMutation {
      delete_his_ace_patients(where: {company_service_pack: {ref_id: {_eq: "${pack.ref_id}"}}}) {
        affected_rows
        returning {
          id
          ref_id
        }
      }
      delete_his_ace_company_service_packs(where: {ref_id: {_eq: "${pack.ref_id}"}}) {
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
        res.json({ message: 'Xóa gói khám thành công', data })
      })
      .catch(error => console.error(error));
  }
}