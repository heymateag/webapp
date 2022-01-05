const GenerateNewDate = (time: any): Date => {
  let sTime = time;
  if (typeof time === 'number') {
    sTime = time.toString();
  }
  if (sTime.length <= 10) {
    return new Date(parseInt(time || '', 10) * 1000);
  } else {
    return new Date(parseInt(time || '', 10));
  }
};

export default GenerateNewDate;
