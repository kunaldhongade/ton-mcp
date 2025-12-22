import "@stdlib/deploy";

contract Counter with Deployable {
    counter: Int = 0;

    init() {}

    receive("increment") {
        self.counter += 1;
    }

    receive("decrement") {
        self.counter -= 1;
    }

    get fun getCounter(): Int {
        return self.counter;
    }
}
