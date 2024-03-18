"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = require("bcrypt");
const stream_chat_1 = require("stream-chat");
const prismaConfig_1 = __importDefault(require("./lib/prismaConfig"));
dotenv_1.default.config();
try {
    const { PORT, STREAM_API_KEY, STREAM_API_SECRET } = process.env;
    const client = stream_chat_1.StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const salt = (0, bcrypt_1.genSaltSync)(10);
    const USERS = [];
    app.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                message: 'password must be at least 6 charachters!!.'
            });
        }
        const existingUser = yield prismaConfig_1.default.user.findUnique({
            where: {
                email: email
            },
            select: {
                id: true,
                email: true,
                hashed_password: true
            }
        });
        if (existingUser) {
            return res.status(400).json({
                message: 'USer already exists.',
            });
        }
        try {
            const hashed_password = (0, bcrypt_1.hashSync)(password, salt);
            // const id =Math.random().toString(36).slice(2);
            const user = yield prismaConfig_1.default.user.create({
                data: {
                    email: email,
                    hashed_password: hashed_password
                }
            });
            console.log(user);
            yield client.upsertUser({
                id: user.id,
                email: email,
                name: email,
            });
            const token = client.createToken(user.id);
            return res.status(200).json({
                token,
                user: {
                    id: user.id,
                    email: user.email
                },
            });
        }
        catch (err) {
            res.status(500).json({ error: "error user " });
        }
    }));
    app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { email, password } = req.body;
        // const user=USERS.find((user)=>user.email==email);
        const user = yield prismaConfig_1.default.user.findUnique({
            where: {
                email: email,
            }
        });
        if (!user || !(0, bcrypt_1.compareSync)(password, user === null || user === void 0 ? void 0 : user.hashed_password)) {
            return res.status(400).json({
                message: "invalid credentials",
            });
        }
        const token = client.createToken(user.id);
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
            }
        });
    }));
    app.listen(PORT, () => {
        console.log(`server us listening on port ${PORT}`);
    });
}
catch (error) {
    console.log(error);
}
//# sourceMappingURL=index.js.map