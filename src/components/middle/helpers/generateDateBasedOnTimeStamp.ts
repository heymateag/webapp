const GenerateNewDate = (time: any): Date => {
  if (time.length <= 10) {
    return new Date(parseInt(time || '', 10) * 1000);
  } else {
    return new Date(parseInt(time || '', 10));
  }
};

export default GenerateNewDate;
