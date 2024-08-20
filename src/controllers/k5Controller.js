import e from "express";
import connection from "../config/connectDB";
require('dotenv').config();


const K5DPage = async (req, res) => {
    return res.render("bet/5d/5d.ejs"); 
}

const K5DPage3 = async (req, res) => {
    return res.render("bet/wingo/win3.ejs");
}

const K5DPage5 = async (req, res) => {
    return res.render("bet/wingo/win5.ejs");
}

const K5DPage10 = async (req, res) => {
    return res.render("bet/wingo/win10.ejs");
}


const isNumber = (params) => {
    let pattern = /^[0-9]*\d$/;
    return pattern.test(params);
}

function formateT(params) {
    let result = (params < 10) ? "0" + params : params;
    return result;
}

function timerJoin(params = '') {
    let date = '';
    if (params) {
        date = new Date(Number(params));
    } else {
        date = new Date();
    }
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());

    let hours = formateT(date.getHours());
    let minutes = formateT(date.getMinutes());
    let seconds = formateT(date.getSeconds());
    return years + '-' + months + '-' + days + ' ' + hours + ':' + minutes + ':' + seconds;
}

const rosesPlus = async (auth, money) => {
    try {
        console.log('Starting rosesPlus function');
        
        // Fetch the user information based on the provided auth token
        const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `vip_level` FROM users WHERE token = ? AND veri = 1 LIMIT 1', [auth]);
        if (user.length === 0) {
            console.error('User not found or not verified');
            return;
        }
        let userInfo = user[0];
        console.log('User info fetched:', userInfo);

        // Fetch the level information based on the user's vip_level
        const [level] = await connection.query('SELECT * FROM level WHERE level = ?', [userInfo.vip_level]);
        if (level.length === 0) {
            console.error('Level not found');
            return;
        }
        let level0 = level[0];
        console.log('Level info fetched:', level0);

        // Fetch the user's inviter information
        const [f1] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1 LIMIT 1', [userInfo.invite]);
        console.log('F1 inviter info fetched:', f1);

        if (money >= 10) {
            if (f1.length > 0) {
                let infoF1 = f1[0];
                let rosesF1 = (money / 100) * level0.f1;
                let currentTime = Date.now(); // Current timestamp in milliseconds

                // Update the inviter's money and roses information
                await connection.query('UPDATE users SET money = money + ?, roses_f1 = roses_f1 + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ?', 
                                       [rosesF1, rosesF1, rosesF1, rosesF1, infoF1.phone]);
                console.log('F1 inviter money and roses updated:', infoF1.phone, rosesF1);

                // Update the team_income table for the userInfo.phone
                await connection.query('UPDATE team_income SET f1 = f1 + ?, `time` = ?, updated_at = NOW() WHERE phone = ?', 
                                       [rosesF1, currentTime, userInfo.phone]);
                console.log('Team income updated for user:', userInfo.phone, 'with F1:', rosesF1);

                // Insert or update the bonus details in the y_incomes table
                await upsertIncome(infoF1.phone, rosesF1);

                // Fetch the inviter's inviter information (level 2)
                const [f2] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1 LIMIT 1', [infoF1.invite]);
                console.log('F2 inviter info fetched:', f2);
                
                if (f2.length > 0) {
                    let infoF2 = f2[0];
                    let rosesF2 = (money / 100) * level0.f2;

                    // Update the level 2 inviter's money and roses information
                    await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ?', 
                                           [rosesF2, rosesF2, rosesF2, infoF2.phone]);
                    console.log('F2 inviter money and roses updated:', infoF2.phone, rosesF2);

                    // Update the team_income table for the userInfo.phone
                    await connection.query('UPDATE team_income SET f2 = f2 + ?, `time` = ?, updated_at = NOW() WHERE phone = ?', 
                                           [rosesF2, currentTime, userInfo.phone]);
                    console.log('Team income updated for user:', userInfo.phone, 'with F2:', rosesF2);

                    // Insert or update the bonus details in the y_incomes table
                    await upsertIncome(infoF2.phone, rosesF2);

                    // Fetch the level 2 inviter's inviter information (level 3)
                    const [f3] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1 LIMIT 1', [infoF2.invite]);
                    console.log('F3 inviter info fetched:', f3);

                    if (f3.length > 0) {
                        let infoF3 = f3[0];
                        let rosesF3 = (money / 100) * level0.f3;

                        // Update the level 3 inviter's money and roses information
                        await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ?', 
                                               [rosesF3, rosesF3, rosesF3, infoF3.phone]);
                        console.log('F3 inviter money and roses updated:', infoF3.phone, rosesF3);

                        // Update the team_income table for the userInfo.phone
                        await connection.query('UPDATE team_income SET f3 = f3 + ?, `time` = ?, updated_at = NOW() WHERE phone = ?', 
                                               [rosesF3, currentTime, userInfo.phone]);
                        console.log('Team income updated for user:', userInfo.phone, 'with F3:', rosesF3);

                        // Insert or update the bonus details in the y_incomes table
                        await upsertIncome(infoF3.phone, rosesF3);

                        // Fetch the level 3 inviter's inviter information (level 4)
                        const [f4] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1 LIMIT 1', [infoF3.invite]);
                        console.log('F4 inviter info fetched:', f4);

                        if (f4.length > 0) {
                            let infoF4 = f4[0];
                            let rosesF4 = (money / 100) * level0.f4;

                            // Update the level 4 inviter's money and roses information
                            await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ?', 
                                                   [rosesF4, rosesF4, rosesF4, infoF4.phone]);
                            console.log('F4 inviter money and roses updated:', infoF4.phone, rosesF4);

                            // Update the team_income table for the userInfo.phone
                            await connection.query('UPDATE team_income SET f4 = f4 + ?, `time` = ?, updated_at = NOW() WHERE phone = ?', 
                                                   [rosesF4, currentTime, userInfo.phone]);
                            console.log('Team income updated for user:', userInfo.phone, 'with F4:', rosesF4);

                            // Insert or update the bonus details in the y_incomes table
                            await upsertIncome(infoF4.phone, rosesF4);

                            // Fetch the level 4 inviter's inviter information (level 5)
                            const [f5] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1 LIMIT 1', [infoF4.invite]);
                            console.log('F5 inviter info fetched:', f5);

                            if (f5.length > 0) {
                                let infoF5 = f5[0];
                                let rosesF5 = (money / 100) * level0.f5;

                                // Update the level 5 inviter's money and roses information
                                await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ?', 
                                                       [rosesF5, rosesF5, rosesF5, infoF5.phone]);
                                console.log('F5 inviter money and roses updated:', infoF5.phone, rosesF5);

                                // Update the team_income table for the userInfo.phone
                                await connection.query('UPDATE team_income SET f5 = f5 + ?, `time` = ?, updated_at = NOW() WHERE phone = ?', 
                                                       [rosesF5, currentTime, userInfo.phone]);
                                console.log('Team income updated for user:', userInfo.phone, 'with F5:', rosesF5);

                                // Insert or update the bonus details in the y_incomes table
                                await upsertIncome(infoF5.phone, rosesF5);

                                // Fetch the level 5 inviter's inviter information (level 6)
                                const [f6] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1 LIMIT 1', [infoF5.invite]);
                                console.log('F6 inviter info fetched:', f6);

                                if (f6.length > 0) {
                                    let infoF6 = f6[0];
                                    let rosesF6 = (money / 100) * level0.f6;

                                    // Update the level 6 inviter's money and roses information
                                    await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ?', 
                                                           [rosesF6, rosesF6, rosesF6, infoF6.phone]);
                                    console.log('F6 inviter money and roses updated:', infoF6.phone, rosesF6);

                                    // Update the team_income table for the userInfo.phone
                                    await connection.query('UPDATE team_income SET f6 = f6 + ?, `time` = ?, updated_at = NOW() WHERE phone = ?', 
                                                           [rosesF6, currentTime, userInfo.phone]);
                                    console.log('Team income updated for user:', userInfo.phone, 'with F6:', rosesF6);

                                    // Insert or update the bonus details in the y_incomes table
                                    await upsertIncome(infoF6.phone, rosesF6);
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in rosesPlus function:', error);
    }
}

// Helper function to insert or update records in the y_incomes table
const upsertIncome = async (phone, amount) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const [income] = await connection.query('SELECT * FROM y_incomes WHERE phone = ? AND DATE(created_at) = ?', [phone, today]);

    if (income.length === 0) {
        // Insert a new record if none exists for today
        await connection.query('INSERT INTO y_incomes (phone, money) VALUES (?, ?)', [phone, amount]);
        console.log('Inserted new record into y_incomes:', phone, amount);
    } else {
        // Update the existing record for today
        await connection.query('UPDATE y_incomes SET money = money + ? WHERE phone = ? AND DATE(created_at) = ?', [amount, phone, today]);
        console.log('Updated existing record in y_incomes:', phone, amount);
    }
};




const validateBet = async (join, list_join, x, money, game) => {
    let checkJoin = isNumber(list_join);
    let checkX = isNumber(x);
    const checks = ['a', 'b', 'c', 'd', 'e', 'total'].includes(join);
    const checkGame = ['1', '3', '5', '10'].includes(String(game));
    const checkMoney = ['1000', '10000', '100000', '1000000'].includes(money);

    if (!checks || list_join.length > 10 || !checkX || !checkMoney || !checkGame) {
        return false;
    }

    if (checkJoin) {
        let arr = list_join.split('');
        let length = arr.length;
        for (let i = 0; i < length; i++) {
            const joinNum = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(arr[i]);
            if (!joinNum) {
                return false;
            }
        }
    } else {
        let arr = list_join.split('');
        let length = arr.length;
        for (let i = 0; i < length; i++) {
            const joinStr = ["c", "l", "b", "s"].includes(arr[i]);
            if (!joinStr) {
                return false;
            }
        }

    }

    return true;
}

const betK5D = async (req, res) => {
    try {
        let { join, list_join, x, money, game } = req.body;
        let auth = req.cookies.auth;

        let validate = await validateBet(join, list_join, x, money, game);

        if (!validate) {
            return res.status(200).json({
                message: 'Invalid bet',
                status: false
            });
        }

        const [k5DNow] = await connection.query(`SELECT period FROM 5d WHERE status = 0 AND game = ${game} ORDER BY id DESC LIMIT 1 `);
        const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);
        if (k5DNow.length < 1 || user.length < 1) {
            return res.status(200).json({
                message: 'Error!',
                status: false
            });
        }
        let userInfo = user[0];
        let period = k5DNow[0];

        let date = new Date();
        let years = formateT(date.getFullYear());
        let months = formateT(date.getMonth() + 1);
        let days = formateT(date.getDate());
        let id_product = years + months + days + Math.floor(Math.random() * 1000000000000000);

        let total = money * x * (String(list_join).split('').length);
        let fee = total * 0.02;
        let price = total - fee;

        let check = userInfo.money - total;
        if (check >= 0) {
            let timeNow = Date.now();
            const sql = `INSERT INTO result_5d SET id_product = ?,phone = ?,code = ?,invite = ?,stage = ?,level = ?,money = ?,price = ?,amount = ?,fee = ?,game = ?,join_bet = ?,bet = ?,status = ?,time = ?`;
            await connection.execute(sql, [id_product, userInfo.phone, userInfo.code, userInfo.invite, period.period, userInfo.level, total, price, x, fee, game, join, list_join, 0, timeNow]);
            checkVipBonus(userInfo.phone,total/10);
            await connection.execute('UPDATE `users` SET `money` = `money` - ?, `total_bet` = `total_bet` + ? WHERE `token` = ?', [total, total, auth]);

            const [users] = await connection.query('SELECT `money`, `level` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);
            await rosesPlus(auth, money * x);
            const [level] = await connection.query('SELECT * FROM level ');
            let level0 = level[0];
            const sql2 = `INSERT INTO roses SET phone = ?,code = ?,invite = ?,f1 = ?,f2 = ?,f3 = ?,f4 = ?,time = ?`;
            let total_m = total;
            let f1 = (total_m / 100) * level0.f1;
            let f2 = (total_m / 100) * level0.f2;
            let f3 = (total_m / 100) * level0.f3;
            let f4 = (total_m / 100) * level0.f4;
            await connection.execute(sql2, [userInfo.phone, userInfo.code, userInfo.invite, f1, f2, f3, f4, timeNow]);
            return res.status(200).json({
                message: 'Bet successfully',
                status: true,
                // data: result,
                change: users[0].level,
                money: users[0].money,
            });
        } else {
            return res.status(200).json({
                message: 'The amount is not enough',
                status: false
            });
        }
    } catch (error) {
        if (error) console.log(error);
    }
}

const checkVipBonus = async (phone, exp) => {
    try {
        // Retrieve user details
        const [user] = await connection.query('SELECT id, experience, vip_level FROM users WHERE phone = ?', [phone]);
        if (!user.length) {
            console.log('User not found');
            return;
        }

        // Destructure the user details
        let { id: userId, experience, vip_level } = user[0];
        experience = parseFloat(experience); // Ensure experience is a float
        exp = parseFloat(exp); // Ensure exp is a float
        let newExp = experience + exp;
        let newVipLevel = 0;

        // Determine the new VIP level based on experience
        if (newExp > 3000 && newExp < 30000) newVipLevel = 1;
        else if (newExp >= 30000 && newExp < 400000) newVipLevel = 2;
        else if (newExp >= 400000 && newExp < 2000000) newVipLevel = 3;
        else if (newExp >= 2000000 && newExp < 8000000) newVipLevel = 4;
        else if (newExp >= 8000000 && newExp < 30000000) newVipLevel = 5;
        else if (newExp >= 30000000 && newExp < 100000000) newVipLevel = 6;
        else if (newExp >= 100000000 && newExp < 400000000) newVipLevel = 7;
        else if (newExp >= 400000000 && newExp < 1000000000) newVipLevel = 8;
        else if (newExp >= 1000000000 && newExp < 5000000000) newVipLevel = 9;
        else if (newExp >= 5000000000) newVipLevel = 10;

        // Update user's VIP level and experience if VIP level has changed
        if (newVipLevel !== vip_level) {
            await connection.query('UPDATE users SET vip_level = ?, experience = ? WHERE phone = ?', [newVipLevel, newExp, phone]);

            // Retrieve the level-up reward for the new VIP level
            const [vipRule] = await connection.query('SELECT level_up_reward FROM vip_rules WHERE vip_level = ?', [newVipLevel]);
            if (vipRule.length) {
                const { level_up_reward } = vipRule[0];
                const rewardAmount = parseFloat(level_up_reward); // Ensure reward amount is a float

                // Insert the level-up reward into the incomes table
                const sql = `INSERT INTO incomes SET 
                    user_id = ?, 
                    amount = ?, 
                    comm = ?, 
                    remarks = ?, 
                    rname = ?, 
                    created_at = ?, 
                    updated_at = ?`;
                const timeNow = new Date().toISOString();
                await connection.execute(sql, [userId, rewardAmount, rewardAmount, 'Level Up Bonus', 0, timeNow, timeNow]);

                console.log(`VIP level updated to ${newVipLevel} and money rewarded: ${rewardAmount}`);
            }
        } else {
            // Update the user's experience if VIP level has not changed
            await connection.query('UPDATE users SET experience = ? WHERE phone = ?', [newExp, phone]);
            console.log('Experience updated without VIP level change');
        }
    } catch (error) {
        console.error('Error in checkVipBonus:', error);
    }
};


const listOrderOld = async (req, res) => {
    let { gameJoin, pageno, pageto } = req.body;
    let auth = req.cookies.auth;

    let checkGame = ['1', '3', '5', '10'].includes(String(gameJoin));
    if (!checkGame || pageno < 0 || pageto < 0) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);

    let game = Number(gameJoin);

    const [k5d] = await connection.query(`SELECT * FROM 5d WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT ${pageno}, ${pageto} `);
    const [k5dAll] = await connection.query(`SELECT * FROM 5d WHERE status != 0 AND game = '${game}' `);
    const [period] = await connection.query(`SELECT period FROM 5d WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `);
    if (k5d.length == 0) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            page: 1,
            status: false
        });
    }
    if (!pageno || !pageto || !user[0] || !k5d[0] || !period[0]) {
        return res.status(200).json({
            message: 'Error!',
            status: false
        });
    }
    let page = Math.ceil(k5dAll.length / 10);
    return res.status(200).json({
        code: 0,
        msg: "Get success",
        data: {
            gameslist: k5d,
        },
        period: period[0].period,
        page: page,
        status: true
    });
}

const GetMyEmerdList = async (req, res) => {
    let { gameJoin, pageno, pageto } = req.body;
    let auth = req.cookies.auth;

    let checkGame = ['1', '3', '5', '10'].includes(String(gameJoin));
    if (!checkGame || pageno < 0 || pageto < 0) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }

    let game = Number(gameJoin);

    const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1 LIMIT 1 ', [auth]);
    const [result_5d] = await connection.query(`SELECT * FROM result_5d WHERE phone = ? AND game = '${game}' ORDER BY id DESC LIMIT ${Number(pageno) + ',' + Number(pageto)}`, [user[0].phone]);
    const [result_5dAll] = await connection.query(`SELECT * FROM result_5d WHERE phone = ? AND game = '${game}' ORDER BY id DESC `, [user[0].phone]);

    if (!result_5d[0]) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            page: 1,
            status: false
        });
    }
    if (!pageno || !pageto || !user[0] || !result_5d[0]) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }
    let page = Math.ceil(result_5dAll.length / 10);

    let datas = result_5d.map((data) => {
        let { id, phone, code, invite, level, game, ...others } = data;
        return others;
    });

    return res.status(200).json({
        code: 0,
        msg: "Get success",
        data: {
            gameslist: datas,
        },
        page: page,
        status: true
    });
}

function makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const add5D = async(game) => {
    try {
        let join = '';
        if (game == 1) join = 'k5d'; 
        if (game == 3) join = 'k5d3';
        if (game == 5) join = 'k5d5';
        if (game == 10) join = 'k5d10';

        let result2 = makeid(5);
        let timeNow = Date.now();
        
        let [k5D] = await connection.query(`SELECT period FROM 5d WHERE status = 0 AND game = ${game} ORDER BY id DESC LIMIT 1 `);
        const [setting] = await connection.query('SELECT * FROM `admin` ');
        if (k5D && k5D.length > 0) {
        let period = k5D[0].period;

        let nextResult = '';
        if (game == 1) nextResult = setting[0].k5d;
        if (game == 3) nextResult = setting[0].k5d3;
        if (game == 5) nextResult = setting[0].k5d5;
        if (game == 10) nextResult = setting[0].k5d10;

        let newArr = '';
        if (nextResult == '-1') {
            await connection.execute(`UPDATE 5d SET result = ?,status = ? WHERE period = ? AND game = "${game}"`, [result2, 1, period]);
            newArr = '-1';
        } else {
            let result = '';
            let arr = nextResult.split('|');
            let check = arr.length;
            if (check == 1) {
                newArr = '-1';
            } else {
                for (let i = 1; i < arr.length; i++) {
                    newArr += arr[i] + '|';
                }
                newArr = newArr.slice(0, -1);
            }
            result = arr[0];
            await connection.execute(`UPDATE 5d SET result = ?,status = ? WHERE period = ? AND game = ${game}`, [result, 1, period]);
        }
        
        
        const currentDate = new Date();
        // Extract individual components
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Months are zero-based, so add 1
        const day = currentDate.getDate().toString().padStart(2, "0");
        const todaysDate = year+""+month+""+day;


        const newPeriod = Number(Number((period.toString()).slice(7))+1);
        const finalPeriod = todaysDate +""+ newPeriod;
        const sql = `INSERT INTO 5d SET period = ?, result = ?, game = ?, status = ?, time = ?`;
        await connection.execute(sql, [finalPeriod, 0, game, 0, timeNow]);

        if (game == 1) join = 'k5d';
        if (game == 3) join = 'k5d3';
        if (game == 5) join = 'k5d5';
        if (game == 10) join = 'k5d10'; 

        await connection.execute(`UPDATE admin SET ${join} = ?`, [newArr]);
    } else {
        console.log("No data found for the specified conditions.");
    }
    } catch (error) {
        if (error) {
            console.log(error);
        }
    }
}

async function funHanding(game) {
    const [k5d] = await connection.query(`SELECT * FROM 5d WHERE status != 0 AND game = ${game} ORDER BY id DESC LIMIT 1 `);
    let k5dInfo = k5d[0];
 
    // update ket qua
    await connection.execute(`UPDATE result_5d SET result = ? WHERE status = 0 AND game = ${game}`, [k5dInfo.result]);
    let result = String(k5dInfo.result).split('');
    let a = result[0];
    let b = result[1];
    let c = result[2];
    let d = result[3];
    let e = result[4];
    let total = 0;
    for (let i = 0; i < result.length; i++) {
        total += Number(result[i]);
    }

    // xử lý game a
    const [joinA] = await connection.execute(`SELECT id, bet FROM result_5d WHERE status = 0 AND game = ${game} AND join_bet = 'a' `);
    let lengthA = joinA.length;
    for (let i = 0; i < lengthA; i++) {
        let info = joinA[i];
        let sult = info.bet.split('');
        let check = isNumber(info.bet);
        if (check) {
            const joinNum = sult.includes(a);
            if (!joinNum) {
                await connection.execute(`UPDATE result_5d SET status = 2 WHERE id = ? `, [info.id]);
            }
        }
        
    }
    if (lengthA > 0) {
        if(a == '0' || a == '1' || a == '2' || a == '3' || a == '4') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'a' AND bet = 'b' `)
        };
        if(a == '5' || a == '6' || a == '7' || a == '8' || a == '9') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'a' AND bet = 's' `)
        };
        if(Number(a) % 2 == 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'a' AND bet = 'l' `)
        };
        if(Number(a) % 2 != 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'a' AND bet = 'c' `)
        };
    }

    // xử lý game b
    const [joinB] = await connection.execute(`SELECT id, bet FROM result_5d WHERE status = 0 AND game = ${game} AND join_bet = 'b' `);
    let lengthB = joinB.length;
    for (let i = 0; i < lengthB; i++) {
        let info = joinB[i];
        let sult = info.bet.split('');
        let check = isNumber(info.bet);
        if (check) {
            const joinNum = sult.includes(b);
            if (!joinNum) {
                await connection.execute(`UPDATE result_5d SET status = 2 WHERE id = ? `, [info.id]);
            }
        }
        
    }
    if (lengthB > 0) {
        if(b == '0' || b == '1' || b == '2' || b == '3' || b == '4') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'b' AND bet = 'b' `);
        };
        if(b == '5' || b == '6' || b == '7' || b == '8' || b == '9') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'b' AND bet = 's' `);
        };
        if(Number(b) % 2 == 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'b' AND bet = 'l' `);
        };
        if(Number(b) % 2 != 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'b' AND bet = 'c' `);
        };
    }

    // xử lý game c
    const [joinC] = await connection.execute(`SELECT id, bet FROM result_5d WHERE status = 0 AND game = ${game} AND join_bet = 'c' `);
    let lengthC = joinC.length;
    for (let i = 0; i < lengthC; i++) {
        let info = joinC[i];
        let sult = info.bet.split('');
        let check = isNumber(info.bet);
        if (check) {
            const joinNum = sult.includes(c);
            if (!joinNum) {
                await connection.execute(`UPDATE result_5d SET status = 2 WHERE id = ? `, [info.id]);
            }
        }
        
    }
    if (lengthC > 0) {
        if(c == '0' || c == '1' || c == '2' || c == '3' || c == '4') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'c' AND bet = 'b' `);
        };
        if(c == '5' || c == '6' || c == '7' || c == '8' || c == '9') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'c' AND bet = 's' `);
        };
        if(Number(c) % 2 == 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'c' AND bet = 'l' `);
        };
        if(Number(c) % 2 != 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'c' AND bet = 'c' `);
        };
    }
    
    // xử lý game d
    const [joinD] = await connection.execute(`SELECT id, bet FROM result_5d WHERE status = 0 AND game = ${game} AND join_bet = 'd' `);
    let lengthD = joinD.length;
    for (let i = 0; i < lengthD; i++) {
        let info = joinD[i];
        let sult = info.bet.split('');
        let check = isNumber(info.bet);
        if (check) {
            const joinNum = sult.includes(d);
            if (!joinNum) {
                await connection.execute(`UPDATE result_5d SET status = 2 WHERE id = ? `, [info.id]);
            }
        }
        
    }
    if (lengthD > 0) {
        if(d == '0' || d == '1' || d == '2' || d == '3' || d == '4') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'd' AND bet = 'b' `);
        };
        if(d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'd' AND bet = 's' `);
        };
        if(Number(d) % 2 == 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'd' AND bet = 'l' `);
        };
        if(Number(d) % 2 != 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'd' AND bet = 'c' `);
        };
    }

    // xử lý game e
    const [joinE] = await connection.execute(`SELECT id, bet FROM result_5d WHERE status = 0 AND game = ${game} AND join_bet = 'e' `);
    let lengthE = joinE.length;
    for (let i = 0; i < lengthE; i++) {
        let info = joinE[i];
        let sult = info.bet.split('');
        let check = isNumber(info.bet);
        if (check) {
            const joinNum = sult.includes(e);
            if (!joinNum) {
                await connection.execute(`UPDATE result_5d SET status = 2 WHERE id = ? `, [info.id]);
            }
        }
        
    }
    if (lengthE > 0) {
        if(e == '0' || e == '1' || e == '2' || e == '3' || e == '4') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'e' AND bet = 'b' `);
        };
        if(e == '5' || e == '6' || e == '7' || e == '8' || e == '9') {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'e' AND bet = 's' `);
        };
        if(Number(e) % 2 == 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'e' AND bet = 'l' `);
        };
        if(Number(e) % 2 != 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'e' AND bet = 'c' `);
        };
    }

    // xử lý game e
    const [joinTotal] = await connection.execute(`SELECT id, bet FROM result_5d WHERE status = 0 AND game = ${game} AND join_bet = 'total' `);
    if (joinTotal.length > 0) {
        if(total <= 22) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'total' AND bet = 'b' `);
        };
        if(total > 22) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'total' AND bet = 's' `);
        };
        if(total % 2 == 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'total' AND bet = 'l' `);
        };
        if(total % 2 != 0) {
            await connection.execute(`UPDATE result_5d SET status = 2 WHERE join_bet = 'total' AND bet = 'c' `);
        };
    }
}

const handling5D = async(typeid) => {

    let game = Number(typeid);

    await funHanding(game);

    const [order] = await connection.execute(`SELECT id, phone, bet, price, money, fee, amount FROM result_5d WHERE status = 0 AND game = ${game} `);
    for (let i = 0; i < order.length; i++) {
        let orders = order[i];
        let id = orders.id;
        let phone = orders.phone;
        let nhan_duoc = 0;
        let check = isNumber(orders.bet); 
        if (check) {
            let arr = orders.bet.split('');
            let total = (orders.money / arr.length / orders.amount);
            let fee = total * 0.02;
            let price = total - fee;
            nhan_duoc += price * 9;
        } else {
            nhan_duoc += orders.price * 2;
        }

        await connection.execute('UPDATE `result_5d` SET `get` = ?, `status` = 1 WHERE `id` = ? ', [nhan_duoc, id]);
        const sql = 'UPDATE `users` SET `money` = `money` + ? WHERE `phone` = ? ';
        await connection.execute(sql, [nhan_duoc, phone]);
    }
}


module.exports = {
    K5DPage,
    K5DPage3,
    K5DPage5,
    K5DPage10,
    betK5D,
    listOrderOld,
    GetMyEmerdList,
    add5D,
    handling5D
}