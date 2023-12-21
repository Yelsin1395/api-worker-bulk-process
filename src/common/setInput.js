function string(input) {
  if (!input) {
    return '';
  }

  if (typeof input !== 'string') {
    return String(input);
  }

  return input;
}

function boolean(input) {
  if (!input) {
    return false;
  }

  if (typeof input !== 'boolean') {
    return true;
  }

  return input;
}

function number(input) {
  if (!input) {
    return 0;
  }

  if (typeof input !== 'number') {
    return parseFloat(input);
  }

  return input;
}

function date(input) {
  if (!input) {
    return null;
  }

  return input;
}

function array(input) {
  if (!input) {
    return [];
  }

  if (!input.length) {
    return [];
  }

  return input;
}

module.exports = { string, boolean, number, date, array };
