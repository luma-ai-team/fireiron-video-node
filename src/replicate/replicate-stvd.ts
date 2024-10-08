import { ReplicateProvider, ReplicateOptions, Prediction } from "fireiron";
import * as Replicate from "replicate";

export type StableVideoDiffusionInput = {
    input_image: string;
    video_length: string;
    sizing_strategy: string;
    frames_per_second: number;
    motion_bucket_id: number;
    cond_aug: number;
    decoding_t: number;
};

export class StableVideoDiffusionProvider extends ReplicateProvider<StableVideoDiffusionInput> {
    public async makeReplicateOptions(userIdentifier: string, input: StableVideoDiffusionInput): Promise<ReplicateOptions> {
        return {
            model: "stability-ai/stable-video-diffusion",
            version: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
            input: input
        };
    }

    public async makePrediction(input: StableVideoDiffusionInput, output: Replicate.Prediction): Promise<Prediction> {
        return {
            identifier: output.id,
            input: input
        };
    }
}