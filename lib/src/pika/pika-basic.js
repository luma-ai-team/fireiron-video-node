"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicPikaProvider = void 0;
const pika_provider_1 = require("./pika-provider");
class BasicPikaProvider extends pika_provider_1.PikaProvider {
    async makePikaOptions(userIdentifier, input) {
        return input;
    }
    async makePrediction(input, output) {
        return {
            identifier: output.job.id,
            input: input
        };
    }
}
exports.BasicPikaProvider = BasicPikaProvider;
//# sourceMappingURL=pika-basic.js.map