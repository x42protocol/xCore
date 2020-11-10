export class PriceLockUtil {
  public address: string;
  public priceLockId = '';

  public setPriceLockId(address: string) {
    this.priceLockId = 'PL' + this.Base64EncodeUrl(btoa(address));
  }

  public getPriceLockId() {
    try {
      return atob(this.Base64DecodeUrl(this.priceLockId.substring(2)));
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
