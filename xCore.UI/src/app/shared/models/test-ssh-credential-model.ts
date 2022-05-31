export class TestSshConnection {
    constructor(ipAddress: string, sshUser: string, ssHPassword: string) {
        this.ipAddress = ipAddress;
        this.sshUser = sshUser;
        this.ssHPassword = ssHPassword;
    }

    ipAddress: string;
    sshUser: string;
    ssHPassword: string;
}
