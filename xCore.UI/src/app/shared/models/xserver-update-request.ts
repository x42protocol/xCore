export class XserverUpdateRequest {
  constructor(ipAddress: string, sshUser: string, ssHPassword: string, profile: string) {
    this.ipAddress = ipAddress;
    this.sshUser = sshUser;
    this.ssHPassword = ssHPassword;
    this.profile = profile;

  }
  public ipAddress: string;
  public sshUser: string;
  public ssHPassword: string;
  public profile: string;

}
