import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';

class TokenGenerator {
  /**
   * @async
   * @returns {Promise<string>} The token
   * @param payload - The payload to be signed
   * @param key - The key to sign the token
   * @param options - The options for the token
   */
  async generate(
    payload: Record<string, string | number>,
    key: string,
    options: SignOptions,
  ): Promise<string> {
    return jwt.sign(payload, key, options);
  }

  /**
   * @async
   * @returns {Promise<boolean>} True if the passwords match, false otherwise.
   * @param {string} token - The token to validate.
   * @param {JwtPayload | string} key - The key to validate the token.
   */
  async validate(token: string, key: string): Promise<JwtPayload | string> {
    return jwt.verify(token, key);
  }
}

export const tokenGenerator = new TokenGenerator();
