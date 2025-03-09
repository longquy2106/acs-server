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
    query MyQuery {
      his_ace_companies(where: {ref_id: {_eq: "${company.ref_id}"}}) {
        address
        code
        created_at
        created_by
        id
        internal_hospital_id
        name
        phone_number
        ref_id
        status
        updated_at
        updated_by
        url_image
        website
      }
    }
  `
    const variables = {
    };

    request(endpoint, deleteMutate, variables, headers)
      .then(function (data) {
        // console.log(data)
        res.json({ message: 'Lấy thông tin công ty thành công!', data })
      })
      .catch(error => console.error(error));
  }
}