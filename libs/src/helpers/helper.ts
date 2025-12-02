import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Helper {
  constructor(private jwtService: JwtService) {}

  /**
   * generate hash from password or string
   * @param {string} password
   * @returns {Promise<string>}
   */
  async hashPassword(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  }

  /**
   * compare password with hash
   * @param {string} password
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * generate token
   * @param {any} payload
   * @returns {Promise<string>}
   * @memberof Helper
   */
  async generateToken(payload: any): Promise<string> {
    return await this.jwtService.signAsync(payload);
  }
}
