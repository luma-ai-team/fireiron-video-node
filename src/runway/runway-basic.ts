import { RunwayPredictOptions, RunwayPredictResponse, RunwayProvider } from "./runway-provider";
import { PredictionCompletionEvent, PredictionEvent, PredictionState, Prediction } from "fireiron";
import { FirestoreAdapter } from "fireiron";
import { StorageAdapter } from "fireiron";

import util from "util";
const exec = util.promisify(require('child_process').exec);

import Sharp from "sharp"
import ffmpegPath from "ffmpeg-static";
import { v4 as uuid } from "uuid";

export type RunwayModel = "gen2" | "gen3";

export type BasicRunwayInput = {
    text_prompt?: string;
    img_prompt: string;
    model?: RunwayModel;
    image_as_end_frame?: boolean;
    flip?: boolean;
    motion?: number; 
    seed?: number;
    time?: number;
};

export interface RunwayMetadata {
    cropSize: {
        width: number;
        height: number;
    };
}

export class BasicRunwayProvider extends RunwayProvider<BasicRunwayInput> {
    storage: StorageAdapter;
    firestore: FirestoreAdapter;

    public constructor(key: string, domain: string, bucket: string) {
        super(key, domain);
        this.storage = new StorageAdapter(bucket);
        this.firestore = new FirestoreAdapter();
    }

    public async makeRunwayOptions(userIdentifier: string, input: BasicRunwayInput): Promise<RunwayPredictOptions> {
        const inputURL = new URL(input.img_prompt);
        const inputFilename = inputURL.pathname.split('/').pop() ?? "input.jpg";
        const path = await this.storage.downloadTemporaryCopy(inputURL.toString(), inputFilename);

        const outputFilename = inputFilename.split(".").pop() + "-processed.jpg";
        const outputPath = "/tmp/" + outputFilename;

        const image = Sharp(path);
        const metadata = await image.metadata();
        const imageSize = {
            width: metadata.width ?? 1280,
            height: metadata.height ?? 768
        };

        const ratio = Math.min(1280 / imageSize.width, 768 / imageSize.height);
        const cropSize = {
            width: imageSize.width * ratio,
            height: imageSize.height * ratio
        };

        await image.resize(1280, 768, {
            fit: "contain"
        }).toFile(outputPath);

        input.img_prompt = await this.storage.upload(outputPath, uuid());
        this.storage.cleanup();

        var options: RunwayPredictOptions = {
            path: "/runway/generate/imageDescription",
            cropSize: cropSize,
            body: input
        };

        if (input.text_prompt == null) {
            options.path = "/runway/generate/image";
        }

        return options;
    }

    public async makePrediction(input: BasicRunwayInput, output: RunwayPredictResponse): Promise<Prediction> {
        return {
            identifier: output.uuid,
            input: input,
            metadata: {
                cropSize: output.cropSize
            }
        };
    }

    public async processHook(query: any, body: any): Promise<PredictionEvent> {
        const userIdentifier = query.user as string;
        const event = await super.processHook(query, body);
        switch (event.state) {
            case PredictionState.Completed:
                return await this.cropPredictionVideo(event, userIdentifier);
            default:
                break;
        }

        return event;
    }

    async cropPredictionVideo(event: PredictionCompletionEvent, userIdentifier: string): Promise<PredictionCompletionEvent> {
        const prediction = await this.firestore.fetchPrediction(userIdentifier, event.identifier);
        const cropSize = (prediction.metadata as RunwayMetadata).cropSize;
        if (cropSize == null) {
            return event;
        }
        
        const inputFileName = `${event.identifier}.mp4`;
        const outputFileName = `${event.identifier}-crop.mp4`;
        const input = await this.storage.downloadTemporaryCopy(event.output as string, inputFileName);

        const outputPath = `/tmp/${outputFileName}`;
        await exec(`${ffmpegPath} -i ${input} -vf "crop=${cropSize.width}:${cropSize.height}" ${outputPath}`);
        const output = await this.storage.upload(outputPath, userIdentifier + "/" + outputFileName);
        this.storage.cleanup();

        return {
            identifier: event.identifier,
            state: PredictionState.Completed,
            output: output
        };
    }
}