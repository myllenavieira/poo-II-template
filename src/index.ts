import express, { Request, Response } from "express";
import cors from "cors";
import { TAccountDB, TAccountDBPost, TUserDB, TUserDBPost } from "./types";
import { UserDatabase } from "./database/UserDatabase";
import { AccountDataBase } from "./database/AccountDatabase";
import { User } from "./models/User";
import { Account } from "./models/Account";

const app = express();

app.use(cors());
app.use(express.json());

//* INSTACIAR CADA CLASSE REFERENTE A CADA TABELA DO BANCO DE DADOS

//* INSTANCIA DE USERS
const USER_DB = new UserDatabase();

//* INSTANCIA DE ACCOUNTS
const ACCOUNT_DB = new AccountDataBase();

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`);
});

app.get("/ping", async (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Pong!" });
    } catch (error) {
        console.log(error);

        if (req.statusCode === 200) {
            res.status(500);
        }

        if (error instanceof Error) {
            res.send(error.message);
        } else {
            res.send("Erro inesperado");
        }
    }
});

app.get("/users", async (req: Request, res: Response) => {
    try {
        const q = req.query.q;

        if (typeof q !== "string") {
            throw new Error();
        }

        const usersDB = await USER_DB.findUsers(q);

        const users: User[] = usersDB.map(
            (userDB) =>
                new User(
                    userDB.id,
                    userDB.name,
                    userDB.email,
                    userDB.password,
                    userDB.created_at
                )
        );

        res.status(200).send(users);
    } catch (error) {
        console.log(error);

        if (req.statusCode === 200) {
            res.status(500);
        }

        if (error instanceof Error) {
            res.send(error.message);
        } else {
            res.send("Erro inesperado");
        }
    }
});

app.post("/users", async (req: Request, res: Response) => {
    try {
        const { id, name, email, password } = req.body;

        if (typeof id !== "string") {
            res.status(400);
            throw new Error("'id' deve ser string");
        }

        if (typeof name !== "string") {
            res.status(400);
            throw new Error("'name' deve ser string");
        }

        if (typeof email !== "string") {
            res.status(400);
            throw new Error("'email' deve ser string");
        }

        if (typeof password !== "string") {
            res.status(400);
            throw new Error("'password' deve ser string");
        }

        const userDBExists = await USER_DB.findUserById(id);

        if (userDBExists) {
            res.status(400);
            throw new Error("'id' já existe");
        }

        const newUser = new User(
            id,
            name,
            email,
            password,
            new Date().toISOString()
        );

        const newUserDB: TUserDB = {
            id: newUser.getId(),
            name: newUser.getName(),
            email: newUser.getEmail(),
            password: newUser.getPassword(),
            created_at: newUser.getCreatedAt(),
        };

        USER_DB.insertUser(newUserDB);
    } catch (error) {
        console.log(error);

        if (req.statusCode === 200) {
            res.status(500);
        }

        if (error instanceof Error) {
            res.send(error.message);
        } else {
            res.send("Erro inesperado");
        }
    }
});

app.get("/accounts", async (req: Request, res: Response) => {
    try {
        const accountsDB = await ACCOUNT_DB.findAccounts();

        const accounts = accountsDB.map(
            (accountDB) =>
                new Account(
                    accountDB.id,
                    accountDB.balance,
                    accountDB.owner_id,
                    accountDB.created_at
                )
        );

        res.status(200).send(accounts);
    } catch (error) {
        console.log(error);

        if (req.statusCode === 200) {
            res.status(500);
        }

        if (error instanceof Error) {
            res.send(error.message);
        } else {
            res.send("Erro inesperado");
        }
    }
});

app.get("/accounts/:id/balance", async (req: Request, res: Response) => {
    try {
        //* PARAMS SEMPRE RETORNA STRING, ENTÃO NESTE CASO NÃO PRECISA DE VALIDAÇÃO;

        const id = req.params.id;

        const accountDB = await ACCOUNT_DB.findAccountById(id);

        if (!accountDB) {
            res.status(404);
            throw new Error("'id' não encontrado");
        }

        const account = new Account(
            accountDB.id,
            accountDB.balance,
            accountDB.owner_id,
            accountDB.created_at
        );

        const balance = account.getBalance();

        res.status(200).send({ balance });
    } catch (error) {
        console.log(error);

        if (req.statusCode === 200) {
            res.status(500);
        }

        if (error instanceof Error) {
            res.send(error.message);
        } else {
            res.send("Erro inesperado");
        }
    }
});

app.post("/accounts", async (req: Request, res: Response) => {
    try {
        const { id, ownerId } = req.body;

        if (typeof id !== "string") {
            res.status(400);
            throw new Error("'id' deve ser string");
        }

        if (typeof ownerId !== "string") {
            res.status(400);
            throw new Error("'ownerId' deve ser string");
        }

        const accountDBExists = await ACCOUNT_DB.findAccountById(id);

        if (accountDBExists) {
            res.status(400);
            throw new Error("'id' já existe");
        }
        //* FAZER INSTANCIA DE ACCOUNT POIS SUAS INFORMAÇÕES SÃO PRIVATE E EU PRECISO DELAR PARA CRIAR UM NOVO DADO NO DB;
        const newAccount = new Account(id, 0, ownerId, new Date().toISOString());

        const newAccountDB: TAccountDB = {
            id: newAccount.getId(),
            balance: newAccount.getBalance(),
            owner_id: newAccount.getOwnerId(),
            created_at: newAccount.getCreatedAt(),
        };
        await ACCOUNT_DB.insertAccount(newAccountDB);
        res.status(201).send(newAccount);
    } catch (error) {
        console.log(error);

        if (req.statusCode === 200) {
            res.status(500);
        }

        if (error instanceof Error) {
            res.send(error.message);
        } else {
            res.send("Erro inesperado");
        }
    }
});

app.put("/accounts/:id/balance", async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const value = req.body.value;

        if (typeof value !== "number") {
            res.status(400);
            throw new Error("'value' deve ser number");
        }

        const accountDB = await ACCOUNT_DB.findAccountById(id);

        if (!accountDB) {
            res.status(404);
            throw new Error("'id' não encontrado");
        }

        //* INSTANCIAR UM NOVO OBJETO PELA CLASSE ACCOUNT COM AS INFORMAÇÕES PROVENIENTES DE ACCOUNT DB;

        const account = new Account(
            accountDB.id,
            accountDB.balance,
            accountDB.owner_id,
            accountDB.created_at
        );

        const newBalance = account.getBalance() + value;
        account.setBalance(newBalance);

        //* SE ALGUM ERRO ACONTECER AQUI, ELE CAI NO CATCH

        await ACCOUNT_DB.updateAccountBalance(newBalance, id);

        res.status(200).send(account);
    } catch (error) {
        console.log(error);

        if (req.statusCode === 200) {
            res.status(500);
        }

        if (error instanceof Error) {
            res.send(error.message);
        } else {
            res.send("Erro inesperado");
        }
    }
});