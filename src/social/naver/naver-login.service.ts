import {
  Injectable,
} from "@nestjs/common";
import {
  ConfigService,
} from "@nestjs/config";

@Injectable()
export class NaverLoginService {

  constructor(
    private readonly configService: ConfigService,
  ) { }

  public async requestAccessToken(code: string, state: string) {
    const clientId = this.configService.getOrThrow("naver.clientId");
    const clientSecret = this.configService.getOrThrow("naver.clientSecret");
    const urlParams = new URLSearchParams();
    urlParams.append("grant_type", "authorization_code");
    urlParams.append("client_id", clientId);
    urlParams.append("client_secret", clientSecret);
    urlParams.append("code", code);
    urlParams.append("state", state);
    const res = await fetch(`https://nid.naver.com/oauth2.0/token?${urlParams.toString()}`);
    const data = await res.json();
    if (data.error != null) {
      // TODO: 에러처리
    }
    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string,
      tokenType: data.token_type as string,
      expiresIn: data.expires_in as string,
    };
  }

  public async requestProfile(accessToken: string) {
    const init: RequestInit = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const res = await fetch("https://openapi.naver.com/v1/nid/me", init);
    const data = await res.json();
    return {
      resultcode: data.resultcode,
      message: data.message,
      response: {
        id: data.response.id,
        nickname: data.response.nickname,
        profileImage: data.response.profile_image,
        age: data.response.age,
        gender: data.response.gender,
      },
    };
  }
}