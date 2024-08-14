import connection from "../config/connectDB";
const crypto = require('crypto');
import jwt from 'jsonwebtoken'
import md5 from "md5";
import request from 'request';
const axios = require('axios');
import e from "express";
require('dotenv').config();

let timeNow = Date.now();

const randomString = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}


const randomNumber = (min, max) => {
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

const isNumber = (params) => {
    let pattern = /^[0-9]*\d$/;
    return pattern.test(params);
}

const ipAddress = (req) => {
    let ip = '';
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    return ip;
}

const timeCreate = () => {
    const d = new Date();
    const time = d.getTime();
    return time;
}

const loginPage = async(req, res) => {
    return res.render("account/login.ejs");
}

const registerPage = async(req, res) => {
    return res.render("account/register.ejs");
}

const forgotPage = async(req, res) => {
    return res.render("account/forgot.ejs"); 
}

const login = async(req, res) => {
    let { username, pwd } = req.body;

    if (!username || !pwd || !username) {//!isNumber(username)
        return res.status(200).json({
            message: 'ERROR!!!'
        });
    }

    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE phone = ? AND password = ? ', [username, md5(pwd)]);
        if (rows.length == 1) {
            if (rows[0].status == 1) {
                const { password, money, ip, veri, ip_address, status, time, ...others } = rows[0];
                const accessToken = jwt.sign({
                    user: {...others },
                    timeNow: timeNow
                }, process.env.JWT_ACCESS_TOKEN, { expiresIn: "1d" });
                await connection.execute('UPDATE `users` SET `token` = ? ,`last_login` = ?  WHERE `phone` = ? ', [md5(accessToken), new Date() , username]);
                return res.status(200).json({
                    message: 'Login Sucess',
                    status: true,
                    token: accessToken,
                    value: md5(accessToken)
                }); 
            } else {
                return res.status(200).json({
                    message: 'Account has been locked',
                    status: false
                });
            }
        } else {
            return res.status(200).json({
                message: 'Account or Password is incorrect',
                status: false
            });
        }
    } catch (error) {
        if (error) console.log(error);
    }

}

function generateKeyG() {
    const agentKey = '4ee779f236861f4bec5506a8c8a022e3a3f63528';
    const agentId = 'John_Le_BDGPRO_INR';

    // Get the current date in UTC-4
    const currentDate = new Date();
    currentDate.setUTCHours(currentDate.getUTCHours() - 4);

    // Format the date string as yymmdd
    const year = currentDate.getUTCFullYear().toString().slice(-2); // Last two digits of the year
    const month = (currentDate.getUTCMonth() + 1).toString().padStart(2, '0'); // Month as a string with leading zero
    const day = currentDate.getUTCDate().toString(); // Day as a string without leading zero

    const dateStr = `${year}${month}${day}`;

    // Concatenate date, agentId, and agentKey to form the string to hash
    const stringToHash = `${dateStr}${agentId}${agentKey}`;

    // Generate the MD5 hash
    const keyG = crypto.createHash('md5').update(stringToHash).digest('hex');

    return keyG;
}

// Function to generate the final URL with the account parameter and call the API
async function generateMember(account) {
    const agentId = 'John_Le_BDGPRO_INR';
    
    // Step 1: Generate KeyG
    const keyG = generateKeyG();

    // Step 2: Create the params string
    const params = `Account=${account}&AgentId=${agentId}`;

    // Step 3: Generate the key
    const key = `000000${crypto.createHash('md5').update(params + keyG).digest('hex')}000000`;

    // Step 4: Generate the final URL
    const finalUrl = `https://wb-api.jlfafafa2.com/api1/CreateMember?${params}&Key=${key}`;

    try {
        // Step 5: Call the API
        const response = await axios.get(finalUrl);

        console.log(response.data);
        // Return the response from the API call
        return response.data;
    } catch (error) {
        // Handle errors (e.g., network issues, API errors)
        console.error('Error calling API:', error.message);
        throw error;
    }
}

// Your existing register function
const register = async (req, res) => {
    let now = new Date().getTime();
    let { username, pwd, invitecode } = req.body;
    let id_user = randomNumber(10000, 99999);
    let otp2 = randomNumber(100000, 999999);
    let name_user = "Member" + randomNumber(10000, 99999);
    let code = randomString(5) + randomNumber(10000, 99999);
    let ip = ipAddress(req);
    let time = timeCreate();

    if (!username || !pwd || !invitecode) {
        return res.status(200).json({
            message: 'ERROR!!!',
            status: false
        });
    }

    if (username.length < 9 || username.length > 10 || !isNumber(username)) {
        return res.status(200).json({
            message: 'phone error',
            status: false
        });
    }

    try {
        const [check_u] = await connection.query('SELECT * FROM users WHERE phone = ?', [username]);
        const [check_i] = await connection.query('SELECT * FROM users WHERE code = ?', [invitecode]);
        const [check_ip] = await connection.query('SELECT * FROM users WHERE ip_address = ?', [ip]);

        if (check_u.length == 1 && check_u[0].veri == 1) {
            return res.status(200).json({
                message: 'Phone number has been registered',
                status: false
            });
        } else {
            if (check_i.length == 1) {
                if (check_ip.length <= 3) {
                    let ctv = '';
                    if (check_i[0].level == 2) {
                        ctv = check_i[0].phone;
                    } else {
                        ctv = check_i[0].ctv;
                    }

                    let uniqueIdGenerated = false;
                    while (!uniqueIdGenerated) {
                        const [check_id] = await connection.query('SELECT * FROM users WHERE id_user = ?', [id_user]);
                        if (check_id.length === 0) {
                            uniqueIdGenerated = true;
                        } else {
                            id_user = randomNumber(10000, 99999);
                        }
                    }

                    const sql = "INSERT INTO users SET id_user = ?,phone = ?,name_user = ?,password = ?,money = ?,code = ?,invite = ?,ctv = ?,veri = ?,otp = ?,ip_address = ?,status = ?,time = ?,ps = ?,vip_level = ?,experience =? , attendance = ?";
                    await connection.execute(sql, [id_user, username, name_user, md5(pwd), 0, code, invitecode, ctv, 1, otp2, ip, 1, time, pwd, 0, 0, 0]);
                    await connection.execute('INSERT INTO point_list SET phone = ?', [username]);
                    await connection.execute('INSERT INTO team_income SET phone = ?, code = ?, invite = ?, f1 = ?, f2 = ?, f3 = ?, f4 = ?, f5 = ?, f6 = ?, time = ?', [username, code, invitecode, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', time]);

                    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `attendance` FROM users WHERE `id_user` = ?', [id_user]);
                    let userInfo = user[0];

                    // Step 6: Call generateMember with the account parameter as "bdgpro" + id_user
                    const account = `bdgpro${id_user}`;
                    console.log(account);
                    const memberCreationResponse = await generateMember(account);

                    // Handle the response from the API call to generateMember
                    if (memberCreationResponse.ErrorCode === 0) {
                        const registrationBonus = 30; // Set your bonus amount here
                        const incomeSql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES (?, ?, ?, ?, ?)`;
                        await connection.execute(incomeSql, [userInfo.id, registrationBonus, registrationBonus, 'Registration Bonus', username]);

                        const updateUserMoneySql = 'UPDATE users SET money = money + ?, able_to_bet = able_to_bet + ? WHERE id = ?';
                         await connection.execute(updateUserMoneySql, [registrationBonus, registrationBonus, userInfo.id]);

                        return res.status(200).json({
                            message: 'Register Success',
                            status: true
                        });
                    } else {
                        return res.status(500).json({
                            message: 'Member creation failed',
                            status: false,
                            error: memberCreationResponse.message
                        });
                    }
                } else {
                    return res.status(200).json({
                        message: 'IP address has been registered',
                        status: false
                    });
                }
            } else {
                return res.status(200).json({
                    message: 'Referrer code does not exist',
                    status: false
                });
            }
        }
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false
        });
    }
}


const verifyCode = async(req, res) => {
    let phone = req.body.phone;
    let now = new Date().getTime();
    let timeEnd = (+new Date) + 1000 * (60 * 2 + 0) + 500;
    let otp = randomNumber(100000, 999999);

    if (phone.length < 9 || phone.length > 10 || !isNumber(phone)) {
        return res.status(200).json({
            message: 'phone error',
            status: false
        });
    }

    const [rows] = await connection.query('SELECT * FROM users WHERE `phone` = ?', [phone]);
    if (rows.length == 0) {
        await request(`http://47.243.168.18:9090/sms/batch/v2?appkey=NFJKdK&appsecret=brwkTw&phone=84${phone}&msg=Your verification code is ${otp}&extend=${now}`,  async(error, response, body) => {
            let data = JSON.parse(body);
            if (data.code == '00000') {
                await connection.execute("INSERT INTO users SET phone = ?, otp = ?, veri = 0, time_otp = ? ", [phone, otp, timeEnd]);
                return res.status(200).json({
                    message: 'Submitted successfully',
                    status: true,
                    timeStamp: timeNow,
                    timeEnd: timeEnd,
                });
            }
        });
    } else {
        let user = rows[0];
        if (user.time_otp - now <= 0) {
            request(`http://47.243.168.18:9090/sms/batch/v2?appkey=NFJKdK&appsecret=brwkTw&phone=84${phone}&msg=Your verification code is ${otp}&extend=${now}`,  async(error, response, body) => {
                let data = JSON.parse(body);
                if (data.code == '00000') {
                    await connection.execute("UPDATE users SET otp = ?, time_otp = ? WHERE phone = ? ", [otp, timeEnd, phone]);
                    return res.status(200).json({
                        message: 'Submitted successfully',
                        status: true,
                        timeStamp: timeNow,
                        timeEnd: timeEnd,
                    });
                }
            });
        } else {
            return res.status(200).json({
                message: 'Send SMS regularly',
                status: false,
                timeStamp: timeNow,
            });
        }
    }
    
} 

const verifyCodePass = async(req, res) => {
    let phone = req.body.phone;
    let now = new Date().getTime();
    let timeEnd = (+new Date) + 1000 * (60 * 2 + 0) + 500;
    let otp = randomNumber(100000, 999999);

    if (phone.length < 9 || phone.length > 10 || !isNumber(phone)) {
        return res.status(200).json({
            message: 'phone error',
            status: false
        });
    }

    const [rows] = await connection.query('SELECT * FROM users WHERE `phone` = ? AND veri = 1', [phone]);
    if (rows.length == 0) {
        return res.status(200).json({
            message: 'Account does not exist',
            status: false,
            timeStamp: timeNow,
        });
    } else {
        let user = rows[0];
        if (user.time_otp - now <= 0) {
            request(`http://47.243.168.18:9090/sms/batch/v2?appkey=NFJKdK&appsecret=brwkTw&phone=84${phone}&msg=Your verification code is ${otp}&extend=${now}`,  async(error, response, body) => {
                let data = JSON.parse(body);
                if (data.code == '00000') {
                    await connection.execute("UPDATE users SET otp = ?, time_otp = ? WHERE phone = ? ", [otp, timeEnd, phone]);
                    return res.status(200).json({
                        message: 'Submitted successfully',
                        status: true,
                        timeStamp: timeNow,
                        timeEnd: timeEnd,
                    });
                }
            });
        } else {
            return res.status(200).json({
                message: 'Send SMS regularly',
                status: false,
                timeStamp: timeNow,
            });
        }
    }
    
}

const forGotPassword = async(req, res) => {
    let username = req.body.username;
    let otp = req.body.otp;
    let pwd = req.body.pwd;
    let now = new Date().getTime();
    let timeEnd = (+new Date) + 1000 * (60 * 2 + 0) + 500; 
    let otp2 = randomNumber(100000, 999999);

    if (username.length < 9 || username.length > 10 || !isNumber(username)) {
        return res.status(200).json({
            message: 'phone error',
            status: false
        });
    }

    const [rows] = await connection.query('SELECT * FROM users WHERE `phone` = ? AND veri = 1', [username]);
    if (rows.length == 0) {
        return res.status(200).json({
            message: 'Account does not exist',
            status: false,
            timeStamp: timeNow,
        });
    } else {
        let user = rows[0];
        if (user.time_otp - now > 0) {
            if (user.otp == otp) {
                await connection.execute("UPDATE users SET password = ?, otp = ?, time_otp = ? WHERE phone = ? ", [md5(pwd), otp2, timeEnd, username]);
                return res.status(200).json({
                    message: 'Password changed successfully',
                    status: true,
                    timeStamp: timeNow,
                    timeEnd: timeEnd,
                });
            } else {
                return res.status(200).json({
                    message: 'OTP code is incorrect',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        } else {
            return res.status(200).json({
                message: 'OTP code has expired',
                status: false,
                timeStamp: timeNow,
            });
        }
    }
    
}




module.exports = {
    login,
    register,
    loginPage,
    registerPage,
    forgotPage,
    verifyCode,
    verifyCodePass,
    forGotPassword
}