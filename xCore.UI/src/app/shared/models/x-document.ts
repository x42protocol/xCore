import {
  InstructionTypeEnum,
  XDocumentTypeEnum,
} from '../contants/x-document-constants';

export class XDocument {
  constructor(
    documentType: XDocumentTypeEnum,
    instructionType: InstructionTypeEnum,
    keyAddress: string,
    data: any,
    wallet: string,
    password: string
  ) {
    this.documentType = documentType;
    this.instructionType = instructionType;
    this.keyAddress = keyAddress;
    this.data = data;
    this.wallet = wallet;
    this.account = 'coldStakingColdAddresses';
    this.password = password;

  }

  public documentType: XDocumentTypeEnum;
  public instructionType: InstructionTypeEnum;
  public keyAddress: string;
  public data: any;
  public wallet: string;
  public account: string;
  public password: string;

}
