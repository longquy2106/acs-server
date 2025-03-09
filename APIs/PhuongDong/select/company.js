const { queryDatabase } = require('../../../ConnectDatabase/his_pd');
const { request, gql } = require('graphql-request');
const client = require('../../../ConnectDatabase/his_ace')

require('dotenv').config();

const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
module.exports = async function (req, res) {
  tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  function isValidDateString(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return (
      date instanceof Date &&
      !isNaN(date) &&
      dateString === date.toISOString().split('T')[0]
    );
  }
  console.log('req', req);

  let rangeDate = {
    startDate: req?.body?.startDate && isValidDateString(req.body.startDate) ? req.body.startDate : new Date().toISOString().split('T')[0],
    endDate: req?.body?.endDate && isValidDateString(req.body.endDate) ? req.body.endDate : tomorrow.toISOString().split('T')[0]
  }
  console.log('rangeDate.startDate', rangeDate.startDate);
  console.log('rangeDate.endDate', rangeDate.endDate);

  try {
    // Gọi hàm queryDatabase để thực hiện truy vấn
    const result = await queryDatabase(`
      SELECT json_build_object(
        'created_by', o.created_by_user_id,
        'company_ref_id', o.organisation_id,
				'company_code', o.organisation_code,
				
				'company_logo', o.logo_path,
				'company_name', o.organisation_name_l,
				
				'company_web_url', o.home_page_url,
				'company_phone', o.organisation_phone,
				'company_address', o.organisation_address_l,
				'company_email', o.primary_email_address,
				
				'contact_name', o.representative_person_name,
				'contact_phone', o.representative_person_phone,
				'contact_position', o.representative_person_position_e,
				'contact_address', o.representative_person_address_e,
				'contact_email', o.representative_person_email,
				
				'pack_ref_id', pci.item_id,
				'pack_code', pci.item_code,
				'pack_name', pci.item_name_l,
				'pack_price', pci.discounted_price,
				'pack_created_at', hc.created_date_time,
				
				'patient_ref_id', per.id,
				'patient_code', per.person_code,
				'patient_name', per.full_name,
				'patient_birthday', per.date_of_birth,
				'patient_phone', per.mobile_phone,
				'patient_email', per.email,
				'patient_gender', per.gender,
				'patient_checkin_date', pv.hc_check_in_date_time,
				'patient_checkout_date', pv.hc_check_out_date_time,
				'patient_nationality', per.nationality_country_rcd
					) as result
          from health_contract hc
              inner join health_contract_detail hcd on hcd.health_contract_id = hc.health_contract_id
              inner join patient_visit pv  on hcd.patient_visit_id = pv.patient_visit_id
              inner join person per on per.id = pv.patient_id
              inner join charge_detail cd on pv.patient_visit_id = cd.patient_visit_id
              inner join package_item pci on pci.item_id = cd.package_item_id
              inner join item_group igpci on igpci.item_group_id = pci.item_group_id
              inner join organisation o on o.organisation_id=hc.organisation_id
              inner join facility fcl on fcl.facility_id=cd.facility_id
          WHERE  COALESCE(hc.lu_updated, hc.created_date_time) BETWEEN '${rangeDate?.startDate}' AND '${rangeDate?.endDate}'
          and hcd.active_flag = 1
              and cd.active_flag=1
          group by  o.organisation_id, 
            pv.patient_visit_id, 
            per.id,
            pci.item_id,
            hc.health_contract_id
        order by o.organisation_id
				`);

    let resMessage = {}
    if (result.rows?.length > 0) {
      console.log('result', result.rows.length);
      const companies = []
      const packs = []
      const patients = []
      const existedCompanies = []

      let differenceOfPacks = []

      for (let index = 0; index < result.rows.length; index++) {
        const item = result.rows[index].result
        let isDupCom = false
        // Điều kiện company_ref_id không bị dup
        let indexCom = -1
        // ref_id công ty có giá trị và đã có trong chuỗi data HIS(pd)
        if (item?.company_ref_id && companies?.some(c => c.ref_id === item.company_ref_id)) {
          indexCom = companies?.findIndex(c => c.ref_id === item.company_ref_id)
        }
        // ref_id công ty có giá trị và chưa có trong chuỗi data HIS(pd) và không có trong danh sách đã trùng
        else if (item?.company_ref_id && !existedCompanies?.some(c => c.ref_id === item.company_ref_id)) {
          let query =
            `query MyQuery {
              his_ace_companies(where: {ref_id: {_eq: ${item.company_ref_id ? `"${item.company_ref_id}"` : null}}}) {
                id
                ref_id
                company_service_packs {
                  id
                  ref_id
                  patients {
                    id
                    ref_id
                  }
                }
              }
            }
            `
          const variables = {}
          await client.query(
            query,
            variables,
            function (req, res) {
              // callback trả về kết quả hoặc nếu có lỗi diễn ra
              if (res.status === 401)
                throw new Error('Not authorized')
            }).then(function (body) {
              if (body.data?.his_ace_companies?.length > 0) {
                // console.log('body.data', body.data);
                const tempExistsComs = body.data.his_ace_companies
                for (let index = 0; index < tempExistsComs.length; index++) {
                  if (tempExistsComs[index].id) {
                    console.log(`Có trùng lặp companies ở ref_id ${item.company_ref_id}`);
                    isDupCom = true
                    existedCompanies.push(tempExistsComs[index])
                    // console.log('existedCompanies', existedCompanies);
                    break;
                  }
                }
              } else {
              }
            }).catch(function (err) {
              console.log(err.message)
              if (!res.headersSent) {
                res.status(500).json({
                  success: false,
                  message: 'Lỗi khi check trùng dữ liệu công ty từ database Phương Đông!',
                  error: err.message,
                });
              }
            })
          // Nếu ref_id công ty chưa có trong database đặt hẹn 
          if (!isDupCom) {
            let ref_unknown_user_id = null
            let user_id = null
            if (item.created_by) {
              const queryUser =
                `query MyQuery {
                  his_ace_users(where: {ref_id_pd: {_eq: "${item.created_by}"}}) {
                    id
                  }
                }
                `
              const variables = {}
              await client.query(
                queryUser,
                variables,
                function (req, res) {
                  // callback trả về kết quả hoặc nếu có lỗi diễn ra
                  if (res.status === 401)
                    throw new Error('Not authorized')
                }).then(function (body) {
                  if (body.data?.his_ace_users?.length > 0 && body.data.his_ace_users[0]?.id) {
                    // console.log('body.data', body.data);
                    user_id = body.data.his_ace_users[0]?.id
                  } else {
                    ref_unknown_user_id = item.created_by
                  }
                }).catch(function (err) {
                  console.log(err.message)
                  if (!res.headersSent) {
                    res.status(500).json({
                      success: false,
                      message: 'Lỗi khi check trùng dữ liệu công ty từ database Phương Đông!',
                      error: err.message,
                    });
                  }
                })
            }
            // tìm uuid - nếu có gán vào created_by - nếu không gán vào created_by_ref_unknown_user_id
            const tempCompany = {
              ref_id: item.company_ref_id,
              address: item.company_address ? item.company_address : null,
              code: item.company_code ? item.company_code : null,
              email: item.company_email ? item.company_email : null,
              url_image: item.company_logo ? item.company_logo : null,
              name: item.company_name ? item.company_name : null,
              phone_number: item.company_phone ? item.company_phone : null,
              website: item.company_web_url ? item.company_web_url : null,
              created_by: user_id ? user_id : null,
              created_by_ref_unknown_user_id: ref_unknown_user_id ? ref_unknown_user_id : null,
              company_contacts: {
                data: {
                  fullname: item.contact_name,
                  phone_number: item.contact_phone,
                  email: item.contact_email,
                  address: item.contact_address,
                  position: item.contact_position,
                }
              },
              company_service_packs: { data: [] }
            }
            companies.push(tempCompany)
            indexCom = companies.length - 1
          }
        }
        let indexPack = -1
        let indexNewPack = -1
        // Kiểm tra nếu pack trùng thì không thêm vào danh sách thêm packs
        if (indexCom > -1 && item?.pack_ref_id && companies[indexCom].company_service_packs.data?.some(c => c.ref_id === item.pack_ref_id)) {
          indexPack = companies[indexCom].company_service_packs.data?.findIndex(c => c.ref_id === item.pack_ref_id)
        }
        // Nếu pack không trùng
        else if (indexCom > -1 && item?.pack_ref_id) {
          // Nếu ref_id của gói lấy từ HIS không bị lặp
          const tempPack = {
            ref_id: item.pack_ref_id,
            code: item.pack_code ? item.pack_code : null,
            name: item.pack_name ? item.pack_name : null,
            price: item.pack_price ? item.pack_price : null,
            created_at: item.pack_created_at ? item.pack_created_at : null,
            patients: { data: [] }
          }
          companies[indexCom].company_service_packs.data.push(tempPack)
          indexPack = companies[indexCom].company_service_packs.data.length - 1
        }

        if (indexPack > -1 && companies[indexCom]?.company_service_packs.data[indexPack]?.patients?.data?.some(c => c.ref_id === item.patient_ref_id)) {
          console.warn('ID BỆNH NHÂN thuộc GÓI KHÁM của CÔNG TY này đã tồn tại!');
        }
        else if (indexPack > -1 && item?.patient_ref_id) {
          const tempPatient = {
            ref_id: item.patient_ref_id,
            medical_code: item.patient_code ? item.patient_code : null,
            fullname: item.patient_name ? item.patient_name : null,
            birthday: item.patient_birthday ? item.patient_birthday : null,
            phone_number: item.patient_phone ? item.patient_phone : null,
            email: item.patient_email ? item.patient_email : null,
            gender: item.patient_gender ? item.patient_gender : null,
            checkin_date: item.patient_checkin_date ? item.patient_checkin_date : null,
            checkout_date: item.patient_checkout_date ? item.patient_checkout_date : null,
            nationality: item.patient_nationality ? item.patient_nationality : null
          }
          companies[indexCom].company_service_packs.data[indexPack].patients.data.push(tempPatient)
        }

        // Nếu công ty đã tồn tại
        if (item?.company_ref_id && existedCompanies?.some(c => c.ref_id === item.company_ref_id)) {
          const tempIndexExistedCom = existedCompanies?.findIndex(c => c.ref_id === item.company_ref_id) // Number
          const tempExistedCom = existedCompanies[tempIndexExistedCom]
          console.log('\x1b[34m%s\x1b[0m', 'Đây là CÔNG TY đã có trên db', tempExistedCom?.id);
          // Kiểm tra gói khám thuộc công ty này có hay chưa
          // Nếu gói khám thuộc công ty này đã có trên db -> kiểm tra bệnh nhân thuộc gói khám này có hay chưa
          if (item?.pack_ref_id && tempExistedCom?.company_service_packs?.some(c => c.ref_id === item.pack_ref_id)) {
            const tempIndexExistedPack = tempExistedCom.company_service_packs?.findIndex(c => c.ref_id === item.pack_ref_id) // Number
            const tempExistedPack = tempExistedCom.company_service_packs[tempIndexExistedPack]
            console.log('\x1b[35m%s\x1b[0m', '\tĐây là GÓI KHÁM đã có trên db', tempExistedPack?.id);
            // Nếu bệnh nhân đã có -> Xem có ngày checkout chưa -> Nếu có -> Cập nhật ngày checkout bệnh nhân đó
            if (item?.patient_ref_id && tempExistedPack?.patients?.some(c => c.ref_id === item.patient_ref_id)) {
              const tempIndexExistedPatient = tempExistedPack.patients?.findIndex(c => c.ref_id === item.patient_ref_id) // Number
              const tempExistedPatient = tempExistedPack.patients[tempIndexExistedPatient]
              console.log('\x1b[36m%s\x1b[0m', '\t\tĐây là BỆNH NHÂN đã có trên db', tempExistedPatient?.id);
              if (item.patient_checkout_date && tempExistedPatient?.id) {
                const updateCheckOutDate = gql`
                  mutation MyMutation {
                    update_his_ace_patients(where: {id: {_eq: "${tempExistedPatient.id}"}}, _set: {checkout_date: "${item.patient_checkout_date}"}) {
                      affected_rows
                      returning {
                        id
                      }
                    }
                  }
                `;
                // console.log('insert his_ace_shortlinks_insert_input', updateIsSent);
                const variables = {
                };
                await request(endpoint, updateCheckOutDate, variables, headers)
                  .then(async function (data) {
                    console.log(data)
                    // kiểm tra có dữ liệu đã insert hay không
                    if (data.update_his_ace_patients?.affected_rows) {
                      console.log('Đã cập nhật ngày checkout!');
                    } else {
                      console.log('Cập nhật ngày checkout không thành công!', tempExistedPatient.id);
                    }
                  })
                  .catch(error => {
                    console.error(error)
                    console.log('Lỗi cập nhật ngày checkout!');
                  });
              }
            }
            // Nếu bệnh nhân chưa có trên db -> thêm bệnh nhân vào danh sách insert patients (thuộc packs)
            else if (item?.patient_ref_id
              && !tempExistedPack?.patients?.some(c => c.ref_id === item.patient_ref_id)
              && !patients?.some(c => c.ref_id === item.patient_ref_id)) {
              const tempPatient = {
                ref_id: item.patient_ref_id,
                medical_code: item.patient_code ? item.patient_code : null,
                fullname: item.patient_name ? item.patient_name : null,
                birthday: item.patient_birthday ? item.patient_birthday : null,
                phone_number: item.patient_phone ? item.patient_phone : null,
                email: item.patient_email ? item.patient_email : null,
                gender: item.patient_gender ? item.patient_gender : null,
                company_service_pack_id: tempExistedPack.id,
                checkin_date: item.patient_checkin_date ? item.patient_checkin_date : null,
                checkout_date: item.patient_checkout_date ? item.patient_checkout_date : null,
                nationality: item.patient_nationality ? item.patient_nationality : null
              }
              patients.push(tempPatient)
              if (differenceOfPacks?.some(c => c.company_service_pack_id === tempExistedPack.id)) {
                const tempIndexExistedCom = differenceOfPacks?.findIndex(c => c.company_service_pack_id === tempExistedPack.id)
                differenceOfPacks[tempIndexExistedCom].number_of_employees += 1
              } else {
                differenceOfPacks.push({
                  company_service_pack_id: tempExistedPack.id,
                  number_of_employees: 1
                })
              }
            }
          }
          // Còn nếu chưa -> thêm gói khám vào danh sách insert packs (thuộc company)
          else if (item?.pack_ref_id
            && !tempExistedCom?.company_service_packs?.some(c => c.ref_id === item.pack_ref_id)
            && !packs?.some(c => c.ref_id === item.pack_ref_id)) {
            const tempPack = {
              ref_id: item.pack_ref_id,
              code: item.pack_code ? item.pack_code : null,
              name: item.pack_name ? item.pack_name : null,
              price: item.pack_price ? item.pack_price : null,
              created_at: item.pack_created_at ? item.pack_created_at : null,
              company_id: tempExistedCom.id ? tempExistedCom.id : null,
              company_ref_id: item.company_ref_id ? item.company_ref_id : null,
              patients: { data: [] }
            }
            packs.push(tempPack)
            indexNewPack = packs.length - 1
          }
          if (indexNewPack > -1 && packs[indexNewPack]?.patients?.data?.some(c => c.ref_id === item.patient_ref_id)) {
            console.warn('ID BỆNH NHÂN thuộc GÓI KHÁM này đã tồn tại!');
          }
          else if (indexNewPack > -1 && item?.patient_ref_id) {
            const tempPatient = {
              ref_id: item.patient_ref_id,
              medical_code: item.patient_code ? item.patient_code : null,
              fullname: item.patient_name ? item.patient_name : null,
              birthday: item.patient_birthday ? item.patient_birthday : null,
              phone_number: item.patient_phone ? item.patient_phone : null,
              email: item.patient_email ? item.patient_email : null,
              gender: item.patient_gender ? item.patient_gender : null,
              checkin_date: item.patient_checkin_date ? item.patient_checkin_date : null,
              checkout_date: item.patient_checkout_date ? item.patient_checkout_date : null,
              nationality: item.patient_nationality ? item.patient_nationality : null
            }
            packs[indexNewPack].patients.data.push(tempPatient)
          }
        }
      }
      for (let index = 0; index < companies.length; index++) {
        if (companies[index]?.company_service_packs?.data?.length > 0) {
          const tempPacks = companies[index].company_service_packs.data
          for (let j = 0; j < tempPacks.length; j++) {
            companies[index].company_service_packs.data[j].number_of_employees = 0
            if (tempPacks[j]?.patients?.data?.length > 0) {
              const tempPatients = tempPacks[j].patients.data
              for (let k = 0; k < tempPatients.length; k++) {
                companies[index].company_service_packs.data[j].number_of_employees += 1;
              }
            }
            companies[index].company_service_packs.data[j].price = Number(
              companies[index].company_service_packs.data[j].price) * companies[index].company_service_packs.data[j].number_of_employees
            companies[index].company_service_packs.data[j].register_year = new Date(
              companies[index].company_service_packs.data[j].created_at).getFullYear()
          }
        }
      }
      for (let index = 0; index < packs.length; index++) {
        packs[index].number_of_employees = 0
        if (packs[index]?.patients?.data?.length > 0) {
          const tempPatients = packs[index].patients.data
          for (let k = 0; k < tempPatients.length; k++) {
            packs[index].number_of_employees += 1;
          }
        }
        packs[index].price = Number(
          packs[index].price) * packs[index].number_of_employees
        packs[index].register_year = packs[index].created_at ? new Date(
          packs[index].created_at).getFullYear() : new Date().getFullYear()
      }

      console.log('companies data length', companies.length);
      console.log('\x1b[36m%s\x1b[0m', 'có company chưa có pack', packs);
      console.log('\x1b[36m%s\x1b[0m', 'có company có pack chưa patient', patients);

      if (companies.length > 0) {
        // Chuyển mảng thành chuỗi và loại bỏ dấu ngoặc kép ở tên trường
        const companiesString = JSON.stringify(companies)
          .replace(/"(\w+)"\s*:/g, '$1:')  // Bỏ dấu ngoặc kép ở tên trường
          .replace(/"([^"]*)"/g, '"$1"');  // Giữ dấu ngoặc kép ở giá trị chuỗi
        const insertCompanies = gql`mutation MyMutation {
          insert_his_ace_companies(objects: ${companiesString}) {
            affected_rows
            returning {
              id
            }
          }
        }
        `
        console.log('insert', insertCompanies);
        const variables = {
        };
        await request(endpoint, insertCompanies, variables, headers)
          .then(function (data) {
            console.log(data)
            if (data?.data?.insert_his_ace_companies?.affected_rows) {
              resMessage.resInsertComs = data?.data?.insert_his_ace_companies?.affected_rows
            } else {
              resMessage.resInsertComs = false
            }
          })
          .catch(error => {
            console.error(error)
            resMessage.resInsertComs = false
          });
      }

      if (packs.length > 0) {
        // Chuyển mảng thành chuỗi và loại bỏ dấu ngoặc kép ở tên trường
        const packsString = JSON.stringify(packs)
          .replace(/"(\w+)"\s*:/g, '$1:')  // Bỏ dấu ngoặc kép ở tên trường
          .replace(/"([^"]*)"/g, '"$1"');  // Giữ dấu ngoặc kép ở giá trị chuỗi
        const insertPacks = gql`mutation MyMutation {
          insert_his_ace_company_service_packs(objects: ${packsString}) {
            affected_rows
            returning {
              id
            }
          }
        }
        `
        console.log('insertPacks', insertPacks);
        const variablesPacks = {
        };
        await request(endpoint, insertPacks, variablesPacks, headers)
          .then(function (data) {
            console.log(data)
            if (data?.data?.insert_his_ace_company_service_packs?.affected_rows) {
              resMessage.resInsertPacks = data?.data?.insert_his_ace_company_service_packs?.affected_rows
            } else {
              resMessage.resInsertPacks = false
            }
          })
          .catch(error => {
            console.error(error)
            resMessage.resInsertPacks = false
          });
      }

      if (patients.length > 0) {
        // Chuyển mảng thành chuỗi và loại bỏ dấu ngoặc kép ở tên trường
        const patientsString = JSON.stringify(patients)
          .replace(/"(\w+)"\s*:/g, '$1:')  // Bỏ dấu ngoặc kép ở tên trường
          .replace(/"([^"]*)"/g, '"$1"');  // Giữ dấu ngoặc kép ở giá trị chuỗi
        const insertPatients = gql`mutation MyMutation {
          insert_his_ace_patients(objects: ${patientsString}) {
            affected_rows
            returning {
              id
            }
          }
        }
        `
        console.log('insertPatients', insertPatients);
        const variablesPatients = {
        };
        await request(endpoint, insertPatients, variablesPatients, headers)
          .then(async function (data) {
            console.log(data)
            if (data?.insert_his_ace_patients?.affected_rows) {
              resMessage.resInsertPatients = data?.insert_his_ace_patients?.affected_rows
              const differenceOfPacksIDs = []
              for (let index = 0; index < differenceOfPacks.length; index++) {
                if (differenceOfPacks[index].company_service_pack_id) {
                  differenceOfPacksIDs.push(differenceOfPacks[index].company_service_pack_id)
                }
              }
              const queryPacks = gql`query MyQuery {
                his_ace_company_service_packs(where: {id: {_in: [${differenceOfPacksIDs}]}}) {
                  id
                  number_of_employees
                }
              }`
              console.log('queryPacks', queryPacks);
              const variablesSelectPacks = {
              };
              await request(endpoint, queryPacks, variablesSelectPacks, headers)
                .then(async function (data) {
                  console.log(data)
                  if (data?.his_ace_company_service_packs[0]?.id) {
                    console.log('Lấy thông tin Pack thành công!');
                    for (let index = 0; index < differenceOfPacks.length; index++) {
                      if (differenceOfPacks[index].company_service_pack_id && differenceOfPacks[index].number_of_employees) {
                        const tempIndexUpPack = data?.his_ace_company_service_packs?.findIndex(c => c.id === differenceOfPacks[index].company_service_pack_id)
                        const updatePacks = gql`mutation MyMutation {
                          update_his_ace_company_service_packs(where: {id: {_eq: ${data?.his_ace_company_service_packs[tempIndexUpPack].id}}}, _set: {number_of_employees: ${Number(data?.his_ace_company_service_packs[tempIndexUpPack].number_of_employees) + Number(differenceOfPacks[index].number_of_employees)}}) {
                            affected_rows
                          }
                        }`
                        console.log('updatePacks', updatePacks);
                        const variablesUpPacks = {
                        };
                        await request(endpoint, updatePacks, variablesUpPacks, headers)
                          .then(function (data) {
                            console.log(data)
                            if (data?.update_his_ace_company_service_packs?.affected_rows) {
                              resMessage.resUpdatePack = { data: data.update_his_ace_company_service_packs }
                              console.log('Update Pack thành công! id:', differenceOfPacks[index].company_service_pack_id);
                            } else {
                              resMessage.resUpdatePack = false
                            }
                          })
                          .catch(error => {
                            console.error(error)
                            resMessage.resInsertPatients = false
                          });
                      }
                    }
                  } else {
                    resMessage.resUpdatePack = false
                  }
                })
                .catch(error => {
                  console.error(error)
                });
            } else {
              resMessage.resInsertPatients = false
            }
          })
          .catch(error => {
            console.error(error)
            resMessage.resInsertPatients = false
          });
      }
      if (!res.headersSent) {
        res.status(200).json({
          companies: companies,
          resMessage
        });
      }
    } else {
      console.log('Không có dữ liệu công ty từ database Phương Đông!');
      if (!res.headersSent) {
        res.json({
          success: false,
          message: 'Không có dữ liệu nào được lấy từ database Phương Đông!',
          resMessage
        });
      }
    }
  } catch (err) {
    console.log('Lỗi khi lấy dữ liệu công ty từ database Phương Đông!', err);
    // Xử lý lỗi và trả về thông báo lỗi
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu công ty từ database Phương Đông!',
        error: err.message,
        resMessage: 'No data!'
      });
    }

  }
}