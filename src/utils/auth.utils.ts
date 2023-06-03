import { genSalt, hash, compare } from 'bcrypt';

export const getPasswordHash = async (
  plainText: string,
  saltRounds: number,
) => {
  const salt = await genSalt(saltRounds);
  return { salt, passwordHash: await hash(plainText, salt) };
};

export const isPasswordValid = async (plainPassword: string, hash: string) => {
  const isMatch = await compare(plainPassword, hash);
  return isMatch;
};

export const hashRefreshToken = async (
  refreshToken: string,
  saltRounds: number,
) => {
  const salt = await genSalt(saltRounds);
  return { salt, refreshTokenHash: await hash(refreshToken, salt) };
};

export const matchRefreshToken = (
  plainRefreshToken: string,
  hashedRefreshToken: string,
) => compare(plainRefreshToken, hashedRefreshToken);

export const secondsPerUnit = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};
