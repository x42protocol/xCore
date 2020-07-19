export class PriceLockUtil {
  public address: string;
  public priceLockId: string = '';

  public setPriceLockId(address: string) {
    this.priceLockId = "PL" + this.Base64EncodeUrl(btoa(address));
  }

  public getPriceLockId() {
    try {
      return atob(this.Base64DecodeUrl(this.priceLockId.substring(2)));
    }
    catch (err) {
      return "";
    }
  }

  /**
  * use this to make a Base64 encoded string URL friendly,
  * i.e. '+' and '/' are replaced with '-' and '_' also any trailing '='
  * characters are removed
  *
  * @param {String} str the encoded string
  * @returns {String} the URL friendly encoded String
  */
  private Base64EncodeUrl(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
  }

  /**
   * Use this to recreate a Base64 encoded string that was made URL friendly 
   * using Base64EncodeurlFriendly.
   * '-' and '_' are replaced with '+' and '/' and also it is padded with '+'
   *
   * @param {String} str the encoded string
   * @returns {String} the URL friendly encoded String
   */
  private Base64DecodeUrl(str) {
    str = (str + '===').slice(0, str.length + (str.length % 4));
    return str.replace(/-/g, '+').replace(/_/g, '/');
  }
}
