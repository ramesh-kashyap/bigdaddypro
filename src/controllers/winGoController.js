import connection from "../config/connectDB";
import jwt from 'jsonwebtoken'
import md5 from "md5";
import e from "express";
require('dotenv').config();


const winGoPage = async (req, res) => {
    return res.render("bet/wingo/win.ejs");
}

const winGoPage3 = async (req, res) => {
    return res.render("bet/wingo/win3.ejs");
}

const winGoPage5 = async (req, res) => {
    return res.render("bet/wingo/win5.ejs");
}

const winGoPage10 = async (req, res) => {
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




const betWinGo = async (req, res) => {
    let { typeid, join, x, money } = req.body;

   
    let auth = req.cookies.auth;

    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }

    let gameJoin = '';
    if (typeid == 1) gameJoin = 'wingo';
    if (typeid == 3) gameJoin = 'wingo3';
    if (typeid == 5) gameJoin = 'wingo5';
    if (typeid == 10) gameJoin = 'wingo10';
    const [winGoNow] = await connection.query(`SELECT period FROM wingo WHERE status = 0 AND game = '${gameJoin}' ORDER BY id DESC LIMIT 1 `);
    const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);

    console.log(money);
    if (!winGoNow[0] || !user[0] || !isNumber(x) || !isNumber(money)) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }

    let userInfo = user[0];
    let period = winGoNow[0].period;
    let fee = (x * money) * 0.02;
    let total = (x * money) - fee;
    let timeNow = Date.now();
    let check = userInfo.money - total;

    let date = new Date();
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    let id_product = years + months + days + Math.floor(Math.random() * 1000000000000000);

    let formatTime = timerJoin();

    let color = '';
    if (join == 'l') {
        color = 'big';
    } else if (join == 'n') {
        color = 'small';
    } else if (join == 't') {
        color = 'violet';
    } else if (join == 'd') {
        color = 'red';
    } else if (join == 'x') {
        color = 'green';
    } else if (join == '0') {
        color = 'red-violet';
    } else if (join == '5') {
        color = 'green-violet';
    } else if (join % 2 == 0) {
        color = 'red';
    } else if (join % 2 != 0) {
        color = 'green';
    }

    let checkJoin = '';

    if (!isNumber(join) && join == 'l' || join == 'n') {
        checkJoin = `
        <div data-v-a9660e98="" class="van-image" style="width: 30px; height: 30px;">
            <img src="/images/${(join == 'n') ? 'small' : 'big'}.png" class="van-image__img">
        </div>
        `
    } else {
        checkJoin =
            `
        <span data-v-a9660e98="">${(isNumber(join)) ? join : ''}</span>
        `
    }


    let result = `
    <div data-v-a9660e98="" issuenumber="${period}" addtime="${formatTime}" rowid="1" class="hb">
        <div data-v-a9660e98="" class="item c-row">
            <div data-v-a9660e98="" class="result">
                <div data-v-a9660e98="" class="select select-${(color)}">
                    ${checkJoin}
                </div>
            </div>
            <div data-v-a9660e98="" class="c-row c-row-between info">
                <div data-v-a9660e98="">
                    <div data-v-a9660e98="" class="issueName">
                        ${period}
                    </div>
                    <div data-v-a9660e98="" class="tiem">${formatTime}</div>
                </div>
            </div>
        </div>
        <!---->
    </div>
    `;

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
        return years + '-' + months + '-' + days;
    }
    let checkTime = timerJoin(date.getTime());

    if (check >= 0) {
        const sql = `INSERT INTO minutes_1 SET 
        id_product = ?,
        phone = ?,
        code = ?,
        invite = ?,
        stage = ?,
        level = ?,
        money = ?,
        amount = ?,
        fee = ?,
        get = ?,
        game = ?,
        bet = ?,
        status = ?,
        today = ?,
        time = ?`;
        await connection.execute(sql, [id_product, userInfo.phone, userInfo.code, userInfo.invite, period, userInfo.level, total, x, fee, 0, gameJoin, join, 0, checkTime, timeNow]);
        checkVipBonus(userInfo.phone,(money * x)/10);
        await connection.execute('UPDATE `users` SET `money` = `money` - ?, `total_bet` = `total_bet` + ? WHERE `token` = ?', [money * x, money * x, auth]);
        const [users] = await connection.query('SELECT `money`, `level` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);
        await rosesPlus(auth, money * x);
        const [level] = await connection.query('SELECT * FROM level ');
        let level0 = level[0];
        const sql2 = `INSERT INTO roses SET 
        phone = ?,
        code = ?,
        invite = ?,
        f1 = ?,
        f2 = ?,
        f3 = ?,
        f4 = ?,
        time = ?`;
        let total_m = money * x;
        let f1 = (total_m / 100) * level0.f1;
        let f2 = (total_m / 100) * level0.f2;
        let f3 = (total_m / 100) * level0.f3;
        let f4 = (total_m / 100) * level0.f4;
        await connection.execute(sql2, [userInfo.phone, userInfo.code, userInfo.invite, f1, f2, f3, f4, timeNow]);
        return res.status(200).json({
            message: 'Bet successfully',
            status: true,
            data: result,
            change: users[0].level,
            money: users[0].money,
        });
    } else {
        return res.status(200).json({
            message: 'The amount is not enough',
            status: false
        });
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
    let { typeid, pageno, pageto } = req.body;

    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }
    if (pageno < 0 || pageto < 0) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ', [auth]);

    let game = '';
    if (typeid == 1) game = 'wingo';
    if (typeid == 3) game = 'wingo3';
    if (typeid == 5) game = 'wingo5';
    if (typeid == 10) game = 'wingo10';

    const [wingo] = await connection.query(`SELECT * FROM wingo WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT ${pageno}, ${pageto} `);
    const [wingoAll] = await connection.query(`SELECT * FROM wingo WHERE status != 0 AND game = '${game}' `);
    const [period] = await connection.query(`SELECT period FROM wingo WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `);
    if (!wingo[0]) {
        return res.status(200).json({
            code: 0,
            msg: "no more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    if (!pageno || !pageto || !user[0] || !wingo[0] || !period[0]) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }
    let page = Math.ceil(wingoAll.length / 10);
    return res.status(200).json({
        code: 0,
        msg: "Get success",
        data: {
            gameslist: wingo,
        },
        period: period[0].period,
        page: page,
        status: true
    });
}

const GetMyEmerdList = async (req, res) => {
    let { typeid, pageno, pageto } = req.body;

    // if (!pageno || !pageto) {
    //     pageno = 0;
    //     pageto = 10;
    // }

    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }

    if (pageno < 0 || pageto < 0) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    let auth = req.cookies.auth;

    let game = '';
    if (typeid == 1) game = 'wingo';
    if (typeid == 3) game = 'wingo3';
    if (typeid == 5) game = 'wingo5';
    if (typeid == 10) game = 'wingo10';

    const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1 LIMIT 1 ', [auth]);
    const [minutes_1] = await connection.query(`SELECT * FROM minutes_1 WHERE phone = ? AND game = '${game}' ORDER BY id DESC LIMIT ${Number(pageno) + ',' + Number(pageto)}`, [user[0].phone]);
    const [minutes_1All] = await connection.query(`SELECT * FROM minutes_1 WHERE phone = ? AND game = '${game}' ORDER BY id DESC `, [user[0].phone]);

    if (!minutes_1[0]) {
        return res.status(200).json({
            code: 0,
            msg: "No more data",
            data: {
                gameslist: [],
            },
            status: false
        });
    }
    if (!pageno || !pageto || !user[0] || !minutes_1[0]) {
        return res.status(200).json({
            message: 'Error!',
            status: true
        });
    }
    let page = Math.ceil(minutes_1All.length / 10);

    let datas = minutes_1.map((data) => {
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

const WingoBetList = async (req, res) => {
    const auth = req.cookies.auth;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];

    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [betData] = await connection.query('SELECT * FROM minutes_1 WHERE phone = ? ORDER BY id DESC LIMIT ? OFFSET ?', [userInfo.phone, limit, offset]);
    const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM minutes_1 WHERE phone = ?', [userInfo.phone]);

    return res.status(200).json({
        code: 0,
        msg: "Get success",
        data: {
            gameslist: betData,
            total: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        },
        status: true
    });
};



const addWinGo = async (game) => {
    try {
        let join = '';
        if (game == 1) join = 'wingo';
        if (game == 3) join = 'wingo3';
        if (game == 5) join = 'wingo5';
        if (game == 10) join = 'wingo10';
        const [winGoNow] = await connection.query(`SELECT period FROM wingo WHERE status = 0 AND game = "${join}" ORDER BY id DESC LIMIT 1 `);
        const [setting] = await connection.query('SELECT * FROM `admin` ');
        // Check if winGoNow is not empty
        if (winGoNow && winGoNow.length > 0) {
            let period = winGoNow[0].period; // current demand
            let amount = Math.floor(Math.random() * 10); //blue red purple

            // add logic 
            // const [minPlayers] = await connection.query(`SELECT * FROM minutes_1 WHERE status = 0 AND game = "${join}"`);

            // if (minPlayers.length >= 1) {
            //     const betColumns = [
            //         // Red small
            //         { name: 'red_0', bets: ['0', 't', 'd', 'n'] },
            //         { name: 'red_2', bets: ['2', 'd', 'n'] },
            //         { name: 'red_4', bets: ['4', 'd', 'n'] },
            //         // Green small
            //         { name: 'green_1', bets: ['1', 'x', 'n'] },
            //         { name: 'green_3', bets: ['3', 'x', 'n'] },
            //         // Green big
            //         { name: 'green_5', bets: ['5', 'x', 't', 'l'] },
            //         { name: 'green_7', bets: ['7', 'x', 'l'] },
            //         { name: 'green_9', bets: ['9', 'x', 'l'] },
            //         // Red big
            //         { name: 'red_6', bets: ['6', 'd', 'l'] },
            //         { name: 'red_8', bets: ['8', 'd', 'l'] }
            //     ];

            //     const totalMoneyPromises = betColumns.map(async column => {
            //         const [result] = await connection.query(`
            //             SELECT SUM(money) AS total_money
            //             FROM minutes_1
            //             WHERE game = "${join}" AND status = 0 AND bet IN (${column.bets.map(bet => `"${bet}"`).join(',')})
            //         `);
            //         return { name: column.name, total_money: result[0]?.total_money ? parseInt(result[0].total_money) : 0 };
            //     });

            //     const categories = await Promise.all(totalMoneyPromises);
            //     const smallestCategory = categories.reduce((smallest, category) =>
            //         (!smallest || category.total_money < smallest.total_money) ? category : smallest
            //     , null);
            //     // Determine the bet with the lowest amount
            //     const colorBets = {
            //         red_6: [6],
            //         red_8: [8],
            //         red_2: [2],
            //         red_4: [4],
            //         green_3: [3],
            //         green_7: [7],
            //         green_9: [9],
            //         green_1: [1],
            //         green_5: [5],
            //         red_0: [0],
            //     };

            //     const betsForCategory = colorBets[smallestCategory.name] || [];
            //     const availableBets = betsForCategory.filter(bet =>
            //         !categories.find(category => category.name === smallestCategory.name && category.total_money < smallestCategory.total_money)
            //     );
            //     amount = availableBets.length > 0 ? availableBets[0] : Math.min(...betsForCategory);
            //     console.log(amount);
            // }


            // end logic 
            let timeNow = Date.now();
            let nextResult = '';
            if (game == 1) nextResult = setting[0].wingo1;
            if (game == 3) nextResult = setting[0].wingo3;
            if (game == 5) nextResult = setting[0].wingo5;
            if (game == 10) nextResult = setting[0].wingo10;
    
            let newArr = '';
            if (nextResult == '-1') {
                await connection.execute(`UPDATE wingo SET amount = ?,status = ? WHERE period = ? AND game = "${join}"`, [amount, 1, period]);
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
    
                // console.log('new Number '+result);
                await connection.execute(`UPDATE wingo SET amount = ?,status = ? WHERE period = ? AND game = "${join}"`, [result, 1, period]);
            }
            const currentDate = new Date();
            // Extract individual components
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; // Months are zero-based, so add 1
            const day = currentDate.getDate().toString().padStart(2, "0");
            const todaysDate = year + "" + month + "" + day;
            
            const newPeriod = Number(Number(period.slice(7)) + 1);
            const finalPeriod = todaysDate + "" + newPeriod;



            const sql = `INSERT INTO wingo SET 
            period = ?,
            amount = ?,
            game = ?,
            status = ?,
            time = ?`;
            await connection.execute(sql, [finalPeriod, 0, join, 0, timeNow]);


          

            if (game == 1) join = 'wingo1';
            if (game == 3) join = 'wingo3';
            if (game == 5) join = 'wingo5';
            if (game == 10) join = 'wingo10';

            await connection.execute(`UPDATE admin SET ${join} = ?`, [newArr]);
        } else {
            console.log("No data found for the specified conditions.");
        }
    } catch (error) {
        console.log(error);
    }
}


const checkPeriodAndStage = async (req, res) => {
    try {
        let auth = req.cookies.auth;

        if (!auth) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        // Query to get the user details using the token
        const [userResult] = await connection.query(
            'SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?',
            [auth]
        );

        if (userResult.length === 0) {
            return res.status(200).json({
                message: 'User not found',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const userPhone = userResult[0].phone;

        // Query to select the period for the game "wingo" with status 1
        const [gamePeriodResult] = await connection.query(
            'SELECT period FROM wingo WHERE game = "wingo" AND status = 1 ORDER BY period DESC LIMIT 1'
        );

        if (gamePeriodResult.length === 0) {
            return res.status(200).json({
                message: 'No period found for game wingo with status 1',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const period = gamePeriodResult[0].period;

        // Query to check if the period matches the stage in minutes_1 table and phone matches with user phone
        const [stageResult] = await connection.query(
            'SELECT stage FROM minutes_1 WHERE stage = ? AND phone = ?',
            [period, userPhone]
        );

        if (stageResult.length === 0) {
            return res.status(200).json({
                message: 'No matching stage found in minutes_1 table for the user phone',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            message: 'success',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error checking period and stage:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};

const checkPeriodAndStage3 = async (req, res) => {
    try {
        let auth = req.cookies.auth;

        if (!auth) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        // Query to get the user details using the token
        const [userResult] = await connection.query(
            'SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?',
            [auth]
        );

        if (userResult.length === 0) {
            return res.status(200).json({
                message: 'User not found',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const userPhone = userResult[0].phone;

        // Query to select the period for the game "wingo3" with status 1
        const [gamePeriodResult] = await connection.query(
            'SELECT period FROM wingo WHERE game = "wingo3" AND status = 1 ORDER BY period DESC LIMIT 1'
        );

        if (gamePeriodResult.length === 0) {
            return res.status(200).json({
                message: 'No period found for game wingo3 with status 1',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const period = gamePeriodResult[0].period;

        // Query to check if the period matches the stage in minutes_1 table and phone matches with user phone
        const [stageResult] = await connection.query(
            'SELECT stage FROM minutes_1 WHERE stage = ? AND phone = ?',
            [period, userPhone]
        );

        if (stageResult.length === 0) {
            return res.status(200).json({
                message: 'No matching stage found in minutes_1 table for the user phone',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            message: 'success',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error checking period and stage:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};



const checkPeriodAndStage5 = async (req, res) => {
    try {
        let auth = req.cookies.auth;

        if (!auth) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        // Query to get the user details using the token
        const [userResult] = await connection.query(
            'SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?',
            [auth]
        );

        if (userResult.length === 0) {
            return res.status(200).json({
                message: 'User not found',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const userPhone = userResult[0].phone;

        // Query to select the period for the game "wingo5" with status 1
        const [gamePeriodResult] = await connection.query(
            'SELECT period FROM wingo WHERE game = "wingo5" AND status = 1 ORDER BY period DESC LIMIT 1'
        );

        if (gamePeriodResult.length === 0) {
            return res.status(200).json({
                message: 'No period found for game wingo5 with status 1',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const period = gamePeriodResult[0].period;

        // Query to check if the period matches the stage in minutes_1 table and phone matches with user phone
        const [stageResult] = await connection.query(
            'SELECT stage FROM minutes_1 WHERE stage = ? AND phone = ?',
            [period, userPhone]
        );

        if (stageResult.length === 0) {
            return res.status(200).json({
                message: 'No matching stage found in minutes_1 table for the user phone',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            message: 'success',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error checking period and stage:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};



const checkPeriodAndStage10 = async (req, res) => {
    try {
        let auth = req.cookies.auth;

        if (!auth) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        // Query to get the user details using the token
        const [userResult] = await connection.query(
            'SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?',
            [auth]
        );

        if (userResult.length === 0) {
            return res.status(200).json({
                message: 'User not found',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const userPhone = userResult[0].phone;

        // Query to select the period for the game "wingo10" with status 1
        const [gamePeriodResult] = await connection.query(
            'SELECT period FROM wingo WHERE game = "wingo10" AND status = 1 ORDER BY period DESC LIMIT 1'
        );

        if (gamePeriodResult.length === 0) {
            return res.status(200).json({
                message: 'No period found for game wingo10 with status 1',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const period = gamePeriodResult[0].period;

        // Query to check if the period matches the stage in minutes_1 table and phone matches with user phone
        const [stageResult] = await connection.query(
            'SELECT stage FROM minutes_1 WHERE stage = ? AND phone = ?',
            [period, userPhone]
        );

        if (stageResult.length === 0) {
            return res.status(200).json({
                message: 'No matching stage found in minutes_1 table for the user phone',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            message: 'success',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error checking period and stage:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};










const handlingWinGo1P = async (typeid) => {

    let game = '';
    if (typeid == 1) game = 'wingo';
    if (typeid == 3) game = 'wingo3';
    if (typeid == 5) game = 'wingo5';
    if (typeid == 10) game = 'wingo10';

    const [winGoNow] = await connection.query(`SELECT * FROM wingo WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `);
    
    // update ket qua
    await connection.execute(`UPDATE minutes_1 SET result = ? WHERE status = 0 AND game = '${game}'`, [winGoNow[0].amount]);
    let result = Number(winGoNow[0].amount);
    switch (result) {
        case 0:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "0" AND bet != "t" `, []);
            break;
        case 1:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "1" `, []);
            break;
        case 2:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "2" `, []);
            break;
        case 3:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "3" `, []);
            break;
        case 4:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "4" `, []);
            break;
        case 5:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "5" AND bet != "t" `, []);
            break;
        case 6:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "6" `, []);
            break;
        case 7:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "7" `, []);
            break;
        case 8:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "8" `, []);
            break;
        case 9:
            await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "9" `, []);
            break;
        default:
            break;
    }

    if (result < 5) {
        await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet = "l" `, []);
    } else {
        await connection.execute(`UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet = "n" `, []);
    }

    // lấy ra danh sách đặt cược chưa xử lý
    const [order] = await connection.execute(`SELECT * FROM minutes_1 WHERE status = 0 AND game = '${game}' `);
    for (let i = 0; i < order.length; i++) {
        let orders = order[i];
        let result = orders.result;
        let bet = orders.bet;
        let total = orders.money;
        let id = orders.id;
        let phone = orders.phone;
        var nhan_duoc = 0;

        if (bet == 'l' || bet == 'n') {
            nhan_duoc = total * 2;
        } else {
            if (result == 0 || result == 5) {
                if (bet == 'd' || bet == 'x') {
                    nhan_duoc = total * 1.5;
                } else if (bet == 't') {
                    nhan_duoc = total * 4.5;
                } else if (bet == "0" || bet == "5") {
                    nhan_duoc = total * 9;
                }
            } else {
                if (result == 1 && bet == "1") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 1 && bet == 'x') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 2 && bet == "2") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 2 && bet == 'd') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 3 && bet == "3") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 3 && bet == 'x') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 4 && bet == "4") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 4 && bet == 'd') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 6 && bet == "6") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 6 && bet == 'd') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 7 && bet == "7") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 7 && bet == 'x') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 8 && bet == "8") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 8 && bet == 'd') {
                        nhan_duoc = total * 2;
                    }
                }
                if (result == 9 && bet == "9") {
                    nhan_duoc = total * 9;
                } else {
                    if (result == 9 && bet == 'x') {
                        nhan_duoc = total * 2;
                    }
                }
            }
        }
        const [users] = await connection.execute('SELECT `money` FROM `users` WHERE `phone` = ?', [phone]);
  let money = parseInt(users[0].money, 10);
 let totals = money + nhan_duoc;
  await connection.execute('UPDATE `minutes_1` SET `get` = ?, `status` = 1 WHERE `id` = ? ', [nhan_duoc, id]);
  const sql = 'UPDATE `users` SET `money` = ? WHERE `phone` = ? ';
 await connection.execute(sql, [totals, phone]);

    }

    
}

module.exports = {
    winGoPage,
    betWinGo,
    listOrderOld,
    GetMyEmerdList,
    handlingWinGo1P,
    addWinGo,
    winGoPage3,
    winGoPage5,
    winGoPage10,
    checkPeriodAndStage,
    checkPeriodAndStage3,
    checkPeriodAndStage5,
    checkPeriodAndStage10,
    WingoBetList
}