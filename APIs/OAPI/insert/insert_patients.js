// server/APIs/login.js
const { update } = require('firebase/database');
const { request, gql } = require('graphql-request');
const { PayloadPage } = require('twilio/lib/rest/api/v2010/account/recording/addOnResult/payload');
require('dotenv').config();

const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
require('dotenv').config();
module.exports = async function (req, res) {
  const { permission } = req.verify
  const {
    patients
  } = req.body
  let mainData = []
  let patientNoPack = []
  let newPatients = []
  let oldPatients = []

  // Hàm để loại bỏ thuộc tính từ đối tượng
  const removeProperty = (obj, prop) => {
    const { [prop]: _, ...rest } = obj;
    return rest;
  };

  // function
  async function updatePatietnt(oldList) {
    let updateStr = ''
    for (let index = 0; index < oldList.length; index++) {
      updateStr += `
        update_user${index}: update_his_ace_patients(where: {ref_id: {_eq: "${oldList[index].ref_id}"}}, 
        _set: ${JSON.stringify(oldList[index]).replace(/"([^"]+)":/g, '$1:')}) {
          affected_rows
          returning {
            company_service_pack_id
            company_id
            birthday
            created_at
            created_by
            email
            firstname
            fullname
            lastname
            medical_code
            pack_ref_id
            phone_number
            ref_id
            updated_at
            updated_by
          }
        }
      `;
    }
    const update = gql`
      mutation MyMutation {
        ${updateStr}
      }
    `;
    console.log('update', update)
    const variables = {
    };
    await request(endpoint, update, variables, headers)
      .then(function (data) {
        console.log(data)
        mainData.push(data)
      })
      .catch(error => console.error(error));
  }
  async function insertPatient(newList) {
    const insert = gql`
    mutation MyMutation($objects: [his_ace_patients_insert_input!]! = ${JSON.stringify(newList).replace(/"([^"]+)":/g, '$1:')}) {
      insert_his_ace_patients(objects: $objects) {
        affected_rows
        returning {
          company_service_pack_id
          company_id
          birthday
          created_at
          created_by
          email
          firstname
          fullname
          pack_ref_id
          phone_number
          ref_id
          updated_at
          updated_by
        }
      }
    }
  `;
    console.log('insert', insert)
    const variables = {
    };
    await request(endpoint, insert, variables, headers)
      .then(function (data) {
        console.log(data)
        mainData.push(data)
      })
      .catch(error => console.error(error));
  }
  async function checkPatient(dataPatient) {
    for (let index = 0; index < patients.length; index++) {
      if (patients[index].ref_id) {
        const query = gql`
        query MyQuery {
          his_ace_company_service_packs(where: {ref_id: {_eq: "${patients[index].pack_ref_id}"}}) {
              id
              ref_id
              company {
                id
              }
            }
          his_ace_patients(where: {ref_id: {_eq: "${patients[index].ref_id}"}},limit: 1) {
            id
            medical_code
            ref_id
          }
        }
        `
        const variables = {
        };
        await request(endpoint, query, variables, headers)
          .then(function (data) {
            if (data.his_ace_company_service_packs[0]?.id && data.his_ace_company_service_packs[0].company?.id) {
              patients[index].company_service_pack_id = data.his_ace_company_service_packs[0].id
              patients[index].company_id = data.his_ace_company_service_packs[0].company.id
              if (data.his_ace_patients[0]?.ref_id) {
                console.log('Đã tồn tại ref_id');
                oldPatients.push(patients[index])
              } else {
                console.log('Chưa có bệnh nhân ref_id', patients[index]);
                newPatients.push(patients[index])
                console.log('newPatients', newPatients);
              }
            } else {
              const tempPatientNoPack = {
                ref_id: patients[index].ref_id,
                pack_ref_id: patients[index].pack_ref_id
              }
              patientNoPack.push(tempPatientNoPack)
            }
          })
          .catch(error => console.error(error));
      }
    }
  }
  async function checkPackRefID() {
    if (patients.length > 0) {
      for (let index = 0; index < patients.length; index++) {

      }
    }
  }
  if ((permission === 'admin' || permission === 'OS') && patients) {
    await checkPatient(patients)
    try {
      if (oldPatients.length > 0) {
        await updatePatietnt(oldPatients)
      }
      if (newPatients.length > 0) {
        await insertPatient(newPatients)
      }
    } catch (error) {
      console.log('Lỗi mutate!', error);
    }
    if (patientNoPack.length > 0) {
      res.json({ message: "kết quả insert/update", mainData, warning: `danh sách bệnh nhân với "pack_ref_id" không tồn tại: `, warningList: patientNoPack })
    } else {
      res.json({ message: "kết quả insert/update", mainData })
    }
  } else {
  }
};