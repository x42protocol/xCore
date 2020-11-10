export class ServerIDResponse {
  public address: string;
  public serverId = '';

  public setServerId(address: string) {
    this.serverId = 'SID' + this.Base64EncodeUrl(btoa(address));
  }

  public getAddressFromServerId() {
    try {
      return atob(this.Base64DecodeUrl(this.serverId.substring(3)));
    }
    catch (err) {
      return '';
    }
  }

  private Base64EncodeUrl(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
  }

  private Base64DecodeUrl(str) {
    str = (str + '===').slice(0, str.length + (str.length % 4));
    return str.replace(/-/g, '+').replace(/_/g, '/');
  }
}
