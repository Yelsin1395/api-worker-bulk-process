function normalizeCurrentDate() {
  const current = new Date();
  const year = current.getFullYear();
  const month = (current.getMonth() + 1).toString().padStart(2, '0');
  const day = current.getDate().toString().padStart(2, '0');

  const formatDate = `${year}-${month}-${day}`;

  return formatDate;
}

function normalizeCurrentDateTimeUtc() {
  const current = new Date();
  return current.toISOString();
}

function normalizeDate(date) {
  if (!date) {
    return normalizeCurrentDate();
  }

  const separateDate = date.split('/');

  if (separateDate.length !== 3) {
    console.log('Format date invalid');
    return normalizeCurrentDate();
  }

  const day = separateDate[0];
  const month = separateDate[1];
  const year = separateDate[2];

  const formatDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  return formatDate;
}

function normalizeDateTime(date) {
  if (!date) {
    return normalizeCurrentDateTimeUtc();
  }

  const separateDate = date.split('/');

  const datetime = new Date(separateDate[2], separateDate[1] - 1, separateDate[0]);
  const formatDateTimeUtc = datetime.toISOString();

  return formatDateTimeUtc;
}

function normalizeTypeInvoice(affect, unaffected) {
  const payload = {};

  const codeTypes = {
    affect: 'AFECTA',
    unaffected: 'INAFECTA',
  };

  if (affect) {
    payload.tipo = codeTypes['affect'];
    payload.nroFactura = affect;
  }

  if (unaffected) {
    payload.tipo = codeTypes['unaffected'];
    payload.nroFactura = unaffected;
  }

  return Object.values(payload).length ? payload : null;
}

module.exports = {
  normalizeDate,
  normalizeDateTime,
  normalizeTypeInvoice,
};
