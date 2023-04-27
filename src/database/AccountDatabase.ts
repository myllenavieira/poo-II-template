import { TAccountDB } from "../types";
import { UserDatabase } from "./UserDatabase";

export class AccountDatabase extends UserDatabase{

    public static TABLE_ACCOUNTS = "accounts";

    public async getAccount(){
        const accountDb = await AccountDatabase.connection(AccountDatabase.TABLE_ACCOUNTS)
        return accountDb
    }
}