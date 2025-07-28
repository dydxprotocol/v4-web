/**
 * @description RFC-compliant Email validation regex
 * @validates total length (6-254), local part (1-64 chars), domain structure
 * @url https://www.regular-expressions.info/email.html
 */
const emailValueRegex =
  /^(?=[a-z0-9@.!#$%&'*+/=?^_`{|}~-]{6,254}$)(?=[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@)[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:(?=[a-z0-9-]{1,63}\.)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?=[a-z0-9-]{1,63}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const isValidEmail = (email: string) => {
  return emailValueRegex.test(email);
};
