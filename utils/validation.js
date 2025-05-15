/**
 * Validates user input for registration and login
 * @param {Object} data - Input data to validate
 * @param {string} type - Type of validation to perform ('register' or 'login')
 * @returns {Object} Object containing validation errors and validity status
 */
const validateUser = (data, type) => {
  const errors = {};
  if (type === 'register' || type === 'login') {
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = 'Email is invalid';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    } else if (type === 'register' && data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
  }

  if (type === 'register') {
    if (!data.username) {
      errors.username = 'Username is required';
    } else if (data.username.length < 3 || data.username.length > 50) {
      errors.username = 'Username must be between 3 and 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (data.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(data.phone)) {
      errors.phone = 'Phone number is invalid';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

module.exports = validateUser;
