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

  if ((permission === 'admin' || permission === 'OS') && pack?.ref_id) {
    const deleteMutate = gql`
    query MyQuery {
      his_ace_company_service_packs(where: {ref_id: {_eq: "${pack.ref_id}"}}) {
        code
        company_id
        company_ref_id
        created_at
        created_by
        id
        is_accepted
        name
        number_of_employees
        price
        ref_id
        register_year
        updated_at
        updated_by
      }
    }
  `
    const variables = {
    };

    request(endpoint, deleteMutate, variables, headers)
      .then(function (data) {
        // console.log(data)
        res.json({ message: 'Lấy thông tin gói khám thành công!', data })
      })
      .catch(error => console.error(error));
  }
}