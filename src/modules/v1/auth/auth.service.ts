import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { hasValue } from '#utils/guarder';
import { AccountService } from '#v1/account/account.service';

import { AuthError } from './auth.constant';
import { LogInDTO } from './dtos/log-in.dto';
import { LogInResponse } from './responses/log-in.response';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly accountService: AccountService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAndSignToken({
    email,
    attempt,
  }: LogInDTO): Promise<LogInResponse> {
    const account = await this.accountService.findByEmail(email);

    if (hasValue(account) && (await account.comparePassword(attempt))) {
      const token = await this.jwtService.signAsync({
        uuid: account.uuid,
        role: account.role,
        email: account.email,
      });

      this.logger.debug(`Account [${email}] logged in`);

      return { token };
    }

    throw new BadRequestException(AuthError.InvalidLoginCredentials);
  }
}
