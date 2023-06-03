import { envVariables } from 'src';
import { secondsPerUnit } from 'src/utils/auth.utils';

export default (): envVariables => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    accessTokenExpiryInSeconds:
      parseInt(process.env.ACCESS_TOKEN_EXPIRY.slice(0, -1)) *
      secondsPerUnit[process.env.ACCESS_TOKEN_EXPIRY.at(-1)],
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
    refreshTokenExpiryInSeconds:
      parseInt(process.env.REFRESH_TOKEN_EXPIRY.slice(0, -1)) *
      secondsPerUnit[process.env.REFRESH_TOKEN_EXPIRY.at(-1)],
  },
});
