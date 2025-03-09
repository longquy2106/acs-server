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
    patient
  } = req.body
  const tempRefIds = []
  if ((permission === 'admin' || permission === 'OS') && patient?.length > 0) {
    for (let index = 0; index < patient.length; index++) {
      tempRefIds.push(patient[index].ref_id)
    }
    const deleteMutate = gql`
    query MyQuery {
      his_ace_patients(where: {ref_id: {_in: ${JSON.stringify(tempRefIds).replace(/"([^"]+)":/g, '$1:')}}}) {
        appointment_session_id
        birthday
        company_id
        company_service_pack_id
        created_at
        created_by
        email
        firstname
        fullname
        id
        lastname
        medical_code
        pack_ref_id
        phone_number
        ref_id
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
        res.json({ message: 'Lấy thông tin bệnh nhân thành công!', data })
      })
      .catch(error => console.error(error));
  }
}