function* runner(data, sizeProcess) {
  while (data.length) {
    const result = [];
    for (const item of data.splice(0, sizeProcess)) {
      if (typeof item.nroLote === 'string') {
        item.nroLote = parseInt(item.nroLote);
      }

      result.push(item);
    }

    yield result;
  }
}

export default runner;
