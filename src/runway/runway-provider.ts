import { Prediction, PredictionProvider, PredictionState, PredictionEvent } from "fireiron";
import axios, { Axios } from "axios"

export type RunwayCropSize = {
    width: number;
    height: number;
};

export type RunwayPredictOptions = {
    path: string;
    cropSize: RunwayCropSize;
    body: any;
};

export type RunwayPredictResponse = {
    uuid: string;
    cropSize: RunwayCropSize;
};

export type RunwayStatus = "success" | "failed" | string;
export type RunwayStatusResponse = {
    uuid: string;
    status: RunwayStatus;
    progress?: number;
    url?: string;
};

export abstract class RunwayProvider<Input> implements PredictionProvider<Input> {
    client: Axios;
    domain: string;

    public constructor(key: string, domain: string) {
        this.client = axios.create({
            baseURL: "https://api.aivideoapi.com",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": key
            }
        });
        this.domain = domain;
    }

    public async run(userIdentifier: string, input: Input): Promise<Prediction> {
        const options = await this.makeRunwayOptions(userIdentifier, input);

        var body: any = options.body;
        body["callback_url"] = this.makeWebhookURL(userIdentifier);

        const response = await this.client.post(options.path, body);
        const data: RunwayPredictResponse = response.data;
        return await this.makePrediction(input, data);
    }

    public canProcessHook(query: any, body: any): boolean {
        return query.source == "runway";
    }

    public async processHook(query: any, body: any): Promise<PredictionEvent> {
        const predictionIdentifier = query.prediction ?? query.uuid;
        const response = await this.client.get(`/status?uuid=${predictionIdentifier}`);
        const data: RunwayStatusResponse = response.data;

        if (data.url != null) {
            return {
                identifier: predictionIdentifier,
                state: PredictionState.Completed,
                output: data.url
            };
        }

        if (data.status == "failed") {
            return {
                identifier: predictionIdentifier,
                state: PredictionState.Failed,
                error: {
                    code: 1,
                    message: "runway error"
                }
            };
        }

        return {
            identifier: predictionIdentifier,
            state: PredictionState.Pending
        };
    }

    public makeWebhookURL(userIdentifier: string): string {
        return "https://" + this.domain + "/predictionHook?source=runway&user=" + userIdentifier;
    }

    abstract makeRunwayOptions(userIdentifier: string, input: Input): Promise<RunwayPredictOptions>;
    abstract makePrediction(input: Input, output: RunwayPredictResponse): Promise<Prediction>;
}