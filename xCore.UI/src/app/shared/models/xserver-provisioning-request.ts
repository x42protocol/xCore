export class XserverProvisioningRequest
{
  constructor(ipAddress: string, sshUser: string, ssHPassword: string, emailAddress: string, certificatePassword: string, databasePassword: string, profile: string) {
    this.ipAddress = ipAddress;
    this.sshUser = sshUser;
    this.ssHPassword = ssHPassword;
    this.emailAddress = emailAddress;
    this.certificatePassword = certificatePassword;
    this.databasePassword = databasePassword;
    this.profile = profile;

  }
  public ipAddress: string;
  public sshUser: string;
  public ssHPassword: string;
  public emailAddress: string;
  public certificatePassword: string;
  public databasePassword: string;
  public profile: string;

}
