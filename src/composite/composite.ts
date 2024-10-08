import { Prediction, PredictionEvent, PredictionProvider } from "fireiron";

import { BasicRunwayProvider, BasicRunwayInput } from "../runway/runway-basic";

import { PikaPredictOptions } from "../pika/pika-provider";
import { BasicPikaProvider } from "../pika/pika-basic";

import { StableVideoDiffusionProvider, StableVideoDiffusionInput } from "../replicate/replicate-stvd";

export type CompositeVideoProviderOptions = {
    runwayKey: string;
    pikaKey: string;
    replicateKey: string;
    domain: string;
    bucket: string;
};

export enum CompositeVideoProviderTargetAPI {
    runway,
    pika,
    replicate
}

export abstract class CompositeVideoProvider<Input> implements PredictionProvider<Input> {
    runwayProvider: BasicRunwayProvider;
    pikaProvider: BasicPikaProvider;
    replicateProvider: StableVideoDiffusionProvider;

    public constructor(options: CompositeVideoProviderOptions) {
        this.runwayProvider = new BasicRunwayProvider(options.runwayKey, options.domain, options.bucket);
        this.pikaProvider = new BasicPikaProvider(options.pikaKey, options.domain);
        this.replicateProvider = new StableVideoDiffusionProvider(options.replicateKey, options.domain);
    }

    public async run(userIdentifier: string, input: Input): Promise<Prediction> {
        var prediction = await this.queuePrediction(userIdentifier, input);
        prediction.input = input as Object;
        return prediction;
    }

    async queuePrediction(userIdentifier: string, input: Input): Promise<Prediction> {
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

    async runTarget(target: CompositeVideoProviderTargetAPI, userIdentifier: string, input: Input): Promise<Prediction> {
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

    public canProcessHook(query: any, body: any): boolean {
        return this.runwayProvider.canProcessHook(query, body) ||
               this.pikaProvider.canProcessHook(query, body) ||
               this.replicateProvider.canProcessHook(query, body);
    }

    public async processHook(query: any, body: any): Promise<PredictionEvent> {
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

    abstract makeRunwayInput(userIdentifier: string, input: Input): Promise<BasicRunwayInput>;
    abstract makePikaInput(userIdentifier: string, input: Input): Promise<PikaPredictOptions>;
    abstract makeReplicateInput(userIdentifier: string, input: Input): Promise<StableVideoDiffusionInput>;
}