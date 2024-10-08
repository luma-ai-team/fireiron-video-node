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
exports.AdaptyHook = void 0;
const firestore_adapter_1 = require("../firebase/firestore-adapter");
const Logger = __importStar(require("firebase-functions/logger"));
class AdaptyHook {
    constructor() {
        this.name = "adaptyHook";
        this.firestore = new firestore_adapter_1.FirestoreAdapter();
    }
    async handle(request) {
        Logger.debug(request.body);
        if (request.body.adapty_check != null) {
            return {
                adapty_check_response: request.body.adapty_check
            };
        }
        var userIdentifier = null;
        if (request.body.customer_user_id != null) {
            userIdentifier = request.body.customer_user_id;
        }
        else if (request.body.profile_id != null) {
            const user = await this.firestore.fetchUserWithAdaptyIdentifier(request.body.profile_id);
            userIdentifier = user.identifier;
        }
        if (userIdentifier == null) {
            Logger.warn("No valid user id found");
            return {};
        }
        await this.deposit(userIdentifier, request);
        return {};
    }
    async deposit(userIdentifier, request) {
        const eventType = request.body.event_type;
        const event = request.body.event_properties;
        const product = event.vendor_product_id;
        const targetEventTypes = ["access_level_updated", "non_subscription_purchase"];
        if (targetEventTypes.includes(eventType) == false) {
            return;
        }
        const amount = await this.firestore.fetchRewardAmount(product);
        Logger.log("Depositing " + amount + " for user " + userIdentifier);
        await this.firestore.deposit(userIdentifier, amount, event.purchase_date);
    }
}
exports.AdaptyHook = AdaptyHook;
//# sourceMappingURL=adapty-hook.js.map