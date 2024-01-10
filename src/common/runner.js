function* runner(data, sizeProcess) {
  while (data.length) {
    yield data.splice(0, sizeProcess);
  }
}

export default runner;
