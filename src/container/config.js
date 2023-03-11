if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

export default {
  PORT: process.env.PORT,
};
