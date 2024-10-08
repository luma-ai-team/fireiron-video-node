"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StableVideoDiffusionProvider = void 0;
const fireiron_1 = require("fireiron");
class StableVideoDiffusionProvider extends fireiron_1.ReplicateProvider {
    async makeReplicateOptions(userIdentifier, input) {
        return {
            model: "stability-ai/stable-video-diffusion",
            version: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
            input: input
        };
    }
    async makePrediction(input, output) {
        return {
            identifier: output.id,
            input: input
        };
    }
}
exports.StableVideoDiffusionProvider = StableVideoDiffusionProvider;
//# sourceMappingURL=replicate-stvd.js.map