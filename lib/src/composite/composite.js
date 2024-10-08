"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeVideoProvider = exports.CompositeVideoProviderTargetAPI = void 0;
const runway_basic_1 = require("../runway/runway-basic");
const pika_basic_1 = require("../pika/pika-basic");
const replicate_stvd_1 = require("../replicate/replicate-stvd");
var CompositeVideoProviderTargetAPI;
(function (CompositeVideoProviderTargetAPI) {
    CompositeVideoProviderTargetAPI[CompositeVideoProviderTargetAPI["runway"] = 0] = "runway";
    CompositeVideoProviderTargetAPI[CompositeVideoProviderTargetAPI["pika"] = 1] = "pika";
    CompositeVideoProviderTargetAPI[CompositeVideoProviderTargetAPI["replicate"] = 2] = "replicate";
})(CompositeVideoProviderTargetAPI || (exports.CompositeVideoProviderTargetAPI = CompositeVideoProviderTargetAPI = {}));
class CompositeVideoProvider {
    constructor(options) {
        this.runwayProvider = new runway_basic_1.BasicRunwayProvider(options.runwayKey, options.domain, options.bucket);
        this.pikaProvider = new pika_basic_1.BasicPikaProvider(options.pikaKey, options.domain);
        this.replicateProvider = new replicate_stvd_1.StableVideoDiffusionProvider(options.replicateKey, options.domain);
    }
    async run(userIdentifier, input) {
        var prediction = await this.queuePrediction(userIdentifier, input);
        prediction.input = input;
        return prediction;
    }
    async queuePrediction(userIdentifier, input) {
        try {
            return this.runTarget(CompositeVideoProviderTargetAPI.runway, userIdentifier, input);
        }
        catch (error) {
            try {
                return this.runTarget(CompositeVideoProviderTargetAPI.pika, userIdentifier, input);
            }
            catch (error) {
                return this.runTarget(CompositeVideoProviderTargetAPI.replicate, userIdentifier, input);
            }
        }
    }
    async runTarget(target, userIdentifier, input) {
        switch (target) {
            case CompositeVideoProviderTargetAPI.runway:
                const runwayInput = await this.makeRunwayInput(userIdentifier, input);
                return this.runwayProvider.run(userIdentifier, runwayInput);
            case CompositeVideoProviderTargetAPI.pika:
                const pikaInput = await this.makePikaInput(userIdentifier, input);
                return this.pikaProvider.run(userIdentifier, pikaInput);
            case CompositeVideoProviderTargetAPI.replicate:
                const replicateInput = await this.makeReplicateInput(userIdentifier, input);
                return this.replicateProvider.run(userIdentifier, replicateInput);
        }
    }
    canProcessHook(query, body) {
        return this.runwayProvider.canProcessHook(query, body) ||
            this.pikaProvider.canProcessHook(query, body) ||
            this.replicateProvider.canProcessHook(query, body);
    }
    async processHook(query, body) {
        if (this.runwayProvider.canProcessHook(query, body)) {
            return this.runwayProvider.processHook(query, body);
        }
        if (this.pikaProvider.canProcessHook(query, body)) {
            return this.pikaProvider.processHook(query, body);
        }
        if (this.replicateProvider.canProcessHook(query, body)) {
            return this.replicateProvider.processHook(query, body);
        }
        throw new Error("Unrecognized webhook");
    }
}
exports.CompositeVideoProvider = CompositeVideoProvider;
//# sourceMappingURL=composite.js.map