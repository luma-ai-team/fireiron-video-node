import { Prediction, PredictionProvider, PredictionState, PredictionEvent } from "fireiron";
import axios, { Axios } from "axios"

export type PikaVideoOptions = {
    frameRate: number;
    parameters: {
        guidanceScale: number;
        motion: number;
        negativePrompt?: string;
    };
};

export type PikaPredictOptions = {
    promptText?: string;
    options: PikaVideoOptions;
    video?: string;
    image?: string;
    model?: string;
    webhookOverride?: string;
};

export type PikaPredictResponse = {
    job: PikaJob;
    video: PikaVideo;
};

export type PikaJob = {
    id: string;
};

export type PikaVideo = {
    id: string;
    status: string;
    resultUrl?: string;
};

export type PikaHookData = {
    job: PikaJob;
    videos: PikaVideo[];
};

export abstract class PikaProvider<Input> implements PredictionProvider<Input> {
    client: Axios;
    domain: string;

    public constructor(key: string, domain: string) {
        this.client = axios.create({
            baseURL: "https://api.pikapikapika.io",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            }
        });
        this.domain = domain;
    }

    public async run(userIdentifier: string, input: Input): Promise<Prediction> {
        const options = await this.makePikaOptions(userIdentifier, input);

        var body = options;
        body.webhookOverride = this.makeWebhookURL(userIdentifier);

        const response = await this.client.post("/web/generate", body);
        const data: PikaPredictResponse = response.data;
        return await this.makePrediction(input, data);
    }

    public canProcessHook(query: any, body: any): boolean {
        return query.source == "pika";
    }

    public async processHook(query: any, body: any): Promise<PredictionEvent> {
        const predictionIdentifier = query.prediction ?? body.job.id;
        try {
            const video = body.videos[0] as PikaVideo;
            const url = video.resultUrl!;
            return {
                identifier: predictionIdentifier,
                state: PredictionState.Completed,
                output: url
            };
        }
        catch (error) {
            return {
                identifier: predictionIdentifier,
                state: PredictionState.Failed,
                error: {
                    code: 1,
                    message: "pika error"
                }
            };
        }

        return {
            identifier: predictionIdentifier,
            state: PredictionState.Pending
        };
    }

    public makeWebhookURL(userIdentifier: string): string {
        return "https://" + this.domain + "/predictionHook?source=pika&user=" + userIdentifier;
    }

    abstract makePikaOptions(userIdentifier: string, input: Input): Promise<PikaPredictOptions>;
    abstract makePrediction(input: Input, output: PikaPredictResponse): Promise<Prediction>;
}