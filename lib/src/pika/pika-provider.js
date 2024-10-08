"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PikaProvider = void 0;
const fireiron_1 = require("fireiron");
const axios_1 = __importDefault(require("axios"));
class PikaProvider {
    constructor(key, domain) {
        this.client = axios_1.default.create({
            baseURL: "https://api.pikapikapika.io",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            }
        });
        this.domain = domain;
    }
    async run(userIdentifier, input) {
        const options = await this.makePikaOptions(userIdentifier, input);
        var body = options;
        body.webhookOverride = this.makeWebhookURL(userIdentifier);
        const response = await this.client.post("/web/generate", body);
        const data = response.data;
        return await this.makePrediction(input, data);
    }
    canProcessHook(query, body) {
        return query.source == "pika";
    }
    async processHook(query, body) {
        var _a;
        const predictionIdentifier = (_a = query.prediction) !== null && _a !== void 0 ? _a : body.job.id;
        try {
            const video = body.videos[0];
            const url = video.resultUrl;
            return {
                identifier: predictionIdentifier,
                state: fireiron_1.PredictionState.Completed,
                output: url
            };
        }
        catch (error) {
            return {
                identifier: predictionIdentifier,
                state: fireiron_1.PredictionState.Failed,
                error: {
                    code: 1,
                    message: "pika error"
                }
            };
        }
        return {
            identifier: predictionIdentifier,
            state: fireiron_1.PredictionState.Pending
        };
    }
    makeWebhookURL(userIdentifier) {
        return "https://" + this.domain + "/predictionHook?source=pika&user=" + userIdentifier;
    }
}
exports.PikaProvider = PikaProvider;
//# sourceMappingURL=pika-provider.js.map