"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictAction = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
class PredictAction {
    constructor(provider) {
        this.name = "predict";
        this.cost = 1;
        this.firestore = new firestore_adapter_1.FirestoreAdapter();
        this.provider = provider;
    }
    async run(request) {
        await this.firestore.withdraw(request.user, this.cost);
        try {
            const prediction = await this.provider.run(request.user, request.payload);
            await this.firestore.storePrediction(request.user, prediction);
            return {
                identifier: prediction.identifier
            };
        }
        catch (error) {
            await this.firestore.deposit(request.user, this.cost);
            throw error;
        }
    }
}
exports.PredictAction = PredictAction;
;
//# sourceMappingURL=predict.js.map