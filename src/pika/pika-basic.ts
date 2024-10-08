import { Prediction } from "fireiron";
import { PikaProvider, PikaPredictOptions, PikaPredictResponse } from "./pika-provider";

export class BasicPikaProvider extends PikaProvider<PikaPredictOptions> {
    public async makePikaOptions(userIdentifier: string, input: PikaPredictOptions): Promise<PikaPredictOptions> {
        return input;
    }

    public async makePrediction(input: PikaPredictOptions, output: PikaPredictResponse): Promise<Prediction> {
        return {
            identifier: output.job.id,
            input: input
        };
    }
}