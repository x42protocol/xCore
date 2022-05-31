export class WordPressProvisionRequest
{
  constructor(subdomain: string) {
    this.subdomain = subdomain;
  }
  public subdomain: string;
}
