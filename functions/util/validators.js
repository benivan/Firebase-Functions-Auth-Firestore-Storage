const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

const isValidEmail = (email) => {
  const regEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isStrongPassword = (password) => {
  if (password.length < 6) {
    return true;
  } else {
    return false;
  }
};

exports.validateSignupData = (data) => {
  let errors = {};

  // email validator
  if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Please Enter a valid email";
  }

  //password Validator
  if (isEmpty(data.password)) errors.password = "Must not be empty";

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Must be match";
  }

  //password Strengh
  if (isStrongPassword(data.password)) errors.password = "Weak!!";

  // handle Validator
  if (isEmpty(data.handle)) errors.handle = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  let errors = [];

  if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  } else if (!isValidEmail(data.email)) {
    errors.email = "please enter a valid email";
  }

  if (isEmpty(data.password)) {
    errors.password = "Must not be empty";
  } else if (isStrongPassword(data.password)) {
    errors.password = "Weak!!";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;

  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }
  if (!isEmpty(data.location.trim())) userDetails.location = data.location;
  return userDetails;
};
