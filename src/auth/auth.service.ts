import * as jwt from "jsonwebtoken";
import {
  Injectable,
} from "@nestjs/common";
import {
  Repository,
} from "typeorm";
import {
  Auth,
  User,
} from "src/entities";
import {
  InjectRepository,
} from "@nestjs/typeorm";
import {
  JwtService,
} from "@nestjs/jwt";
import {
  ConfigService,
} from "@nestjs/config";

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(Auth, "writable")
    private readonly authRepository: Repository<Auth>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  public getExpireDate(token: string) {
    const decode = this.jwtService.decode(token);
    const expiredAt = new Date(parseInt(decode["exp"], 10) * 1000);
    return expiredAt;
  }

  public issueAccessToken(user: User) {
    return this.jwtService.signAsync({ sub: user.id, nickname: user.nickname });
  }

  public verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync(token);
  }

  public async issueRefreshToken(user: User) {
    const token = jwt.sign({ sub: user.id, nickname: user.nickname }, this.configService.getOrThrow("jwt.refreshTokenSecret"), { expiresIn: "30d" });
    const auth = new Auth();
    auth.user = user;
    auth.refreshToken = token;
    await this.authRepository.save(auth);
    return token;
  }

  public async reissueRefreshToken(token: string, user: User) {
    const exist = await this.authRepository.findOne({ where: { refreshToken: token, user: { id: user.id } } });
    const newToken = jwt.sign({ sub: user.id, nickname: user.nickname }, this.configService.getOrThrow("jwt.refreshTokenSecret"), { expiresIn: "30d" });
    exist.refreshToken = newToken;
    await this.authRepository.save(exist);
    return newToken;
  }

  public verifyRefreshToken(token: string) {
    return jwt.verify(token, this.configService.getOrThrow("jwt.refreshTokenSecret"));
  }
}