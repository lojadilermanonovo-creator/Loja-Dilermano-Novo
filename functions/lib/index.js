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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.onOrderCreated = exports.stripe_webhook = exports.stripe_checkout = exports.stripe_config = exports.setAdminClaim = exports.exchangeMelhorEnvioCode = exports.calculateShipping = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Export functions from separate files
var calculateShipping_1 = require("./calculateShipping");
Object.defineProperty(exports, "calculateShipping", { enumerable: true, get: function () { return calculateShipping_1.calculateShipping; } });
var exchangeMelhorEnvioCode_1 = require("./exchangeMelhorEnvioCode");
Object.defineProperty(exports, "exchangeMelhorEnvioCode", { enumerable: true, get: function () { return exchangeMelhorEnvioCode_1.exchangeMelhorEnvioCode; } });
var setAdminClaim_1 = require("./setAdminClaim");
Object.defineProperty(exports, "setAdminClaim", { enumerable: true, get: function () { return setAdminClaim_1.setAdminClaim; } });
var stripe_1 = require("./stripe");
Object.defineProperty(exports, "stripe_config", { enumerable: true, get: function () { return stripe_1.stripe_config; } });
Object.defineProperty(exports, "stripe_checkout", { enumerable: true, get: function () { return stripe_1.stripe_checkout; } });
Object.defineProperty(exports, "stripe_webhook", { enumerable: true, get: function () { return stripe_1.stripe_webhook; } });
// Database Triggers
var onOrderCreated_1 = require("./onOrderCreated");
Object.defineProperty(exports, "onOrderCreated", { enumerable: true, get: function () { return onOrderCreated_1.onOrderCreated; } });
var onUserCreated_1 = require("./onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
//# sourceMappingURL=index.js.map