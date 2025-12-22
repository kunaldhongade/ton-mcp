import "@stdlib/deploy";

contract WalletV4 with Deployable {
    seqno: Int = 0;
    publicKey: Int;
    walletId: Int = 698983191;

    init(publicKey: Int) {
        self.publicKey = publicKey;
    }

    receive(msg: Slice) {
        self.seqno += 1;
    }

    get fun getSeqno(): Int {
        return self.seqno;
    }
}
