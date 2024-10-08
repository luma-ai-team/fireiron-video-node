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
exports.FirestoreAdapter = void 0;
const Firestore = __importStar(require("firebase-admin/firestore"));
class FirestoreAdapter {
    constructor() {
        this.db = Firestore.getFirestore();
    }
    makePendingPredictionsReference() {
        return this.db.collection("pending");
    }
    makeUsersReference() {
        return this.db.collection("users");
    }
    makeUserReference(identifier) {
        return this.makeUsersReference().doc(identifier);
    }
    makePredicionsReference(userIdentifier) {
        return this.makeUserReference(userIdentifier).collection("predictions");
    }
    makePredictionReference(userIdentifier, predictionIdentifier) {
        return this.makePredicionsReference(userIdentifier).doc(predictionIdentifier);
    }
    makeProductsReference() {
        return this.db.collection("config").doc("products");
    }
    makeDefaultsReference() {
        return this.db.collection("config").doc("defaults");
    }
    async makeUserData(identifier) {
        var _a, _b;
        const defaults = await this.makeDefaultsReference().get();
        const balance = (_b = await ((_a = defaults.data()) === null || _a === void 0 ? void 0 : _a.balance)) !== null && _b !== void 0 ? _b : 0;
        return {
            identifier: identifier,
            balance: balance,
            pushToken: undefined
        };
    }
    async prepareUserReference(identifier) {
        const reference = this.makeUserReference(identifier);
        const document = await reference.get();
        if (!document.exists) {
            const user = await this.makeUserData(identifier);
            await reference.set(user);
        }
        return reference;
    }
    async fetchRewardAmount(identifier) {
        var _a, _b;
        const products = await this.makeProductsReference().get();
        const data = (_a = products.data()) !== null && _a !== void 0 ? _a : {};
        return (_b = data[identifier]) !== null && _b !== void 0 ? _b : 0;
    }
    async fetchUserWithAdaptyIdentifier(identifier) {
        var _a;
        const snapshot = await this.makeUsersReference().where("adaptyProfile", "==", identifier).get();
        const user = (_a = snapshot.docs[0]) === null || _a === void 0 ? void 0 : _a.data();
        return user;
    }
    async deposit(userIdentifier, amount, date) {
        const reference = await this.prepareUserReference(userIdentifier);
        const document = await reference.get();
        const user = document.data();
        if ((user.purchaseDate != null) && (date != null)) {
            const previousPurchaseDate = Date.parse(user.purchaseDate);
            const eventPurchaseDate = Date.parse(date);
            if (previousPurchaseDate >= eventPurchaseDate) {
                return;
            }
        }
        await reference.update({
            balance: Firestore.FieldValue.increment(amount),
            purchaseDate: date
        });
    }
    async withdraw(userIdentifier, amount) {
        const reference = await this.prepareUserReference(userIdentifier);
        const user = (await reference.get()).data();
        if (user.balance < amount) {
            throw new Error("Insufficient balance");
        }
        await reference.update({
            balance: Firestore.FieldValue.increment(-amount)
        });
    }
    async storePrediction(userIdentifier, prediction) {
        const reference = this.makePredictionReference(userIdentifier, prediction.identifier);
        await reference.update(prediction);
    }
}
exports.FirestoreAdapter = FirestoreAdapter;
// const firestore = getFirestore();
// firestore.settings({
//     ignoreUndefinedProperties: true
// });
// function db() {
//     return firestore;
// }
// function makePendingPredictionsCollection() {
//     return firestore.collection("pending");
// }
// function makeUsersCollection() {
//     return firestore.collection("users");
// }
// function makePredictionsCollection(identifier) {
//     return makeUsersCollection().doc(identifier).collection("predictions");
// }
// function makeUserDocument(identifier) {
//     return makeUsersCollection().doc(identifier);
// }
// function makePredictionDocument(user, prediction) {
//     return makePredictionsCollection(user).doc(prediction);
// }
// async function makeUserData(identifier, pushToken) {
//     const defaults = await makeDefaultsDocument().get();
//     const balance = await defaults.data().balance ?? 0;
//     return {
//         identifier: identifier,
//         pushToken: pushToken,
//         balance: balance
//     };
// }
// function makeProductsDocument() {
//     return firestore.collection("config").doc("products");
// }
// function makeDefaultsDocument() {
//     return firestore.collection("config").doc("defaults");
// }
// async function prepareUser(identifier) {
//     const reference = makeUserDocument(identifier);
//     const document = await reference.get();
//     if (!document.exists) {
//         const data = await makeUserData(identifier, null);
//         await reference.set(data);
//     }
//     return reference
// }
// async function preparePrediction(user, prediction) {
//     const reference = makePredictionDocument(user, prediction);
//     const document = await reference.get()
//     if (!document.exists) {
//         const data = {
//             prediction: prediction
//         };
//         await reference.set(data);
//     }
//     return reference
// }
// async function preparePredictionInput(user, prediction, input) {
//     const reference = makePredictionDocument(user, prediction);
//     const document = await reference.get()
//     if (!document.exists) {
//         const data = {
//             prediction: prediction,
//             input: input,
//             createdAt: new Date().toISOString()
//         };
//         await reference.set(data);
//     }
//     return reference
// }
// module.exports = {
//     makePendingPredictionsCollection,
//     makeUsersCollection,
//     makePredictionsCollection,
//     makeUserDocument,
//     makePredictionDocument,
//     makeProductsDocument,
//     makeDefaultsDocument,
//     makeUserData,
//     prepareUser,
//     preparePrediction,
//     preparePredictionInput
// }
//# sourceMappingURL=firestore-adapter.js.map