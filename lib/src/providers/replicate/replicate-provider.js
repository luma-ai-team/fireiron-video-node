"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplicateProvider = void 0;
const provider_1 = require("../provider");
const replicate_1 = __importDefault(require("replicate"));
class ReplicateProvider {
    constructor(key, domain) {
        this.replicate = new replicate_1.default({
            auth: key
        });
        this.domain = domain;
    }
    async run(userIdentifier, input) {
        const options = await this.makeReplicateOptions(userIdentifier, input);
        const result = await this.replicate.predictions.create(options);
        return await this.makePrediction(input, result);
    }
    async processHook(query, body) {
        var _a;
        const predictionIdentifier = (_a = query.prediction) !== null && _a !== void 0 ? _a : body.id;
        var output = body.output;
        if (Array.isArray(output)) {
            output = output[0];
        }
        if (output != null) {
            return {
                identifier: predictionIdentifier,
                state: provider_1.PredictionState.Completed,
                output: output
            };
        }
        const error = body.error;
        if (error != null) {
            return {
                identifier: predictionIdentifier,
                state: provider_1.PredictionState.Failed,
                error: error
            };
        }
        return {
            identifier: predictionIdentifier,
            state: provider_1.PredictionState.Pending
        };
    }
    makeWebhookURL(userIdentifier) {
        return "https://" + this.domain + "predictionHook?user=" + userIdentifier;
    }
}
exports.ReplicateProvider = ReplicateProvider;
//# sourceMappingURL=replicate-provider.js.map