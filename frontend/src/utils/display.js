export const formatFarmerCode = (record) => {
  const value = record?.farmer_code ?? record?.farmerCode ?? record?.farmer?.farmer_code ?? ''
  return String(value).trim() || '—'
}
