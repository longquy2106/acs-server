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

  if ((permission === 'admin' || permission === 'OS') && patient?.length > 0 && patient[0]?.ref_id) {
    const tempRefIds = []
    for (let index = 0; index < patient.length; index++) {
      tempRefIds.push(patient[index].ref_id)
    }
    const deleteMutate = gql`
    mutation MyMutation {
      delete_his_ace_patients(where: {ref_id: {_in: ${JSON.stringify(tempRefIds).replace(/"([^"]+)":/g, '$1:')}}}) {
        affected_rows
        returning {
          id
          ref_id
        }
      }
    }
  `
    console.log('deleteMutate', deleteMutate);
    const variables = {
    };

    request(endpoint, deleteMutate, variables, headers)
      .then(function (data) {
        console.log(data)
        res.json({ message: 'Xóa bệnh nhân thành công', data })
      })
      .catch(error => console.error(error));
  }
}