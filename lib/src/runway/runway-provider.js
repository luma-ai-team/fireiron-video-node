"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunwayProvider = void 0;
const fireiron_1 = require("fireiron");
const axios_1 = __importDefault(require("axios"));
class RunwayProvider {
    constructor(key, domain) {
        this.client = axios_1.default.create({
            baseURL: "https://api.aivideoapi.com",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": key
            }
        });
        this.domain = domain;
    }
    async run(userIdentifier, input) {
        const options = await this.makeRunwayOptions(userIdentifier, input);
        var body = options.body;
        body["callback_url"] = this.makeWebhookURL(userIdentifier);
        const response = await this.client.post(options.path, body);
        const data = response.data;
        return await this.makePrediction(input, data);
    }
    canProcessHook(query, body) {
        return query.source == "runway";
    }
    async processHook(query, body) {
        var _a;
        const predictionIdentifier = (_a = query.prediction) !== null && _a !== void 0 ? _a : query.uuid;
        const response = await this.client.get(`/status?uuid=${predictionIdentifier}`);
        const data = response.data;
        if (data.url != null) {
            return {
                identifier: predictionIdentifier,
                state: fireiron_1.PredictionState.Completed,
                output: data.url
            };
        }
        if (data.status == "failed") {
            return {
                identifier: predictionIdentifier,
                state: fireiron_1.PredictionState.Failed,
                error: {
                    code: 1,
                    message: "runway error"
                }
            };
        }
        return {
            identifier: predictionIdentifier,
            state: fireiron_1.PredictionState.Pending
        };
    }
    makeWebhookURL(userIdentifier) {
        return "https://" + this.domain + "/predictionHook?source=runway&user=" + userIdentifier;
    }
}
exports.RunwayProvider = RunwayProvider;
//# sourceMappingURL=runway-provider.js.map