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
