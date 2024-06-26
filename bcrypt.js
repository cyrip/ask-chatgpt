import bcrypt from 'bcryptjs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv)).argv;

const userPassword = argv.password;
const saltRounds = 10;

bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
        return;
    }

    bcrypt.hash(userPassword, salt, (err, hash) => {
        if (err) {
            return;
        }
        console.log('Hashed password:', hash);
    });
});
