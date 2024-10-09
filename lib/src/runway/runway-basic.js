"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicRunwayProvider = void 0;
const runway_provider_1 = require("./runway-provider");
const fireiron_1 = require("fireiron");
const fireiron_2 = require("fireiron");
const fireiron_3 = require("fireiron");
const util_1 = __importDefault(require("util"));
const exec = util_1.default.promisify(require('child_process').exec);
const sharp_1 = __importDefault(require("sharp"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const uuid_1 = require("uuid");
class BasicRunwayProvider extends runway_provider_1.RunwayProvider {
    constructor(key, domain, bucket) {
        super(key, domain);
        this.storage = new fireiron_3.StorageAdapter(bucket);
        this.firestore = new fireiron_2.FirestoreAdapter();
    }
    async makeRunwayOptions(userIdentifier, input) {
        var _a, _b, _c;
        const inputURL = new URL(input.img_prompt);
        const inputFilename = (_a = inputURL.pathname.split('/').pop()) !== null && _a !== void 0 ? _a : "input.jpg";
        const path = await this.storage.downloadTemporaryCopy(inputURL.toString(), inputFilename);
        const outputFilename = inputFilename.split(".").pop() + "-processed.jpg";
        const outputPath = "/tmp/" + outputFilename;
        const image = (0, sharp_1.default)(path);
        const metadata = await image.metadata();
        const imageSize = {
            width: (_b = metadata.width) !== null && _b !== void 0 ? _b : 1280,
            height: (_c = metadata.height) !== null && _c !== void 0 ? _c : 768
        };
        const ratio = Math.min(1280 / imageSize.width, 768 / imageSize.height);
        const cropSize = {
            width: imageSize.width * ratio,
            height: imageSize.height * ratio
        };
        await image.resize(1280, 768, {
            fit: "contain"
        }).toFile(outputPath);
        input.img_prompt = await this.storage.upload(outputPath, `${(0, uuid_1.v4)()}.jpg`);
        this.storage.cleanup();
        var options = {
            path: "/runway/generate/imageDescription",
            cropSize: cropSize,
            body: input
        };
        if (input.text_prompt == null) {
            options.path = "/runway/generate/image";
        }
        return options;
    }
    async makePrediction(input, output) {
        return {
            identifier: output.uuid,
            input: input,
            metadata: {
                cropSize: output.cropSize
            }
        };
    }
    async processHook(query, body) {
        const userIdentifier = query.user;
        const event = await super.processHook(query, body);
        switch (event.state) {
            case fireiron_1.PredictionState.Completed:
                return await this.cropPredictionVideo(event, userIdentifier);
            default:
                break;
        }
        return event;
    }
    async cropPredictionVideo(event, userIdentifier) {
        const prediction = await this.firestore.fetchPrediction(userIdentifier, event.identifier);
        const cropSize = prediction.metadata.cropSize;
        if (cropSize == null) {
            return event;
        }
        const inputFileName = `${event.identifier}.mp4`;
        const outputFileName = `${event.identifier}-crop.mp4`;
        const input = await this.storage.downloadTemporaryCopy(event.output, inputFileName);
        const outputPath = `/tmp/${outputFileName}`;
        await exec(`${ffmpeg_static_1.default} -i ${input} -vf "crop=${cropSize.width}:${cropSize.height}" ${outputPath}`);
        const output = await this.storage.upload(outputPath, userIdentifier + "/" + outputFileName);
        this.storage.cleanup();
        return {
            identifier: event.identifier,
            state: fireiron_1.PredictionState.Completed,
            output: output
        };
    }
}
exports.BasicRunwayProvider = BasicRunwayProvider;
//# sourceMappingURL=runway-basic.js.map