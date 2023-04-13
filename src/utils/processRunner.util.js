function* processRunner(data, sizeProcess) {
  let resources = [];

  while (data.length) {
    resources = data.splice(0, sizeProcess);

    yield resources;
  }
}

module.exports = processRunner;
