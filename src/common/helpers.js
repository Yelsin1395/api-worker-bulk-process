function currentDateDDMMAA() {
  const current = new Date();
  const year = current.getFullYear();
  const month = (current.getMonth() + 1).toString().padStart(2, '0');
  const day = current.getDate().toString().padStart(2, '0');

  const formatDate = `${day}/${month}/${year}`;

  return formatDate;
}

function normalizeCurrentDate() {
  const current = new Date();
  const year = current.getFullYear();
  const month = (current.getMonth() + 1).toString().padStart(2, '0');
  const day = current.getDate().toString().padStart(2, '0');

  const formatDate = `${year}-${month}-${day}`;

  return formatDate;
}

function normalizeCurrentDateTimeUtc() {
  const fechaHoraActual = new Date();

  const anio = fechaHoraActual.getUTCFullYear();
  const mes = (fechaHoraActual.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = fechaHoraActual.getUTCDate().toString().padStart(2, '0');
  const horas = fechaHoraActual.getUTCHours().toString().padStart(2, '0');
  const minutos = fechaHoraActual.getUTCMinutes().toString().padStart(2, '0');
  const segundos = fechaHoraActual.getUTCSeconds().toString().padStart(2, '0');
  const milisegundos = fechaHoraActual.getUTCMilliseconds().toString().padStart(3, '0');

  const fechaHoraFormateada = `${anio}-${mes}-${dia}T${horas}:${minutos}:${segundos}.${milisegundos}Z`;

  return fechaHoraFormateada;
}

function normalizeDate(date) {
  if (!date) {
    return normalizeCurrentDate();
  }

  let separateDate = [];

  if (date.split('/').length === 3) {
    separateDate = date.split('/');
  }

  if (date.split('-').length === 3) {
    separateDate = date.split('-');
  }

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

function normalizeDateTime(date, type) {
  if (!date) {
    return normalizeCurrentDateTimeUtc();
  }

  let separateDate = [];
  let year = null;
  let month = null;
  let day = null;
  const hours = '00';
  const min = '00';

  if (date.split('/').length === 3) {
    separateDate = date.split('/');
  }

  if (date.split('-').length === 3) {
    separateDate = date.split('-');
  }

  if (separateDate.length === 0) {
    return normalizeCurrentDateTimeUtc();
  }

  if (type === 2) {
    day = separateDate[2];
    month = separateDate[1];
    year = separateDate[0];
  } else {
    year = separateDate[2];
    month = separateDate[1];
    day = separateDate[0];
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours}:${min}:00.000Z`;
}

function isTimestamp(number) {
  const maxTimestamp = 9999999999999;
  const minTimestamp = 1000000000000;

  if (Number.isInteger(number) && number >= minTimestamp && number <= maxTimestamp) {
    return true;
  }

  return false;
}

function normalizeDateTimeSeparate(datetime) {
  if (isTimestamp(datetime)) {
    const date = new Date(datetime);
    return date.toISOString();
  }

  if (datetime.split(' ').length > 1) {
    const fechaHora = new Date(datetime.replace(/(\d+).(\d+).(\d+) (\d+):(\d+):(\d+)/, '$3-$2-$1T$4:$5:$6'));
    return fechaHora.toISOString();
  }

  return null;
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

  return Object.values(payload).length ? payload : '';
}

function buildObjectToQueryString(object) {
  const conditions = [];

  for (const key in object) {
    conditions.push(`${key} = '${object[key]}'`);
  }

  if (conditions.length > 1) {
    return conditions.join(' AND ');
  } else if (conditions.length === 1) {
    return conditions.join('');
  } else {
    return null;
  }
}

module.exports = {
  currentDateDDMMAA,
  normalizeCurrentDate,
  normalizeCurrentDateTimeUtc,
  normalizeDate,
  normalizeDateTime,
  normalizeDateTimeSeparate,
  normalizeTypeInvoice,
  buildObjectToQueryString,
};
