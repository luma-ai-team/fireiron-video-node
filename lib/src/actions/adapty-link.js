"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptyLinkAction = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
class AdaptyLinkAction {
    constructor() {
        this.name = "adaptyLink";
    }
    async run(request) {
        const adapter = new firestore_adapter_1.FirestoreAdapter();
        const reference = await adapter.prepareUserReference(request.user);
        await reference.update({
            adaptyProfile: request.payload.profile
        });
        return {};
    }
}
exports.AdaptyLinkAction = AdaptyLinkAction;
//# sourceMappingURL=adapty-link.js.map