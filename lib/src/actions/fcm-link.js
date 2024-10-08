"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FCMLinkAction = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
class FCMLinkAction {
    constructor() {
        this.name = "fcmLink";
    }
    async run(request) {
        const adapter = new firestore_adapter_1.FirestoreAdapter();
        const reference = await adapter.prepareUserReference(request.user);
        await reference.update({
            pushToken: request.payload.token
        });
        return {};
    }
}
exports.FCMLinkAction = FCMLinkAction;
//# sourceMappingURL=fcm-link.js.map