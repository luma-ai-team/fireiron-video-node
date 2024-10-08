"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionHook = void 0;
const Logger = __importStar(require("firebase-functions/logger"));
const firestore_adapter_1 = require("../firebase/firestore-adapter");
const provider_1 = require("../providers/provider");
const messaging_adapter_1 = require("../firebase/messaging-adapter");
class PredictionHook {
    constructor(provider) {
        this.name = "predictionHook";
        this.firestore = new firestore_adapter_1.FirestoreAdapter();
        this.messaging = new messaging_adapter_1.MessagingAdapter();
        this.notification = {
            title: "Your prediction is ready!",
            message: "Tap to check it out"
        };
        this.provider = provider;
    }
    async handle(request) {
        Logger.debug(request.query);
        Logger.debug(request.body);
        const userIdentifier = request.query.user;
        if (userIdentifier == null) {
            Logger.error("No user identifier");
            return {};
        }
        const event = await this.provider.processHook(request.query, request.body);
        switch (event.state) {
            case provider_1.PredictionState.Pending:
                await this.handleUpdate(event, userIdentifier);
                break;
            case provider_1.PredictionState.Completed:
                await this.handleCompletion(event, userIdentifier);
                break;
            case provider_1.PredictionState.Failed:
                await this.handleFailure(event, userIdentifier);
                break;
        }
        return {};
    }
    async handleUpdate(event, userIdentifier) {
        //
    }
    async handleCompletion(event, userIdentifier) {
        const predictionReference = this.firestore.makePredictionReference(userIdentifier, event.identifier);
        await predictionReference.update({
            output: event.output
        });
        const userReference = await this.firestore.prepareUserReference(userIdentifier);
        const user = (await userReference.get()).data();
        await this.messaging.sendCompletionNotification(user, event.identifier, this.notification.title, this.notification.message);
    }
    async handleFailure(event, userIdentifier) {
        const reference = this.firestore.makePredictionReference(userIdentifier, event.identifier);
        await reference.update({
            error: event.error
        });
        await this.firestore.deposit(userIdentifier, 1);
    }
}
exports.PredictionHook = PredictionHook;
//# sourceMappingURL=prediction-hook.js.map