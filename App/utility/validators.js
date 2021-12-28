exports.validateName = (value) => /^[a-z A-Z]*$/.test(value);

exports.validatePincode = (value) => /^[0-9]{6}$/.test(value);

exports.validateEmail = (value) =>
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    value
  );

exports.validatePhone = (value) => /^\+91\s[1-9]{1}[0-9]{9}$/.test(value);
