import connection from "../config/connectDB";
import jwt from 'jsonwebtoken'
import md5 from "md5";
import request from 'request';
const Coinpayments = require('coinpayments');
const axios = require('axios');
const qs = require('qs');
const paytm = require('paytmchecksum');
const crypto = require('crypto');
const https = require('https');


require('dotenv').config();

let timeNow = Date.now();
const client = new Coinpayments({
    key: '492c48d33d70aa0a7e8d3e14f7cb756a3f7cb4345ce9a97ecd56f01158d4bf81',
    secret: '01F6e742cA7169D6113380D5f74727454f83cd29503AAFb0CBAb5dA7533486df',
  });

const randomNumber = (min, max) => {
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}
const verifyCode = async (req, res) => {
    try {
        let auth = req.cookies.auth;
        let now = new Date().getTime();
        let timeEnd = now + 1000 * (60 * 2) + 500;
        let otp = Math.floor(100000 + Math.random() * 900000);

        const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ?', [auth]);
        if (rows.length === 0) {
            return res.status(200).json({
                message: 'Account does not exist',
                status: false,
                timeStamp: now,
            });
        }

        let user = rows[0];
        if (user.time_otp - now <= 0) {
            // request(`http://47.243.168.18:9090/sms/batch/v2?appkey=NFJKdK&appsecret=brwkTw&phone=84${user.phone}&msg=Your verification code is ${otp}&extend=${now}`, async (error, response, body) => {
            //     if (error) {
            //         return res.status(500).json({
            //             message: 'Failed to send SMS',
            //             status: false,
            //             timeStamp: now,
            //         });
            //     }

            //     let data = JSON.parse(body);
            //     if (data.code == '00000') {
            //         await connection.execute("UPDATE users SET otp = ?, time_otp = ? WHERE phone = ?", [otp, timeEnd, user.phone]);
            //         return res.status(200).json({
            //             message: 'Submitted successfully',
            //             status: true,
            //             timeStamp: now,
            //             timeEnd: timeEnd,
            //         });
            //     } else {
                    return res.status(500).json({
                        message: 'Failed to send SMS',
                        status: false,
                        timeStamp: now,
                    });
                
            // });
        } else {
            return res.status(200).json({
                message: 'Send SMS regularly',
                status: false,
                timeStamp: now,
            });
        }
    } catch (err) {
        return res.status(500).json({
            message: 'Internal server error',
            status: false,
            timeStamp: new Date().getTime(),
        });
    }
};


const userInfo = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString();

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ?', [auth]);

        if (!rows || rows.length === 0) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
        }

        const user = rows[0];
        const [recharge] = await connection.query('SELECT * FROM recharge WHERE `phone` = ? AND status = 1', [user.phone]);
        let totalRecharge = 0;
        recharge.forEach((data) => {
            totalRecharge += data.money;
        });

        const [withdraw] = await connection.query('SELECT * FROM withdraw WHERE `phone` = ? AND status = 1', [user.phone]);
        let totalWithdraw = 0;
        withdraw.forEach((data) => {
            totalWithdraw += data.money;
        });

        const [userBank] = await connection.query('SELECT usdtBep20, usdttrc20 FROM user_bank WHERE `phone` = ?', [user.phone]);

        let usdtBep = 0;
        let usdtTrc = 0;

        if (userBank && userBank.length > 0) {
            usdtBep = userBank[0].usdtBep20 || 0;
            usdtTrc = userBank[0].usdttrc20 || 0;
        }


        const { id, password, ip, veri, ip_address, status, time, token, ...others } = user;
        return res.status(200).json({
            message: 'Success',
            status: true,
            data: {
                code: others.code,
                id_user: others.id_user,
                last_login: user.last_login.toLocaleString(),
                name_user: others.name_user,
                phone_user: others.phone,
                money_user: user.money,
                thirdparty_wallet: user.thirdparty_wallet,
                ai_balance: user.ai_balance,
                total_money:user.total_money,
                winning_wallet: others.win_wallet,
                vip_level: others.vip_level,
                usdtBep: usdtBep,
                usdtTrc: usdtTrc,
            },
            totalRecharge: totalRecharge,
            totalWithdraw: totalWithdraw,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.error('Error fetching user info:', error.message, error.stack);
        return res.status(500).json({
            message: `Internal Server Error: ${error.message}`,
            status: false,
            timeStamp: timeNow,
        });
    }
};


const changeUser = async(req, res) => {
    let auth = req.cookies.auth;
    let name = req.body.name;
    let type = req.body.type;

    const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ? ', [auth]);
    if(!rows || !type || !name) return res.status(200).json({
        message: 'Failed',
        status: false,
        timeStamp: timeNow,
    });;
    switch (type) {
        case 'editname':
            await connection.query('UPDATE users SET name_user = ? WHERE `token` = ? ', [name, auth]);
            return res.status(200).json({
                message: 'Modified login name successfully',
                status: true,
                timeStamp: timeNow,
            });
            break;
    
        default:
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
            break;
    }

}

const changePassword = async(req, res) => {
    let auth = req.cookies.auth;
    let password = req.body.password;
    let newPassWord = req.body.newPassWord;
    // let otp = req.body.otp;

    if(!password || !newPassWord) return res.status(200).json({
        message: 'Failed',
        status: false,
        timeStamp: timeNow,
    });;
    const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ? AND `password` = ? ', [auth, md5(password)]);
    if(rows.length == 0) return res.status(200).json({
        message: 'incorrect password',
        status: false,
        timeStamp: timeNow,
    });;

    // let getTimeEnd = Number(rows[0].time_otp);
    // let tet = new Date(getTimeEnd).getTime();
    // var now = new Date().getTime();
    // var timeRest = tet - now;
    // if (timeRest <= 0) {
    //     return res.status(200).json({
    //         message: 'Mã OTP đã hết hiệu lực',
    //         status: false,
    //         timeStamp: timeNow,
    //     });
    // }

    // const [check_otp] = await connection.query('SELECT * FROM users WHERE `token` = ? AND `password` = ? AND otp = ? ', [auth, md5(password), otp]);
    // if(check_otp.length == 0) return res.status(200).json({
    //     message: 'Mã OTP không chính xác',
    //     status: false,
    //     timeStamp: timeNow,
    // });;
    
    await connection.query('UPDATE users SET otp = ?, password = ?,ps = ? WHERE `token` = ? ', [randomNumber(100000, 999999), md5(newPassWord),newPassWord, auth]);
    return res.status(200).json({
        message: 'Password modification successful',
        status: true,
        timeStamp: timeNow,
    });

}

const checkInHandling = async(req, res) => {
    let auth = req.cookies.auth;
    let data = req.body.data;

    if(!auth) return res.status(200).json({
        message: 'Failed',
        status: false,
        timeStamp: timeNow,
    });;
    const [rows] = await connection.query('SELECT * FROM users WHERE `token` = ? ', [auth]);
    if(!rows) return res.status(200).json({
        message: 'Failed',
        status: false,
        timeStamp: timeNow,
    });;
    if (!data) {
        const [point_list] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
        return res.status(200).json({
            message: 'Get success',
            datas: point_list,
            status: true,
            timeStamp: timeNow,
        });
    }
    if(data) {
        if(data == 1) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 100000;
            if (check >= data && point_list.total1 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total1, rows[0].phone]);
                await connection.query('UPDATE point_list SET total1 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total1}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total1 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total1 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 2) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 200000;
            if (check >= get && point_list.total2 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total2, rows[0].phone]);
                await connection.query('UPDATE point_list SET total2 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total2}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total2 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total2 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 3) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 500000;
            if (check >= get && point_list.total3 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total3, rows[0].phone]);
                await connection.query('UPDATE point_list SET total3 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total3}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total3 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total3 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 4) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 2000000;
            if (check >= get && point_list.total4 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total4, rows[0].phone]);
                await connection.query('UPDATE point_list SET total4 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total4}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total4 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total4 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 5) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 5000000;
            if (check >= get && point_list.total5 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total5, rows[0].phone]);
                await connection.query('UPDATE point_list SET total5 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total5}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total5 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total5 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 6) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 10000000;
            if (check >= get && point_list.total6 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total6, rows[0].phone]);
                await connection.query('UPDATE point_list SET total6 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total6}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total6 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total6 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
        if(data == 7) {
            const [point_lists] = await connection.query('SELECT * FROM point_list WHERE `phone` = ? ', [rows[0].phone]);
            let check = rows[0].total_money;
            let point_list = point_lists[0];
            let get = 20000000;
            if (check >= get && point_list.total7 != 0) {
                await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [point_list.total7, rows[0].phone]);
                await connection.query('UPDATE point_list SET total7 = ? WHERE phone = ? ', [0, rows[0].phone]);
                return res.status(200).json({
                    message: `Bạn vừa nhận được ${point_list.total7}.00₫`,
                    status: true,
                    timeStamp: timeNow,
                });
            } else if (check < get && point_list.total7 != 0) {
                return res.status(200).json({
                    message: 'You are not eligible to receive gifts',
                    status: false,
                    timeStamp: timeNow,
                });
            } else if (point_list.total7 == 0) {
                return res.status(200).json({
                    message: 'You have already received this gift',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        };
    }

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
      date = Date.now();
      date = new Date(Number(date));
    }
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    let weeks = formateT(date.getDay());
  
    let hours = formateT(date.getHours());
    let minutes = formateT(date.getMinutes());
    let seconds = formateT(date.getSeconds());
    // return years + '-' + months + '-' + days + ' ' + hours + '-' + minutes + '-' + seconds;
    return years + " - " + months + " - " + days;
  }

  const promotion = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        }) 
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite`, `roses_f`, `roses_f1`, `roses_today` FROM users WHERE `token` = ? ', [auth]);
    const [level] = await connection.query('SELECT * FROM level');
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    // cấp dưới trực tiếp all
    const [f1s] = await connection.query('SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ', [userInfo.code]);

    // cấp dưới trực tiếp hôm nay 
    let f1_today = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_time = f1s[i].time; // Mã giới thiệu f1
        let check = (timerJoin(f1_time) == timerJoin()) ? true : false;
        if(check) {
            f1_today += 1;
        }
    }

    // tất cả cấp dưới hôm nay 
    let f_all_today = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_code = f1s[i].code; // Mã giới thiệu f1
        const f1_time = f1s[i].time; // time f1
        let check_f1 = (timerJoin(f1_time) == timerJoin()) ? true : false;
        if(check_f1) f_all_today += 1;
        // tổng f1 mời đc hôm nay
        const [f2s] = await connection.query('SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ', [f1_code]);
        for (let i = 0; i < f2s.length; i++) {
            const f2_code = f2s[i].code; // Mã giới thiệu f2
            const f2_time = f2s[i].time; // time f2
            let check_f2 = (timerJoin(f2_time) == timerJoin()) ? true : false;
            if(check_f2) f_all_today += 1;
            // tổng f2 mời đc hôm nay
            const [f3s] = await connection.query('SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ', [f2_code]);
            for (let i = 0; i < f3s.length; i++) {
                const f3_code = f3s[i].code; // Mã giới thiệu f3
                const f3_time = f3s[i].time; // time f3
                let check_f3 = (timerJoin(f3_time) == timerJoin()) ? true : false;
                if(check_f3) f_all_today += 1;
                const [f4s] = await connection.query('SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ', [f3_code]);
                // tổng f3 mời đc hôm nay
                for (let i = 0; i < f4s.length; i++) {
                    const f4_code = f4s[i].code; // Mã giới thiệu f4
                    const f4_time = f4s[i].time; // time f4
                    let check_f4 = (timerJoin(f4_time) == timerJoin()) ? true : false;
                    if(check_f4) f_all_today += 1;
                    // tổng f3 mời đc hôm nay
                }
            }
        }
    }
    
    // Tổng số f2
    let f2 = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_code = f1s[i].code; // Mã giới thiệu f1
        const [f2s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f1_code]);
        f2 += f2s.length;
    }
    
    // Tổng số f3
    let f3 = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_code = f1s[i].code; // Mã giới thiệu f1
        const [f2s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f1_code]);
        for (let i = 0; i < f2s.length; i++) {
            const f2_code = f2s[i].code;
            const [f3s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f2_code]);
            if(f3s.length > 0) f3 += f3s.length;
        }
    }
    
    // Tổng số f4
    let f4 = 0;
    for (let i = 0; i < f1s.length; i++) {
        const f1_code = f1s[i].code; // Mã giới thiệu f1
        const [f2s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f1_code]);
        for (let i = 0; i < f2s.length; i++) {
            const f2_code = f2s[i].code;
            const [f3s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f2_code]);
            for (let i = 0; i < f3s.length; i++) {
                const f3_code = f3s[i].code;
                const [f4s] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ', [f3_code]);
                if(f4s.length > 0) f4 += f4s.length;
            }
        }
    }

    // Get yesterdayComm
    let yesterdayComm = 0;
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayFormattedDate = yesterdayDate.toISOString().split('T')[0];
    const [yesterdayIncome] = await connection.query('SELECT money FROM y_incomes WHERE phone = ? AND created_at = ?', [userInfo.phone, yesterdayFormattedDate]);
    if(yesterdayIncome.length > 0) {
        yesterdayComm = yesterdayIncome[0].money;
    }

    return res.status(200).json({
        message: 'Get success',
        level: level,
        info: user,
        status: true,
        invite: {
            f1: f1s.length,
            total_f: f1s.length + f2 + f3 + f4,
            f1_today: f1_today,
            f_all_today: f_all_today,
            roses_f1: userInfo.roses_f1,
            roses_f: userInfo.roses_f,
            roses_all: userInfo.roses_f + userInfo.roses_f1,
            roses_today: userInfo.roses_today,
        },
        yesterdayComm: yesterdayComm,
        timeStamp: timeNow,
    });

}


const myTeam = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    const [level] = await connection.query('SELECT * FROM level');
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    return res.status(200).json({
        message: 'Receive success',
        level: level,
        info: user,
        status: true,
        timeStamp: timeNow,
    });

}

const listMyTeam = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    const [f1] = await connection.query('SELECT `id_user`, `name_user`,`status`, `time`,`roses_f` FROM users WHERE `invite` = ? ORDER BY id DESC', [userInfo.code]);
    const [mem] = await connection.query('SELECT `id_user`, `phone`, `time` FROM users WHERE `invite` = ? ORDER BY id DESC LIMIT 100', [userInfo.code]);
    const [total_roses] = await connection.query('SELECT `f1`, `time` FROM roses WHERE `invite` = ? ORDER BY id DESC LIMIT 100', [userInfo.code]);

    let newMem = [];
    mem.map((data) => {
        let objectMem = {
            id_user: data.id_user,
            phone: '84' + data.phone.slice(0, 1) + '****' + String(data.phone.slice(-4)),
            time: data.time,
        };

        return newMem.push(objectMem);
    });

    return res.status(200).json({
        message: 'Receive success',
        f1: f1,
        mem: newMem,
        total_roses: total_roses,
        status: true,
        timeStamp: timeNow,
    });

}


const listMyRebate = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    function timerJoin2(params = '') {
        let date = '';
        if (params) {
            date = new Date(Number(params));
        } else {
            date = new Date();
        }
        let years = formateT(date.getFullYear());
        let months = formateT(date.getMonth() + 1);
        let days = formateT(date.getDate());
        return years +'-'+ months +'-'+ days;
    }

    let userInfo = user[0];
    let date = new Date().getTime();
    let checkTime = timerJoin2(date);
    const [todayRebate] = await connection.query('SELECT SUM(dailyInterest) as money FROM users WHERE `phone` = ?  ORDER BY id DESC ', [userInfo.phone]); 
    const [total_roses] = await connection.query('SELECT `money`, `ttime`,`remarks` FROM invitatioBonus WHERE `phone` = ? AND `remarks` = ? ORDER BY id DESC', [userInfo.phone,'Daily Interest']);
    const [total_rebate] = await connection.query('SELECT SUM(money) as money FROM invitatioBonus WHERE `phone` = ? AND `remarks` = ? ORDER BY id DESC', [userInfo.phone,'Daily Interest']);
    let today_rebateBonus = todayRebate[0].money;
    let total_rebateBonus = total_rebate[0].money;
//   console.log(today_rebateBonus);

    return res.status(200).json({
        message: 'Receive success',
        total_roses: total_roses,
        total_rebate: (total_rebateBonus)?total_rebateBonus:0,
        today_rebate: (today_rebateBonus)?today_rebateBonus:0,
        status: true,
        timeStamp: timeNow,
    });

}

const listFundTransferReport = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
    
    const [user] = await connection.query('SELECT `id`, `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    let userId = user[0].id;

    const [fundTransfers] = await connection.query(
        'SELECT `created_at`, `amount`, `status` FROM fund_transfer WHERE `user_id` = ? AND `remarks` = 0 ORDER BY `created_at` DESC', 
        [userId]
    );
    

    return res.status(200).json({
        message: 'Receive success',
        fundTransfers: fundTransfers,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const listGameTransferReport = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
    
    const [user] = await connection.query('SELECT `id`, `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    let userId = user[0].id;

    const [fundTransfers] = await connection.query(
        'SELECT `created_at`, `amount`, `status` FROM fund_transfer WHERE `user_id` = ? AND `remarks` = 1 ORDER BY `created_at` DESC', 
        [userId]
    );
    

    return res.status(200).json({
        message: 'Receive success',
        fundTransfers: fundTransfers,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const claimInterest = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };

    let userInfo = user[0];

    const [todayRebate] = await connection.query('SELECT SUM(dailyInterest) as money FROM users WHERE `phone` = ?  ORDER BY id DESC ', [userInfo.phone]); 
    let unClaimedInterest = todayRebate[0].money;

   if (unClaimedInterest>0) 
   {

    await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [unClaimedInterest, userInfo.phone]);
    await connection.query('UPDATE users SET dailyInterest = ? WHERE phone = ? ', [0, userInfo.phone]);
    return res.status(200).json({
        message: 'Money Transferred',
        status: true,
        timeStamp: timeNow,
    });
   }
   else
   {
    return res.status(200).json({
        message: 'insufficient Interest balance',
        status: true,
        timeStamp: timeNow,
    });
   }


}

const listMyInvation = async(req, res) => {
    try {
        let auth = req.cookies.auth;
        let timeNow = new Date().getTime();

        if(!auth) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
        }

        const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
        if(user.length === 0) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
        }

        let userInfo = user[0];
        const [f1] = await connection.query('SELECT COUNT(*) AS count FROM users WHERE `invite` = ? ORDER BY id DESC', [userInfo.code]);
        const recordCount = (f1.length) ? f1[0].count : 0;

        const [f2] = await connection.query('SELECT phone FROM users WHERE `invite` = ? ORDER BY id DESC', [userInfo.code]);
        const phoneNumbers = f2.map(item => item.phone);

        if (phoneNumbers.length === 0) {
            return res.status(200).json({
                message: 'Receive success',
                direct: recordCount,
                recharge: 0,
                status: true,
                timeStamp: timeNow,
            });
        }

        const placeholders = phoneNumbers.map(() => '?').join(', ');
        const [recharge] = await connection.query(
            `SELECT phone, COUNT(*) AS count FROM recharge WHERE phone IN (${placeholders}) AND money > 499 GROUP BY phone`,
            phoneNumbers
        );

        const rechargeCount = recharge.length;

        return res.status(200).json({
            message: 'Receive success',
            direct: recordCount,
            recharge: rechargeCount,
            status: true,
            timeStamp: timeNow,
        });

    } catch (err) {
        return res.status(500).json({
            message: 'Internal server error',
            status: false,
            timeStamp: new Date().getTime(),
        });
    }
}



const createPayment = async (req, res) => {

    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;

    if(!auth || !money || money < 1) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `name_user`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];

    const paymentOptions = {
      currency1: 'USD', // The cryptocurrency you want to receive
      currency2: typeid, // The currency to convert to (e.g., USD)
      amount: money, // The amount you want to receive
      buyer_email: userInfo.id_user+'@example.com', // Customer's email
      item_name: userInfo.name_user, // Description of the product or service
      item_number:  userInfo.phone, // Unique identifier for the product or service
    };
  
    try {
      const payment = await client.createTransaction(paymentOptions);
      return res.status(200).json({
        message: 'Order created successfully',
        datas: payment,
        status: true,
        timeStamp: timeNow,
    });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const createPayment101 = async (req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let typeid = req.body.typeid;

    if (!auth || !money || money < 1) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    try {
        const [userResult] = await connection.query('SELECT `phone`, `name_user`, `invite` FROM users WHERE `token` = ?', [auth]);
        let userInfo = userResult[0];

        if (!userInfo) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        let walletAddress;
        if (typeid === 'USDT(BEP20)') {
            const [adminResult] = await connection.query('SELECT `bep20` AS wallet_address FROM admin WHERE id = 1');
            walletAddress = adminResult[0].wallet_address;
        } else {
            const [adminResult] = await connection.query('SELECT `trc20` AS wallet_address FROM admin WHERE id = 1');
            walletAddress = adminResult[0].wallet_address;
        }

        return res.status(200).json({
            message: 'Order created successfully',
            datas: {
                amount: money,
                wallet_address: walletAddress,
                user: userInfo
            },
            status: true,
            timeStamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};


function generatePaymentRequest(orderId, amount) {

      // Paytm configurations
      const PAYTM_MERCHANT_KEY = 'BdhgLCbT&#9jwtZD';
      const PAYTM_MERCHANT_ID = 'trTScf72517978386421';
      const PAYTM_WEBSITE = 'WEBSTAGING'; // or 'PROD' for live
      const PAYTM_CALLBACK_URL = 'http://localhost:3000/paytm/callback';

      
    const paytmParams = {
        MID: PAYTM_MERCHANT_ID,
        ORDERID: orderId,
        TXN_AMOUNT: amount,
        CURRENCY: 'INR',
        CHANNEL_ID: 'WEB',
        WEBSITE: PAYTM_WEBSITE,
        INDUSTRY_TYPE_ID: 'Retail',
        CALLBACK_URL: PAYTM_CALLBACK_URL,
    };

    const paytmParamsString = Object.keys(paytmParams).reduce((acc, key) => {
        acc[key] = String(paytmParams[key]);
        return acc;
    }, {});


    return paytm.generateSignature(paytmParamsString, PAYTM_MERCHANT_KEY)
        .then(signature => {
            paytmParams.CHECKSUMHASH = signature;
            return paytmParams;
        });
}

const paymentPage = async(req, res) => {
    let amount = req.body.amount;

    
    return res.render("wallet/payment-page.ejs", { amount: amount }); 
}



const manualPayment = async (req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let txt_utr = req.body.txt_utr;
    let type = req.body.type;
    
    let typeid = req.body.typeid;


    

    if (!auth || !money || money < 100) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [user] = await connection.query('SELECT `phone`, `name_user`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];

    // Check if userInfo is correctly fetched
    if (!userInfo) {
        return res.status(500).json({
            message: 'User not found',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }



  

    // Determine the currency based on the typeid

    
    let currency;
     currency ='UPI_ID';

    money = Number(money); 
    let amount_in_usdt = Number(money / 90);

    try {
        const currentDateString = new Date().toISOString().split('T')[0];
        let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;
            const sql = `INSERT INTO recharge SET 
                id_order = ?, 
                transaction_id = ?, 
                phone = ?, 
                money = ?, 
                amount_in_usdt = ?, 
                type = ?, 
                status = ?, 
                today = ?, 
                url = ?, 
                time = ?`;


                

            await connection.execute(sql, [
                id_order, txt_utr, userInfo.phone, money, amount_in_usdt, currency, 0, currentDateString,type, Date.now()
            ]);

            return res.status(200).json({
                message: 'Order created successfully',
                status: true,
                timeStamp: new Date().toISOString(),
            });
       



    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
       

};



const createPayment10 = async (req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;


    if (!auth || !money || money < 100) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [user] = await connection.query('SELECT `phone`, `name_user`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];

    // Check if userInfo is correctly fetched
    if (!userInfo) {
        return res.status(500).json({
            message: 'User not found',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }


  if (typeid=="UPI_ID") 
    {

    try {

    //     let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;
    //     const apiKey = '8c54d385819547559b34a1dc7983ab08';
    //     const clientId = '3623948804888181';
    //     const amount = money;
    //     const orderId = id_order;
    //     const salt = 'EJHeW5oJ7Czec'; // replace with your actual salt

    //     // Concatenate parameters
    //     const concatenatedString = `apiKey=${apiKey}~clientId=${clientId}~amount=${amount}~orderId=${orderId}${salt}`;

    //     // Create SHA-256 hash and convert to uppercase
    //     const hash = crypto.createHash('sha256').update(concatenatedString).digest('hex').toUpperCase();

    //     console.log('Concatenated String:', concatenatedString);
    //     console.log('Hash:', hash);

   
    //     const apiUrl = 'https://napay.in/napay-finance-service/api/authenticateByHash';
    //     const postData = {
    //         amount: money,
    //         apiKey: apiKey,
    //         clientId: clientId,
    //         orderId: orderId,
    //         hash: hash,
    //     };

    //     axios.post(apiUrl, postData)
    //     .then(response => {   
    

            
         
    //    let api_token = response.data.api_token;
    //    let id_token = response.data.id_token;


    // // console.log(apiToken);
    // // console.log("Id"+idToken);
    
    // if (!api_token || !id_token) {
    //     throw new Error('Missing api_token or id_token in authentication response');
    //   }
       
    //    const headers = {
    //     'Authorization': `Bearer ${id_token}`,
    //     'api-Authorization': `Bearer ${api_token}`,
    //      'Content-Type': 'application/json'
    //   };


    //     const apiUrl = 'https://napay.in/napay-finance-service/api/upi/initiate-ofcpay-transaction';
    //     const postData = {
    //         amount:money,
    //         customerEmail:'test@gmail.com',
    //         customerMobile:userInfo.phone,
    //         customerName:userInfo.name_user,
    //         orderId:orderId,
    //         transactionRemark:'test payment'
          
    //     };


    //     console.log(postData);
      

    //     axios.post(apiUrl, postData,{ headers: headers }).then(async response => {
    //         if (response.data.msg!="SUCCESS") 
    //         {
    //             return res.status(200).json({
    //                 message: response.data.error,
    //                 status: false,
    //                 timeStamp: timeNow,
    //             })
    //         }   


    //         console.log(response.data);
           
            

    //         const sql = `INSERT INTO recharge SET 
    //         id_order = ?,
    //         transaction_id = ?,
    //         phone = ?,
    //         money = ?,
    //         type = ?,
    //         status = ?,
    //         today = ?,
    //         url = ?,
    //         time = ?`; 
    //         await connection.execute(sql, [response.data.data.orderId,response.data.data.txnId, userInfo.phone, money, type, 0, checkTime, '0', time]);
    //         return res.status(200).json({
    //             message: 'Order created successfully',
    //             datas: response.data.data,
    //             status: true,
    //             manualType:0,
    //             timeStamp: timeNow,
    //         });

    //     })
    //     .catch(error => {
    //         return res.status(200).json({
    //             message: 'Failed',
    //             status: false,
    //             timeStamp: timeNow,
    //         })
    //     });

            

    //     })
    //     .catch(error => {
    //         return res.status(200).json({
    //             message: 'Failed',
    //             status: false,
    //             timeStamp: timeNow,
    //         })
    //     });
                        
      
      
    } catch (error) {

        console.log(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
        
    }
    else
    {
     


    // Determine the currency based on the typeid
    let currency;
    if (typeid === 'USDT(BEP20)') {
        currency = 'USDT_BSC';
    } else {
        currency = 'USDT_TRX';
    }

    money = Number(money); 
    let amount_in_usdt = Number(money / 90);


    const paymentOptions = {
        source_currency: 'USD', // The currency you want to receive
        source_amount: amount_in_usdt.toString(), // The amount you want to receive
        order_number: `${Date.now()}`, // Unique order number
        currency: currency, // The currency type
        email: userInfo.phone + '@example.com', // Customer's email
        order_name: userInfo.name_user, // Description of the product or service
        callback_url: 'https://playflix.live/api/webapi/handlePlisioCallback?json=true', // Your callback URL 
        api_key: 'WyrmxIT3Foj0uygOqx6CNdh1AMyV5pPzjOIHUhHphSB7WVgNLjkA_7KFIcxhqQ3_', // Your Plisio API key
    };

    const queryString = qs.stringify(paymentOptions);
    const apiURL = `https://plisio.net/api/v1/invoices/new?${queryString}`;

    try {
        const response = await axios.get(apiURL);
       
        const payment = response.data;
        // console.log(payment.data);
        if (payment.status === 'success') {
            const clientTransactionId = payment.data.txn_id;
            const invoice = payment.data.id;
            const currentDateString = new Date().toISOString().split('T')[0];

            // Check all variables before executing SQL
            if (!invoice || !clientTransactionId || !userInfo.phone || !money || !typeid || !payment.data.invoice_url) {
                return res.status(500).json({
                    message: 'Internal Server Error: Missing data for SQL insert',
                    status: false,
                    timeStamp: new Date().toISOString(),
                });
            }

           

        // console.log(money);

            const sql = `INSERT INTO recharge SET 
                id_order = ?, 
                transaction_id = ?, 
                phone = ?, 
                money = ?, 
                amount_in_usdt = ?, 
                type = ?, 
                status = ?, 
                today = ?, 
                url = ?, 
                time = ?`;

            await connection.execute(sql, [
                invoice, clientTransactionId, userInfo.phone, money, amount_in_usdt, typeid, 0, currentDateString, payment.data.invoice_url, Date.now()
            ]);

            return res.status(200).json({
                message: 'Order created successfully',
                datas: payment.data,
                paymentType: "CRYPTO",
                status: true,
                timeStamp: new Date().toISOString(),
            });
        } else {
            return res.status(200).json({
                message: 'Failed to create order',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }





    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
       
}
};




const handlePlisioCallback = async (req, res) => {
    try {
        
        
          const result = JSON.stringify(req.body);
         const response = req.body;

   
        if (!response) {
            return res.status(400).send('Invalid request');
        }
        await connection.query('INSERT INTO activities (data) VALUES (?)', [result], (err) => {
            if (err) throw err;
          });

        const {
            order_number,
            status,
            source_amount,
            txn_id,
            order_name,
            invoice_total_sum
        } = response;

        console.log(status);

        if (status === "completed" || (status === "mismatch" && source_amount >= invoice_total_sum)) 
            {
            const [info] = await connection.query('SELECT * FROM recharge WHERE id_order = ?', [txn_id]);
            const rechargeInfo = info[0];

            if (rechargeInfo) 
                { 

                 await connection.query('UPDATE recharge SET status = 1 WHERE phone = ? AND id_order = ?', [rechargeInfo.phone, txn_id]);
                await connection.query('UPDATE users SET money = money + ?, total_money = total_money + ? WHERE phone = ?', 
                [rechargeInfo.money, rechargeInfo.money, rechargeInfo.phone]);
                
                const [rowCount] = await connection.query('SELECT COUNT(*) as count FROM recharge WHERE phone = ? AND status = ?', 
                [rechargeInfo.phone, 1]);
                if (rowCount[0].count === 1) {
                    await directBonus(rechargeInfo.money, rechargeInfo.phone);
                }
    
                await userBonus(rechargeInfo.money, rechargeInfo.phone);

                const checkTime = new Date().toISOString().slice(0, 10);
                console.log(checkTime);
                const [sumResult] = await connection.query(
                    'SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND status = 1 AND DATE(today) = ?',
                    [rechargeInfo.phone, checkTime]
                );
    
                 let  sunInfo=sumResult[0];
                 if(sunInfo)
                    {
                    let sumOfRecharge = sunInfo.sumOfRecharge;
                    if (sumOfRecharge >= 500) {
                        await rechargeBonus(rechargeInfo.phone, sumOfRecharge);
                    }
            
                    }
            
                    
            }
           
        }

        res.status(200).json({message: 'Callback handled successfully'});
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Internal Server Error');
    }
};


const PaytmCallback = async (req, res) => {
    try {
        
        console.log('Callback received:', req.body);


        res.status(200).json({message: 'Callback handled successfully'});
        } catch (error) {
            console.error('Error verifying checksum:', error);
            console.error('Callback error:', error);
            res.status(500).send('Internal Server Error');
        }
};



const rechargeCancel = async(req, res) => {
    let auth = req.cookies.auth;
    let id = req.body.id;
    let currency = req.body.currency;
    let type = req.body.type;


    const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    if (type == 'cancel') {
        await connection.query('UPDATE recharge SET status = 2 WHERE phone = ? AND id_order = ? AND status = ?', [userInfo.phone, id, 0]);
        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            timeStamp: new Date().toISOString(),
        });
    }

     if (type == 'success') 
        {


        if (currency=="UPI") 
            {

                
            }
            else
            {

            const [info] = await connection.query('SELECT * FROM recharge WHERE id_order = ? AND status = ?', [id,1]);
            const rechargeInfo = info[0];
            // console.log(rechargeInfo);
            if (rechargeInfo)        
                {
                return res.status(200).json({
                    message: 'Recharge successfully',
                    status: true,
                    timeStamp: new Date().toISOString(),
                }); 

                    
            }
            else
            {
                return res.status(200).json({
                    message: '',
                    status: true,
                    timeStamp: new Date().toISOString(),
                });   
            }

        }
        }
         
   
}


const rechargeBonus = async (phone, sumOfRecharge) => {
    let bonus = 0;

    if (sumOfRecharge >= 500 && sumOfRecharge < 5000) {
        bonus = 5;
    } else if (sumOfRecharge >= 5000 && sumOfRecharge < 50000) {
        bonus = 50;
    } else if (sumOfRecharge >= 50000 && sumOfRecharge < 100000) {
        bonus = 500;
    } else if (sumOfRecharge >= 100000 && sumOfRecharge < 200000) {
        bonus = 1000;
    } else if (sumOfRecharge >= 200000) {
        bonus = 2000;
    }

    if (bonus > 0) {
        const [userResult] = await connection.query('SELECT `id` FROM users WHERE phone = ?', [phone]);
        let user = userResult[0];

        if (!user) {
            throw new Error('User not found');
        }

        const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES (?, ?, ?, ?, ?)`;
        await connection.execute(sql, [user.id, sumOfRecharge, bonus, 'Daily Recharge Bonus', phone]);

        // Update the user's money with the bonus
        await connection.query('UPDATE users SET money = money + ? WHERE id = ?', [bonus, user.id]);
    }
};

const directBonus = async (money, phone) => {
    try {
        console.log('Starting directBonus function');

        // Select the user where phone column matches with phone parameter
        const [userResult] = await connection.query('SELECT `id`, `invite` FROM users WHERE phone = ?', [phone]);
        let user = userResult[0];

        if (!user) {
            console.log('User not found with phone:', phone);
           return true;
        }
        console.log('User found:', user);

        // Get the invite code from the user
        let invite = user.invite;

        // Select the sponsor where code matches the invite code
        const [sponsorResult] = await connection.query('SELECT `id`, `money` FROM users WHERE code = ?', [invite]);
        let sponsor = sponsorResult[0];

        if (!sponsor) {
            console.log('Sponsor not found with invite code:', invite);
            return true;
        }


        console.log('Sponsor found:', sponsor);

        // Calculate the bonus
        let bonus = 0;
        if (money >= 1000 && money < 3000) {
            bonus = 50;
        } else if (money >= 5000 && money < 10000) {
            bonus = 200;
        } else if (money >= 10000 && money < 25000) {
            bonus = 400;
        }
        console.log('Calculated bonus:', bonus);

        if (bonus > 0) {
            // Insert data into incomes table
            const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES (?, ?, ?, ?, ?)`;
            await connection.execute(sql, [sponsor.id, money, bonus, 'Direct Bonus', phone]);
            console.log('Inserted bonus into incomes table for sponsor:', sponsor.id);

            // Update the sponsor's money
            const updateSql = 'UPDATE users SET money = money + ? WHERE id = ?';
            await connection.execute(updateSql, [bonus, sponsor.id]);
            console.log('Updated sponsor money:', sponsor.id);
        } else {
            console.log('No bonus applicable for the amount:', money);
        }
    } catch (error) {
        console.error('Error in directBonusss function:', error);
        return true;
    }
};


const userBonus = async (money, phone) => {
    try {
        console.log('Starting userBonus function');

        // Select the user where phone column matches with phone parameter
        const [userResult] = await connection.query('SELECT `id`, `invite` FROM users WHERE phone = ?', [phone]);
        let user = userResult[0];

        if (!user) {
            console.error('User not found with phone:', phone);
            throw new Error('User not found');
        }
        console.log('User found:', user);

        // Calculate the bonus
        let bonus = 0;
        if (money >= 1000 && money < 3000) {
            bonus = 50;
        } else if (money >= 5000 && money < 10000) {
            bonus = 200;
        } else if (money >= 10000 && money < 25000) {
            bonus = 400;
        }

        else if (money >= 25000) {
            bonus = 400;
        }

        console.log('Calculated bonus:', bonus);

        if (bonus > 0) {
            // Insert data into incomes table
            const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES (?, ?, ?, ?, ?)`;
            await connection.execute(sql, [user.id, money, bonus, 'Recharge Activation Bonus', phone]);
            console.log('Inserted bonus into incomes table for sponsor:', user.id);

            // Update the sponsor's money
            const updateSql = 'UPDATE users SET money = money + ? WHERE id = ?';
            await connection.execute(updateSql, [bonus, user.id]);
            console.log('Updated sponsor money:', user.id);
             return true;
        } else {
            console.log('No bonus applicable for the amount:', money);
        }
    } catch (error) {
        console.error('Error in userBonus function:', error);
        throw error;
    }
};


  const rechargeCoin1 = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;
    let transaction_id = req.body.transaction_id;
    let url = req.body.url;
    let currency = req.body.currency;

    if (type != 'cancel') {
        if (!auth || !money || money < 1.11) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }
    }

    const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    if (type == 'cancel') {
        await connection.query('UPDATE recharge SET status = 2 WHERE phone = ? AND id_order = ? AND status = ?', [userInfo.phone, typeid, 0]);
        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            timeStamp: new Date().toISOString(),
        });
    }

    let time = new Date().getTime();
    const date = new Date();
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
        return years + '-' + months + '-' + days;
    }

    let checkTime = timerJoin(time);
    let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
    let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) + 10000000000000;
    let amount_in_usdt = Number(money);
    money = Number(money * 90);
    let client_transaction_id = id_time + id_order;

    // Check if this is the first recharge for this phone
    const [rowCount] = await connection.query('SELECT COUNT(*) as count FROM recharge WHERE phone = ?', [userInfo.phone]);
    if (rowCount[0].count === 0) {
        await directBonus(money, userInfo.phone);
    }

    const sql = `INSERT INTO recharge SET 
        id_order = ?,
        transaction_id = ?,
        phone = ?,
        money = ?,
        amount_in_usdt = ?,
        type = ?,
        status = ?,
        today = ?,
        url = ?,
        time = ?`;
    await connection.execute(sql, [client_transaction_id, transaction_id, userInfo.phone, money, amount_in_usdt, currency, 0, checkTime, url, time]);

    // Calculate the sum of recharges for the current day where status is 1
    const [sumResult] = await connection.query(
        'SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND status = 1 AND today = ?',
        [userInfo.phone, checkTime]
    );

    let sumOfRecharge = sumResult[0].sumOfRecharge || 0;

    if (sumOfRecharge >= 500) {
        await rechargeBonus(userInfo.phone, sumOfRecharge);
    }

    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ?', [userInfo.phone, 0]);
    return res.status(200).json({
        message: 'Order Submitted successfully',
        datas: recharge[0],
        status: true,
        timeStamp: new Date().toISOString(),
    });
}


const rechargeCoin = async (req, res) => {
    try {
        let auth = req.cookies.auth;
        let money = req.body.money;
        let type = req.body.type;
        let typeid = req.body.typeid;
        let transaction_id = req.body.tx_id;
        let currency = req.body.currency;

        if (!auth || !money || money < 1.11) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        // Check if there is already a transaction with the same transaction_id
        const [existingTransaction] = await connection.query('SELECT COUNT(*) as count FROM recharge WHERE transaction_id = ?', [transaction_id]);
        if (existingTransaction[0].count > 0) {
            return res.status(200).json({
                message: 'Failed as there is already a transaction with this transaction Hash',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
        let userInfo = user[0];
        if (!userInfo) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        let time = new Date().getTime();
        const date = new Date();

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
            return years + '-' + months + '-' + days;
        }

        let checkTime = timerJoin(time);
        let id_time = date.getUTCFullYear() + '' + (date.getUTCMonth() + 1) + '' + date.getUTCDate();
        let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) + 10000000000000;
        let amount_in_usdt = Number(money);
        money = Number(money * 90);
        let client_transaction_id = id_time + id_order;

        const sql = `INSERT INTO recharge SET 
            id_order = ?,
            transaction_id = ?,
            phone = ?,
            money = ?,
            amount_in_usdt = ?,
            type = ?,
            status = ?,
            today = ?,
            time = ?`;
        await connection.execute(sql, [client_transaction_id, transaction_id, userInfo.phone, money, amount_in_usdt, currency, 0, checkTime, time]);

        const [sumResult] = await connection.query(
            'SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND status = 1 AND today = ?',
            [userInfo.phone, checkTime]
        );

        let sumOfRecharge = sumResult[0].sumOfRecharge || 0;

        const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ?', [userInfo.phone, 0]);
        return res.status(200).json({
            message: 'Order Submitted successfully',
            datas: recharge[0],
            status: true,
            timeStamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error processing recharge:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
}





const recharge = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;
    let manualType = req.body.manualType;

    if (type != 'cancel') {
        if(!auth || !money || money < 200) {
        
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            })
        }
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    if (type == 'cancel') {
        await connection.query('UPDATE recharge SET status = 2 WHERE phone = ? AND id_order = ? AND status = ? ', [userInfo.phone, typeid, 0]);
        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            timeStamp: timeNow,
        });
    }
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ? AND type ', [userInfo.phone, 0,'bank']);
    if (recharge.length == 0) {
        let time = new Date().getTime();
        const date = new Date();
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
            return years + '-' + months + '-' + days;
        }
        let checkTime = timerJoin(time);
        let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
        let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;
        // let vat = Math.floor(Math.random() * (2000 - 0 + 1) ) + 0;

        money = Number(money);
        let client_transaction_id = id_time + id_order;
        const formData = {
            username: process.env.accountBank,
            secret_key: process.env.secret_key,
            client_transaction: client_transaction_id,
            amount: money,
        }

//   console.log(manualType);
      if (manualType=="Api") 
      {
     
            const apiUrl = 'https://payin.gamegateway.online/v3/generateToken';
            const postData = {
                userKey: 'KBS2cce4f7216',
                userToken: 'ef6534b8e22e63d31226a5428f9f18df',
            };

            const headers = {
            'Content-Type': 'application/json',
            };

            axios.post(apiUrl, postData, { headers })
            .then(response => {   
              
                if (response.data.status=="FAILED") 
                {
                    return res.status(200).json({
                        message: response.data.error,
                        status: false,
                        timeStamp: timeNow,
                    })
                }

             
           let token = response.data.data.token;

            const apiUrl = 'https://payin.gamegateway.online/v3/generatePaymentLink';
            const postData = {
                userKey: 'KBS2cce4f7216',
                userToken: 'ef6534b8e22e63d31226a5428f9f18df',
                genrateToken:token,
                amount:money,
                option:'INTENT',
                orderId:"FC"+id_order
            };

            const headers = {
            'Content-Type': 'application/json',
            };

           axios.post(apiUrl, postData, { headers }).then(async response => {
                if (response.data.data.status=="FAILED") 
                {
                    return res.status(200).json({
                        message: response.data.error,
                        status: false,
                        timeStamp: timeNow,
                    })
                }              


                const sql = `INSERT INTO recharge SET 
                id_order = ?,
                transaction_id = ?,
                phone = ?,
                money = ?,
                type = ?,
                status = ?,
                today = ?,
                url = ?,
                time = ?`; 
                await connection.execute(sql, [response.data.data.orderId,response.data.data.txnId, userInfo.phone, money, type, 0, checkTime, '0', time]);
                return res.status(200).json({
                    message: 'Order created successfully',
                    datas: response.data.data,
                    status: true,
                    manualType:0,
                    timeStamp: timeNow,
                });

            })
            .catch(error => {
                return res.status(200).json({
                    message: 'Failed',
                    status: false,
                    timeStamp: timeNow,
                })
            });

                

            })
            .catch(error => {
                return res.status(200).json({
                    message: 'Failed',
                    status: false,
                    timeStamp: timeNow,
                })
            });
               
      }
      else
      {

       let  response = {amount: money, orderId: id_order};
        return res.status(200).json({
            message: 'Order created successfully',
            datas: response,
            status: true,
            manualType:1,
            timeStamp: timeNow,
        });


      }


     
    } else {
        return res.status(200).json({
            message: 'Get success',
            datas: recharge[0],
            status: true,
            timeStamp: timeNow,
        });
    }

}


const manualRecharge = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let type = req.body.type;
    let typeid = req.body.typeid;
    let reference_no = req.body.reference_no;

    if (type != 'cancel') {
        if(!auth || !money || money < 200) {
        
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            })
        }
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    if (type == 'cancel') {
        await connection.query('UPDATE recharge SET status = 2 WHERE phone = ? AND id_order = ? AND status = ? ', [userInfo.phone, typeid, 0]);
        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            timeStamp: timeNow,
        });
    }
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ?  AND type = ? AND utr = ? ', [userInfo.phone,'Manual',reference_no]);
    if (recharge.length == 0) {
        let time = new Date().getTime();
        const date = new Date();
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
            return years + '-' + months + '-' + days;
        }
        let checkTime = timerJoin(time);
        let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
        let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;
        // let vat = Math.floor(Math.random() * (2000 - 0 + 1) ) + 0;

        money = Number(money);
        let client_transaction_id = id_time + id_order;
        const formData = {
            username: process.env.accountBank,
            secret_key: process.env.secret_key,
            client_transaction: client_transaction_id,
            amount: money,
        }

                const sql = `INSERT INTO recharge SET 
                id_order = ?,
                transaction_id = ?,
                phone = ?,
                money = ?,
                type = ?,
                status = ?,
                today = ?,
                url = ?,
                utr = ?,
                time = ?`; 
                await connection.execute(sql, [id_order,id_order, userInfo.phone, money, 'Manual', 0, checkTime, '0',reference_no,time]);
                return res.status(200).json({
                    message: 'Order created successfully',
                    datas: money,
                    status: true,
                    manualType:0,
                    timeStamp: timeNow,
                });

     
    } else {
        return res.status(200).json({
            message: 'Get success',
            datas: recharge[0],
            status: true,
            timeStamp: timeNow,
        });
    }

}

const addBank = async (req, res) => {
    let auth = req.cookies.auth;
    let bankName = req.body.bankName;
    let accountName = req.body.accountName;
    let accountNumber = req.body.accountNumber;
    let ifscCode = req.body.ifscCode;
    let usdtBep20 = req.body.usdtBep20;
    let usdttrc20 = req.body.usdttrc20;
    let timeNow = new Date().toISOString();

    // Check if both wallet addresses are missing
    if (!auth) {
        return res.status(200).json({
            message: 'Either one of the wallet addresses is required',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        const [user] = await connection.query('SELECT `phone`, `id` FROM users WHERE `token` = ?', [auth]);
        let userInfo = user[0];

        if (!userInfo) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
        }

        const [existingUserBank] = await connection.query('SELECT * FROM user_bank WHERE phone = ? ', [userInfo.phone]);

        if (existingUserBank.length === 0) {
            // No existing wallet info, insert new record
            let time = new Date().getTime();
            const sql = `INSERT INTO user_bank SET 
            phone = ?,
            usdtBep20 = ?,
            usdttrc20 = ?,
            name_bank = ?,
            name_user = ?,
            account_number = ?,
            ifsc_code =?,
            time = ?`;

            const params = [
                userInfo.phone || null, 
                usdtBep20 || null, 
                usdttrc20 || null, 
                bankName || null, 
                accountName || null, 
                accountNumber || null, 
                ifscCode || null, 
                time || null
            ];
            
            await connection.execute(sql, params);
            return res.status(200).json({
                message: 'Added successfully',
                status: true,
                timeStamp: timeNow,
            });
        } else {
            // Existing wallet info found, update if necessary
            let updateFields = [];
            let updateValues = [];
            if (usdtBep20 && !existingUserBank[0].usdtBep20) {
                updateFields.push('usdtBep20 = ?');
                updateValues.push(usdtBep20);
            }
            if (usdttrc20 && !existingUserBank[0].usdttrc20) {
                updateFields.push('usdttrc20 = ?');
                updateValues.push(usdttrc20);
            }
            if (bankName && !existingUserBank[0].name_bank) {
                updateFields.push('name_bank = ?');
                updateValues.push(bankName);
            }

            if (accountName && !existingUserBank[0].name_user) {
                updateFields.push('name_user = ?');
                updateValues.push(accountName);
            }
            if (accountNumber && !existingUserBank[0].account_number) {
                updateFields.push('account_number = ?');
                updateValues.push(accountNumber);
            }
            if (ifscCode && !existingUserBank[0].ifsc_code) {
                updateFields.push('ifsc_code = ?');
                updateValues.push(ifscCode);
            }

            if (updateFields.length > 0) {
                updateValues.push(userInfo.phone);
                const sql = `UPDATE user_bank SET ${updateFields.join(', ')} WHERE phone = ?`;
                await connection.execute(sql, updateValues);
                return res.status(200).json({
                    message: 'Updated crypto addresses successfully',
                    status: true,
                    timeStamp: timeNow,
                });
            } else {
                return res.status(200).json({
                    message: 'The account has already been linked to the bank with the provided addresses',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            message: 'An error occurred while processing your request',
            status: false,
            timeStamp: timeNow,
        });
    }
}





const infoUserBank = async(req, res) => {
    let auth = req.cookies.auth;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite`, `win_wallet`,`money` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
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
        return years + '-' + months + '-' + days;
    }
    let date = new Date().getTime();
    let checkTime = timerJoin(date);
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND today = ? AND status = 1 ', [userInfo.phone, checkTime]); 
    const [minutes_1] = await connection.query('SELECT * FROM minutes_1 WHERE phone = ? AND today = ? ', [userInfo.phone, checkTime]); 
    let total = 0;
    recharge.forEach((data) => {
        total += data.money;
    });
    let total2 = 0;
    minutes_1.forEach((data) => {
        total2 += data.money;
    });

    let result = 0;
    if(total - total2 > 0) result = total - total2;


    const [withdrawn] = await connection.query(
        'SELECT SUM(money) AS money FROM withdraw WHERE status = 1 AND phone = ?',
        [userInfo.phone]
    );

    const totalwithdrawn = withdrawn[0].money || 0;
    const [userBank] = await connection.query('SELECT * FROM user_bank WHERE phone = ? ', [userInfo.phone]); 
    return res.status(200).json({
        message: 'Get success',
        datas: userBank,
        userInfo: user,
        withdrawn: totalwithdrawn,
        result: result,
        status: true,
        timeStamp: timeNow,
    });
}

const withdrawal3 = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    let password = req.body.password;
    if(!auth || !money || !password || money < 200) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite`, `money` FROM users WHERE `token` = ? AND password = ?', [auth, md5(password)]);

    if(user.length == 0) {
        return res.status(200).json({
            message: 'incorrect password',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    const date = new Date();
    let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
    let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1) ) + 10000000000000;

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
        return years + '-' + months + '-' + days;
    }
    let dates = new Date().getTime();
    let checkTime = timerJoin(dates);
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND today = ? AND status = 1 ', [userInfo.phone, checkTime]); 
    const [minutes_1] = await connection.query('SELECT * FROM minutes_1 WHERE phone = ? AND today = ? ', [userInfo.phone, checkTime]); 
    let total = 0;
    recharge.forEach((data) => {
        total += data.money;
    });
    let total2 = 0;
    minutes_1.forEach((data) => {
        total2 += data.money;
    });

    let result = 0;
    if(total - total2 > 0) result = total - total2;
    
    const [user_bank] = await connection.query('SELECT * FROM user_bank WHERE `phone` = ?', [userInfo.phone]);
    const [withdraw] = await connection.query('SELECT * FROM withdraw WHERE `phone` = ? AND today = ?', [userInfo.phone, checkTime]);
    if (user_bank.length != 0) {
        if (withdraw.length < 3) {
            if (userInfo.money - money >= 0) {
                if (result == 0) {
                    let infoBank = user_bank[0];
                    const sql = `INSERT INTO withdraw SET 
                    id_order = ?,
                    phone = ?,
                    money = ?,
                    account_number = ?,
                    name_bank = ?,
                    ifsc_code = ?,
                    name_user = ?,
                    status = ?,
                    today = ?,
                    time = ?`;
                    await connection.execute(sql, [id_time + '' + id_order, userInfo.phone, money, infoBank.account_number, infoBank.name_bank,infoBank.ifsc_code, infoBank.name_user, 0, checkTime, dates]);
                    await connection.query('UPDATE users SET money = money - ? WHERE phone = ? ', [money, userInfo.phone]);
                    return res.status(200).json({
                        message: 'Withdraw money successfully',
                        status: true,
                        money: userInfo.money - money,
                        timeStamp: timeNow,
                    });
                } else {
                    return res.status(200).json({
                        message: 'The total bet amount is not enough to fulfill the request',
                        status: false,
                        timeStamp: timeNow,
                    });
                }
            } else {
                return res.status(200).json({
                    message: 'Insufficient balance to fulfill the request',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        } else {
            return res.status(200).json({
                message: 'You can only make 3 withdrawals per day',
                status: false,
                timeStamp: timeNow,
            });
        }
    } else {
        return res.status(200).json({
            message: 'Please link your bank first',
            status: false,
            timeStamp: timeNow,
        });
    }

}

const fundTransfer = async (req, res) => {
    const auth = req.cookies.auth;
    const amount = parseFloat(req.body.amount); // Ensure amount is a number
    const password = req.body.password;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!auth || !amount || !password || amount <= 0) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    // Check user authentication and password
    const [user] = await connection.query(
        'SELECT `id`, `phone`, `money`, `ai_balance` FROM users WHERE `token` = ? AND password = ?',
        [auth, md5(password)]
    );

    if (user.length == 0) {
        return res.status(200).json({
            message: 'Incorrect password',
            status: false,
            timeStamp: timeNow,
        });
    }

    let userInfo = user[0];

    // Check if user has sufficient balance
    if (parseFloat(userInfo.money) < amount) {
        console.log('Insufficient balance check failed');
        return res.status(200).json({
            message: 'Insufficient balance to fulfill the request',
            status: false,
            timeStamp: timeNow,
        });
    }

    // Check if this is the first recharge for this phone
    const [rowCount] = await connection.query('SELECT COUNT(*) as count FROM fund_transfer WHERE user_id = ? AND remarks = 0', [userInfo.id]);
    // if (rowCount[0].count === 0) {
        await directBonus(amount, userInfo.phone); // Assuming you want to call directBonus with the amount
    // }

    // Insert the transfer details into fund_transfer table
    const sql = `INSERT INTO fund_transfer SET 
        user_id = ?, 
        amount = ?, 
        status = ?, 
        created_at = ?,    
        updated_at = ?,
        remarks = ?`;
    await connection.execute(sql, [userInfo.id, amount, 'active', timeNow, timeNow, 0]);

    // Update the user's balance
    await connection.query('UPDATE users SET money = money - ?, ai_balance = ai_balance + ? WHERE id = ?', [amount, amount, userInfo.id]);

    return res.status(200).json({
        message: 'Fund transfer successful',
        status: true,
        balance: parseFloat(userInfo.money) - amount,
        ai_balance: parseFloat(userInfo.ai_balance) + amount,
        timeStamp: timeNow,
    });
}



const fundTransferGame = async (req, res) => {
    const auth = req.cookies.auth;


    const [user] = await connection.query('SELECT `id`, `phone`, `code`,`invite`, `win_wallet`,`money` FROM users WHERE `token` = ? ', [auth]);
    if (user.length == 0) {
        return res.status(200).json({
            message: 'Incorrect user',
            status: false,
            timeStamp: timeNow,
        });
    }

    let userInfo = user[0];
    

    const amount = parseFloat(userInfo.win_wallet); // Ensure amount is a number
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!auth || !amount || amount <= 0) {
        return res.status(200).json({
            message: 'Insufficient Balance',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        // Check user authentication and password

        // Check if user has sufficient balance
        if (parseFloat(userInfo.win_wallet) < amount) {
            return res.status(200).json({
                message: 'Insufficient balance to fulfill the request',
                status: false,
                timeStamp: timeNow,
            });
        }


       

        // Update the user's balance
        await connection.query('UPDATE users SET win_wallet = win_wallet - ?, money = money + ? WHERE id = ?', [amount, amount, userInfo.id]);
        
        let updatedMoney = parseFloat(userInfo.money) + parseFloat(amount);
        let balance = parseFloat(userInfo.win_wallet) - parseFloat(amount);

        return res.status(200).json({
            message: 'Fund transfer successful',
            status: true,
            balance: balance,
            money: updatedMoney,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.error('Error during fund transfer:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: false,
            timeStamp: timeNow,
        });
    }
};


const withdrawal4 = async (req, res) => {
    let auth = req.cookies.auth;
    let money = parseFloat(req.body.money);
    let paymentMode = req.body.paymentMode;
    let password = req.body.password;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    console.log('Payment Mode:', paymentMode);
    console.log('Money:', money);
    console.log('Auth:', auth);
    console.log('Password:', password);

    if (!auth || !paymentMode || !money  || money < 10) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [user] = await connection.query(
        'SELECT `phone`, `code`, `invite`, `money`, `win_wallet` FROM users WHERE `token` = ? ',
        [auth]
    );

    if (user.length === 0) {
        return res.status(200).json({
            message: 'User Not found',
            status: false,
            timeStamp: timeNow,
        });
    }

    let userInfo = user[0];
    console.log('User Info:', userInfo);

    const date = new Date();
    let id_time = date.getUTCFullYear() + '' + (date.getUTCMonth() + 1) + '' + date.getUTCDate();
    let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) + 10000000000000;

    function formatT(params) {
        return params < 10 ? "0" + params : params;
    }

    function timerJoin(params = '') {
        let date = params ? new Date(Number(params)) : new Date();
        let years = formatT(date.getFullYear());
        let months = formatT(date.getMonth() + 1);
        let days = formatT(date.getDate());
        return `${years}-${months}-${days}`;
    }

    let dates = new Date().getTime();
    let checkTime = timerJoin(dates);

    const [user_bank] = await connection.query('SELECT * FROM user_bank WHERE `phone` = ?', [userInfo.phone]);
    const [withdraw] = await connection.query('SELECT * FROM withdraw WHERE `phone` = ? AND today = ?', [userInfo.phone, checkTime]);

    if (user_bank.length !== 0) {
        let wallet = '';
        if (paymentMode === 'USDT(BEP20)') {
            wallet = user_bank[0].usdtBep20;
        } else if(paymentMode === 'USDT(BEP20)') 
            {
            wallet = user_bank[0].usdttrc20;
        }
        else
        {
            wallet = user_bank[0].account_number;  
        }

        if (wallet === '') {
            return res.status(200).json({
                message: 'Please link your Bank Account & Crypto Wallet',
                status: false,
                timeStamp: timeNow,
            });
        }

        if (withdraw.length < 3) {
            if (userInfo.win_wallet - money >= 0) {
                let infoBank = user_bank[0];
                const sql = `INSERT INTO withdraw SET 
                    id_order = ?,
                    phone = ?,
                    money = ?,
                    account_number = ?,
                    name_bank = ?,
                    ifsc_code = ?,
                    name_user = ?,
                    status = ?,
                    today = ?,
                    amount_in_usd = ?,
                    wallet = ?,
                    walletType = ?,
                    time = ?`;
                await connection.execute(sql, [
                    id_time + '' + id_order,
                    userInfo.phone,
                    money,
                    infoBank.account_number,
                    infoBank.name_bank,
                    infoBank.ifsc_code,
                    infoBank.name_user,
                    0,
                    checkTime,
                    money / 90,
                    wallet,
                    paymentMode,
                    dates
                ]);
                await connection.query('UPDATE users SET win_wallet = win_wallet - ? WHERE phone = ?', [money, userInfo.phone]);
                return res.status(200).json({
                    message: 'Withdraw money successfully',
                    status: true,
                    money: userInfo.win_wallet - money,
                    timeStamp: timeNow,
                });
            } else {
                return res.status(200).json({
                    message: 'Insufficient balance to fulfill the request',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        } else {
            return res.status(200).json({
                message: 'You can only make 3 withdrawals per day',
                status: false,
                timeStamp: timeNow,
            });
        }
    } else {
        return res.status(200).json({
            message: 'Please link your bank first',
            status: false,
            timeStamp: timeNow,
        });
    }
};




const recharge2 = async(req, res) => {
    let auth = req.cookies.auth;
    let money = req.body.money;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ? AND type ', [userInfo.phone, 0,'bank']);
    const [bank_recharge] = await connection.query('SELECT * FROM bank_recharge ');
    if (recharge.length != 0) {
        console.log("hi");
        return res.status(200).json({
            message: 'Get success',
            datas: recharge[0],
            infoBank: bank_recharge,
            status: true,
            timeStamp: timeNow,
        });
    } else {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

}


const checkRechargeStatus = async(req, res) => {
    let auth = req.cookies.auth;
    let orderId = req.body.orderId;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ? AND id_order = ? ', [userInfo.phone, 1,orderId]);
    if (recharge.length != 0) {
        return res.status(200).json({
            message: 'recharge success',
            datas: recharge[0],
            status: true,
            timeStamp: timeNow,
        });
    } else {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

}

const listRecharge = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
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

    const [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC LIMIT ? OFFSET ?', [userInfo.phone, limit, offset]);
    const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM recharge WHERE phone = ?', [userInfo.phone]);

    return res.status(200).json({
        message: 'Get success',
        datas: recharge,
        status: true,
        timeStamp: timeNow,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    });
};


const search = async(req, res) => {
    let auth = req.cookies.auth;
    let phone = req.body.phone;
    if(!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `id_user`, `code`,`invite`, `level` FROM users WHERE `token` = ? ', [auth]);
    if(user.length == 0) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    let userInfo = user[0];
    if (userInfo.level == 1) {
        const [users] = await connection.query(`SELECT * FROM users WHERE id_user = ? ORDER BY id DESC `, [phone]);
        return res.status(200).json({
            message: 'Get success',
            datas: users,
            status: true,
            timeStamp: timeNow,
        });
    } else if (userInfo.level == 2) {
        const [users] = await connection.query(`SELECT * FROM users WHERE id_user = ? ORDER BY id DESC `, [phone]);
        if (users.length == 0) {
            return res.status(200).json({
                message: 'Get success',
                datas: [],
                status: true,
                timeStamp: timeNow,
            });
        } else {
            if (users[0].ctv == userInfo.phone) {
                return res.status(200).json({
                    message: 'Get success',
                    datas: users,
                    status: true,
                    timeStamp: timeNow,
                });
            } else {
                return res.status(200).json({
                    message: 'Failed',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        }
    } else {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }
}

const searchRecharge = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date(), // Corrected timeNow to new Date()
        });
    }

    const { uid } = req.body;

    // Fetch the user's phone number using the uid
    const [userResult] = await connection.query('SELECT phone FROM users WHERE id_user = ?', [uid]);

    if (userResult.length === 0) {
        return res.status(200).json({
            message: 'User not found',
            status: false,
            timeStamp: new Date(), // Corrected timeNow to new Date()
        });
    }

    const userPhone = userResult[0].phone;

    const [recharge] = await connection.query(`
        SELECT recharge.*, users.id_user 
        FROM recharge 
        LEFT JOIN users ON recharge.phone = users.phone 
        WHERE recharge.status = 0 AND recharge.type != "Manual" AND recharge.phone = ?
    `, [userPhone]);

    const [rechargeManual] = await connection.query(`
        SELECT recharge.*, users.id_user 
        FROM recharge 
        LEFT JOIN users ON recharge.phone = users.phone 
        WHERE recharge.status = 0 AND recharge.type = "Manual" AND recharge.phone = ?
    `, [userPhone]);

    const [recharge2] = await connection.query(`
        SELECT recharge.*, users.id_user 
        FROM recharge 
        LEFT JOIN users ON recharge.phone = users.phone 
        WHERE recharge.status != 0 AND recharge.phone = ?
    `, [userPhone]);

    const [withdraw] = await connection.query(`
        SELECT withdraw.*, users.id_user 
        FROM withdraw 
        LEFT JOIN users ON withdraw.phone = users.phone 
        WHERE withdraw.status = 0 AND withdraw.phone = ?
    `, [userPhone]);

    const [withdraw2] = await connection.query(`
        SELECT withdraw.*, users.id_user 
        FROM withdraw 
        LEFT JOIN users ON withdraw.phone = users.phone 
        WHERE withdraw.status != 0 AND withdraw.phone = ?
    `, [userPhone]);

    const [withdrawCrypto] = await connection.query(`
        SELECT withdraw.*, users.id_user 
        FROM withdraw 
        LEFT JOIN users ON withdraw.phone = users.phone 
        WHERE withdraw.status = 0 AND withdraw.walletType != "INR" AND withdraw.phone = ?
    `, [userPhone]);

    return res.status(200).json({
        message: 'Success',
        status: true,
        datas1: rechargeManual,
        datas: recharge,
        datas2: recharge2,
        datas3: withdraw,
        datas4: withdraw2,
        withdrawCrypto: withdrawCrypto,
    });
};



const listWithdraw = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
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

    const [recharge] = await connection.query('SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC LIMIT ? OFFSET ?', [userInfo.phone, limit, offset]);
    const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM withdraw WHERE phone = ?', [userInfo.phone]);

    return res.status(200).json({
        message: 'Get success',
        datas: recharge,
        status: true,
        timeStamp: timeNow,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    });
};


const useRedenvelope = async(req, res) => {
    let auth = req.cookies.auth;
    let code = req.body.code;
    if(!auth || !code) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })
    }
    const [user] = await connection.query('SELECT `phone`, `code`,`invite` FROM users WHERE `token` = ? ', [auth]);
    let userInfo = user[0];
    if(!user) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    };
    const [redenvelopes] = await connection.query(
        'SELECT * FROM redenvelopes WHERE id_redenvelope = ?', [code]);

    const [userredenvelopes] = await connection.query(
            'SELECT * FROM redenvelopes_used WHERE id_redenvelops = ? AND phone_used = ?', [code,userInfo.phone]);
        
    if (redenvelopes.length == 0) {
        return res.status(200).json({
            message: 'Redemption code error',
            status: false,
            timeStamp: timeNow,
        });
    } else {
        let infoRe = redenvelopes[0];
        const d = new Date();
        const time = d.getTime();
        if (infoRe.status == 0 && userredenvelopes.length==0) {
            await connection.query('UPDATE users SET money = money + ? WHERE `phone` = ? ', [infoRe.money, userInfo.phone]); 
            let sql = 'INSERT INTO redenvelopes_used SET phone = ?, phone_used = ?, id_redenvelops = ?, money = ?, `time` = ? ';
            await connection.query(sql, [infoRe.phone, userInfo.phone, infoRe.id_redenvelope, infoRe.money, time]); 
            return res.status(200).json({
                message: `Get success +${infoRe.money}`,
                status: true,
                timeStamp: timeNow,
            });
        } else {
            return res.status(200).json({
                message: 'Gift code has been used',
                status: false,
                timeStamp: timeNow,
            });
        }
    }
}

const callback_bank = async(req, res) => {
    let transaction_id = req.body.transaction_id;
    let client_transaction_id = req.body.client_transaction_id;
    let amount = req.body.amount;
    let requested_datetime = req.body.requested_datetime;
    let expired_datetime = req.body.expired_datetime;
    let payment_datetime = req.body.payment_datetime;
    let status = req.body.status;
    if(!transaction_id) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        })  
    }
    if (status == 2) {
        await connection.query(`UPDATE recharge SET status = 1 WHERE id_order = ?`, [client_transaction_id]);
        const [info] = await connection.query(`SELECT * FROM recharge WHERE id_order = ?`, [client_transaction_id]);
        await connection.query('UPDATE users SET money = money + ?, total_money = total_money + ? WHERE phone = ? ', [info[0].money, info[0].money, info[0].phone]);
        return res.status(200).json({
            message: 0,
            status: true,
        });
    } else {
        await connection.query(`UPDATE recharge SET status = 2 WHERE id = ?`, [id]);

        return res.status(200).json({
            message: 'Order canceled successfully',
            status: true,
            datas: recharge,
        });
    }
}

const getAIBonus = async (req, res) => {
    let auth = req.cookies.auth;

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
        });
    }

    const [user] = await connection.query('SELECT `id`,`phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);

    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
        });
    }

    let userInfo = user[0];

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [aiBonus] = await connection.query('SELECT `stage`, `bet`, `comm`, `created_at` FROM incomes WHERE `user_id` = ? AND `remarks` = "AI bonus" ORDER BY `created_at` DESC LIMIT ? OFFSET ?', [userInfo.id, limit, offset]);
    const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM incomes WHERE `user_id` = ? AND `remarks` = "AI bonus"', [userInfo.id]);

    return res.status(200).json({
        message: 'Success',
        aiBonus: aiBonus,
        total: total,
        status: true,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    });
};



const getAIBalance = async (req, res) => {
    let auth = req.cookies.auth;

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    try {
        // Query to get the user ID and ai_balance based on the auth token
        const [userRows] = await connection.query('SELECT id, ai_balance FROM users WHERE `token` = ?', [auth]);

        if (userRows.length === 0) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const userId = userRows[0].id;
        const ai_balance = userRows[0].ai_balance;

        // Query to get totalAi
        const [totalAiRows] = await connection.query(
            'SELECT SUM(comm) AS totalAi FROM incomes WHERE remarks = "AI bonus" AND user_id = ?',
            [userId]
        );

        const totalAi = totalAiRows[0].totalAi || 0;

        // Query to get totalLevelAI
        const [totalLevelAiRows] = await connection.query(
            'SELECT SUM(comm) AS totalLevelAi FROM incomes WHERE remarks = "AI Return Bonus" AND user_id = ?',
            [userId]
        );

        const totalLevelAi = totalLevelAiRows[0].totalLevelAi || 0;

        return res.status(200).json({
            message: 'Success',
            status: true,
            ai_balance: ai_balance,
            totalAi: totalAi,
            totalLevelAi: totalLevelAi,
            timeStamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching AI balance:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};

const rebate = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
        const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
        let userInfo = user[0];

        if (!userInfo) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
        }

        const userPhone = userInfo.phone;
        const userId = userInfo.id;

        // Sum money in minutes_1 table
        const [minutesResult] = await connection.query(
            'SELECT SUM(money) as total_minutes FROM minutes_1 WHERE phone = ? AND id > 52350',
            [userPhone]
        );
        const totalMinutes = minutesResult[0].total_minutes || 0;

        // Sum money in result_k3 table
        const [resultK3Result] = await connection.query(
            'SELECT SUM(money) as total_result_k3 FROM result_k3 WHERE phone = ? AND id > 573',
            [userPhone]
        );
        const totalResultK3 = resultK3Result[0].total_result_k3 || 0;

        // Sum money in result_5d table
        const [result5DResult] = await connection.query(
            'SELECT SUM(money) as total_result_5d FROM result_5d WHERE phone = ? AND id > 10',
            [userPhone]
        );
        const totalResult5D = result5DResult[0].total_result_5d || 0;

        // Calculate total bet
        const totalBet = totalMinutes + totalResultK3 + totalResult5D;

        // Sum amount in incomes table with remarks 'Self Trading Bonus'
        const [incomeResult] = await connection.query(
            'SELECT SUM(amount) as total_income FROM incomes WHERE user_id = ? AND remarks = "Self Trading Bonus"',
            [userId]
        );
        const totalIncome = incomeResult[0].total_income || 0;

        const [incomeRecieve] = await connection.query(
            'SELECT SUM(comm) as total_rec FROM incomes WHERE user_id = ? AND remarks = "Self Trading Bonus"',
            [userId]
        );

        const total_rec = incomeRecieve[0].total_rec || 0;


        // Calculate net amount
        const netAmount = totalBet - totalIncome;

        // Calculate bonus
        const bonus = netAmount * 0.003;

        // Return response with the calculated values
        return res.status(200).json({
            message: 'Success',
            status: true,
            timeStamp: timeNow,
            bonus: bonus,
            netAmount: netAmount,
            totalBet: totalBet,
            totalIncome: totalIncome,
            totalRec:total_rec
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: timeNow,
        });
    }
};


const attendanceBonus = async (req, res) => {
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0];

    const [attendanceResult] = await connection.query('SELECT attendance FROM users WHERE phone = ?', [userInfo.phone]);
    let attendance = attendanceResult[0].attendance;

    if (attendance >= 7) {
        return res.status(200).json({
            message: 'Failed as you have already claimed all attendance bonus',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    if (attendance === 0) {
        const [sumResult] = await connection.query('SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND today = ? AND status = ?', [userInfo.phone, currentDateString,1]);
        let sumOfRecharge = sumResult[0].sumOfRecharge || 0;

        return checkAttendanceBonusRules(userInfo.phone, attendance + 1, sumOfRecharge, res);
    } else {
        const [lastBonusResult] = await connection.query('SELECT DATE(created_at) as lastBonusDate FROM incomes WHERE remarks = "Attendance Bonus" AND user_id = ? ORDER BY created_at DESC LIMIT 1', [userInfo.id]);
        if (lastBonusResult.length > 0) {
            let lastBonusDate = new Date(lastBonusResult[0].lastBonusDate);
            let dateDifference = Math.floor((currentDate - lastBonusDate) / (1000 * 60 * 60 * 24));

            if (dateDifference === 1) {
                const [sumResult] = await connection.query('SELECT SUM(money) as sumOfRecharge FROM recharge WHERE phone = ? AND today = ? AND status = ?', [userInfo.phone, currentDateString,1]);
                let sumOfRecharge = sumResult[0].sumOfRecharge || 0;

                return checkAttendanceBonusRules(userInfo.phone, attendance + 1, sumOfRecharge, res);
            } else {
                return res.status(200).json({
                    message: 'Failed as not claimed daily',
                    status: false,
                    timeStamp: new Date().toISOString(),
                });
            }
        } else {
            return res.status(200).json({
                message: 'No previous attendance bonus record found',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }
    }
};

const checkAttendanceBonusRules = async (phone, attendance, sumOfRecharge, res) => {
    let bonus = 0;

    // Define the bonus based on attendance and sum of recharge
    if (attendance == 1 && sumOfRecharge >= 300) {
        bonus = 7;
    } else if (attendance == 2 && sumOfRecharge >= 1000) {
        bonus = 20;
    } else if (attendance == 3 && sumOfRecharge >= 3000) {
        bonus = 100;
    } else if (attendance == 4 && sumOfRecharge >= 8000) {
        bonus = 200;
    } else if (attendance == 5 && sumOfRecharge >= 20000) {
        bonus = 450;
    } else if (attendance == 6 && sumOfRecharge >= 80000) {
        bonus = 2400;
    } else if (attendance == 7 && sumOfRecharge >= 200000) {
        bonus = 6400;
    }

    if (bonus === 0) {
        return res.status(200).json({
            message: 'Failed as Attendance Rules not met',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    // Insert data into incomes table
    const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES ((SELECT id FROM users WHERE phone = ?), ?, ?, ?, ?)`;
    await connection.execute(sql, [phone, sumOfRecharge, bonus, 'Attendance Bonus', phone]);

    // Update the user's balance and attendance in users table
    const updateUserSql = `UPDATE users SET money = money + ?, attendance = ? WHERE phone = ?`;
    await connection.execute(updateUserSql, [bonus, attendance, phone]);

    return res.status(200).json({
        message: 'Attendance bonus processed successfully',
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const getAttendanceInfo = async (req, res) => {
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `attendance` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [sumResult] = await connection.query('SELECT SUM(comm) as accumulatedBonus FROM incomes WHERE remarks = "Attendance Bonus" AND user_id = ?', [userInfo.id]);
    let accumulatedBonus = sumResult[0].accumulatedBonus || 0;

    return res.status(200).json({
        message: 'Attendance info fetched successfully',
        status: true,
        attendanceDays: userInfo.attendance,
        accumulatedBonus: accumulatedBonus,
        timeStamp: new Date().toISOString(),
    });
};

const rebateBonus = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
        const [user] = await connection.query('SELECT id, phone, code, invite FROM users WHERE token = ?', [auth]);
        let userInfo = user[0];

        if (!userInfo) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const userId = userInfo.id;
        const userPhone = userInfo.phone;
        const { bonus, netAmount } = req.body;

        if (!bonus || !netAmount) {
            return res.status(400).json({
                message: 'Bad Request',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const [lastIncome] = await connection.query(
            'SELECT * FROM incomes WHERE remarks = "Self Trading Bonus" AND user_id = ? ORDER BY id DESC LIMIT 1',
            [userId]
        );

        if (lastIncome.length > 0) {
            const lastIncomeDate = new Date(lastIncome[0].created_at).toISOString().slice(0, 10);
            const currentDate = new Date().toISOString().slice(0, 10);

            if (lastIncomeDate === currentDate) {
                return res.status(200).json({
                    message: 'Failed: Can only redeem once in a day',
                    status: false,
                    timeStamp: timeNow,
                });
            }
        }

        if (bonus > 0) {
            await connection.query(
                'INSERT INTO incomes (user_id, amount, comm, rname, remarks) VALUES (?, ?, ?, ?, "Self Trading Bonus")',
                [userId, netAmount, bonus, userPhone]
            );

            await connection.query(
                'UPDATE users SET money = money + ? WHERE phone = ?',
                [bonus, userPhone]
            );

            return res.status(200).json({
                message: 'Success',
                status: true,
                timeStamp: timeNow,
            });
        } else {
            return res.status(200).json({
                message: 'Failed: Bonus must be greater than 0',
                status: false,
                timeStamp: timeNow,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: timeNow,
        });
    }
};




const calculateTeamRecharge = async () => {
    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Get all users
    const [users] = await connection.query('SELECT `id`, `phone`, `code` FROM users');

    for (let user of users) {
        const userCode = user.code;

        // Get all team members for the user
        const [teamMembers] = await connection.query('SELECT `phone` FROM users WHERE `invite` = ?', [userCode]);

        let count = 0;
        let totalRecharge = 0;

        for (let member of teamMembers) {
            const memberPhone = member.phone;

            // Check if the member did a recharge yesterday
            const [rechargeResult] = await connection.query('SELECT COUNT(*) as rechargeCount, SUM(money) as totalRecharge FROM recharge WHERE `phone` = ? AND `today` = ?', [memberPhone, yesterdayString]);
            const rechargeCount = rechargeResult[0].rechargeCount;
            const memberRecharge = rechargeResult[0].totalRecharge || 0;

            if (rechargeCount > 0) {
                count++;
                totalRecharge += memberRecharge;
            }
        }

        // Call salaryBonus function with the total recharge and count
        await salaryBonus(totalRecharge, count, user.phone);
    }
};

// Function to handle salary bonus calculation and update
const salaryBonus = async (sumOfRecharge, count, phone) => {
    let bonus = 0;

    // Define the bonus based on count and sum of recharge
    if (count >= 5 && count < 10 && sumOfRecharge >= 10000 && sumOfRecharge < 20000) {
        bonus = 500;
    } else if (count >= 10 && count < 20 && sumOfRecharge >= 20000 && sumOfRecharge < 30000) {
        bonus = 1000;
    } else if (count >= 20 && count < 30 && sumOfRecharge >= 30000 && sumOfRecharge < 40000) {
        bonus = 1500;
    } else if (count >= 30 && count < 50 && sumOfRecharge >= 40000 && sumOfRecharge < 50000) {
        bonus = 2000;
    } else if (count >= 50 && count < 100 && sumOfRecharge >= 50000 && sumOfRecharge < 100000) {
        bonus = 2500;
    } else if (count >= 100 && count < 300 && sumOfRecharge >= 100000 && sumOfRecharge < 200000) {
        bonus = 5000;
    } else if (count >= 300 && count < 500 && sumOfRecharge >= 200000 && sumOfRecharge < 500000) {
        bonus = 10000;
    } else if (count >= 500 && count < 1000 && sumOfRecharge >= 500000 && sumOfRecharge < 1000000) {
        bonus = 25000;
    } else if (count >= 1000 && count < 3000 && sumOfRecharge >= 1000000 && sumOfRecharge < 3000000) {
        bonus = 50000;
    } else if (count >= 3000 && sumOfRecharge >= 3000000) {
        bonus = 100000;
    }

    // Insert bonus into incomes table if applicable
    if (bonus > 0) {
        const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES ((SELECT id FROM users WHERE phone = ?), ?, ?, ?, ?)`;
        await connection.execute(sql, [phone, sumOfRecharge, bonus, 'Daily Salary Bonus', 0]);

        // // Update the user's balance
        // const updateUserSql = `UPDATE users SET money = money + ? WHERE phone = ?`;
        // await connection.execute(updateUserSql, [bonus, phone]);
    }
};

const calculateDailyEarnings = async () => {
    try { 
        const yesterday = new Date(2024,6,12);
        console.log(yesterday);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
        const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();

        console.log(endOfYesterday);

        const [users] = await connection.query('SELECT `id`, `phone` FROM users where `phone` = "8824017010"');

        for (let user of users) {
            const { id, phone } = user;

            // Sum money from minutes_1 table
            const [minutes1Result] = await connection.query(
                'SELECT SUM(money) as sumMoney FROM minutes_1 WHERE phone = ? ',
                [phone, startOfYesterday, endOfYesterday]
            );
            const sumMinutes1 = minutes1Result[0].sumMoney || 0;

            // Sum money from result_k3 table
            const [resultK3] = await connection.query(
                'SELECT SUM(money) as sumMoney FROM result_k3 WHERE phone = ? ',
                [phone, startOfYesterday, endOfYesterday]
            );
            const sumResultK3 = resultK3[0].sumMoney || 0;

            // Sum money from result_5d table
            const [result5d] = await connection.query(
                'SELECT SUM(money) as sumMoney FROM result_5d WHERE phone = ? ',
                [phone, startOfYesterday, endOfYesterday]
            );
            const sumResult5d = result5d[0].sumMoney || 0;

            const totalSum = sumMinutes1 + sumResultK3 + sumResult5d;
            console.log(totalSum);

            if (totalSum > 0) {
                // Calculate the bonus
                const bonus = totalSum * 0.003;

                // Insert data into incomes table
                const sql = `INSERT INTO incomes (user_id, amount, comm, remarks, rname) VALUES (?, ?, ?, ?, ?)`;
                await connection.execute(sql, [id, totalSum, bonus, 'Trading Bonus', phone]);

                // Update the user's balance in users table
                const updateUserSql = `UPDATE users SET money = money + ? WHERE phone = ?`;
                await connection.execute(updateUserSql, [bonus, phone]);

                console.log(`User phone: ${phone}, Total sum: ${totalSum}, Bonus: ${bonus}`);
            }
        }
    } catch (error) {
        console.error('Error calculating daily earnings:', error);
    }
};

const listIncomeReport = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString();

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [user] = await connection.query('SELECT `id`, `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    let userId = user[0].id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [incomeReports] = await connection.query(
        `SELECT updated_at,bet, comm, remarks 
         FROM incomes 
         WHERE user_id = ? 
         AND remarks != 'Ai bonus' 
         AND (remarks != 'Daily Salary Bonus' OR (remarks = 'Daily Salary Bonus' AND rname != '0'))
         ORDER BY updated_at DESC 
         LIMIT ? OFFSET ?`, 
        [userId, limit, offset]
    );

    const [[{ total }]] = await connection.query(
        `SELECT COUNT(*) as total 
         FROM incomes 
         WHERE user_id = ? 
         AND remarks != 'Ai bonus' 
         AND (remarks != 'Daily Salary Bonus' OR (remarks = 'Daily Salary Bonus' AND rname != '0'))`,
        [userId]
    );

    return res.status(200).json({
        message: 'Receive success',
        incomeReports: incomeReports,
        status: true,
        timeStamp: timeNow,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    });
};

const listTeamReport = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString();

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        const [user] = await connection.query('SELECT `id`, `phone`, `code` FROM users WHERE `token` = ?', [auth]);
        if (!user.length) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
        }

        let userPhone = user[0].phone;
        let userInvite = user[0].code;

        let totalTeamMembers = 0;
        let teamReports = [];
        let currentInviteCodes = [userInvite];

        for (let level = 1; level <= 6; level++) {
            if (currentInviteCodes.length === 0) break;

            const [teamMembers] = await connection.query(
                `SELECT phone, code FROM users WHERE invite IN (?)`,
                [currentInviteCodes]
            );

            if (teamMembers.length === 0) break;

            let phones = teamMembers.map(member => member.phone);
            let codes = teamMembers.map(member => member.code);

            const [teamIncome] = await connection.query(
                `SELECT phone, f${level} as f FROM team_income WHERE phone IN (?) AND f${level} > 0`,
                [phones]
            );

            for (const income of teamIncome) {
                const [userDetails] = await connection.query(
                    'SELECT id_user, total_money, total_bet FROM users WHERE phone = ?',
                    [income.phone]
                );

                const userDetail = userDetails.length ? userDetails[0] : null;

                teamReports.push({
                    level: level,
                    phone: income.phone,
                    commission: income.f,
                    id_user: userDetail ? userDetail.id_user : null,
                    total_money: userDetail ? userDetail.total_money : null,
                    total_bet: userDetail ? userDetail.total_bet : null,
                    updated_at: timeNow // Replace with actual update time if available
                });
            }

            totalTeamMembers += teamIncome.length;

            // Prepare invite codes for the next level
            currentInviteCodes = codes;
        }

        // Pagination logic
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const paginatedReports = teamReports.slice(offset, offset + limit);

        return res.status(200).json({
            message: 'Receive success',
            teamReports: paginatedReports,
            allData: teamReports, // Include allData in the response
            status: true,
            timeStamp: timeNow,
            currentPage: page,
            totalPages: Math.ceil(totalTeamMembers / limit),
        });
    } catch (error) {
        console.error('Error in listTeamReport function:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: timeNow,
        });
    }
};


const listTotalTeam = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString();

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        const [user] = await connection.query('SELECT `id`, `phone`, `code` FROM users WHERE `token` = ?', [auth]);
        if (!user.length) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
        }

        let userPhone = user[0].phone;
        let userInvite = user[0].code;

        let teamReports = [];
        let currentInviteCodes = [userInvite];

        for (let level = 1; level <= 10; level++) {
            if (currentInviteCodes.length === 0) break;

            const [teamMembers] = await connection.query(
                `SELECT phone, code FROM users WHERE invite IN (?)`,
                [currentInviteCodes]
            );

            if (teamMembers.length === 0) break;

            let codes = teamMembers.map(member => member.code);

            for (const member of teamMembers) {
                const [userDetails] = await connection.query(
                    'SELECT id_user as id_user, total_money, total_bet FROM users WHERE phone = ?',
                    [member.phone]
                );

                const userDetail = userDetails.length ? userDetails[0] : null;

                teamReports.push({
                    level: level,
                    id_user: userDetail ? userDetail.id_user : null,
                    total_money: userDetail ? userDetail.total_money : null,
                    total_bet: userDetail ? userDetail.total_bet : null,
                    updated_at: timeNow // Replace with actual update time if available
                });
            }

            // Prepare invite codes for the next level
            currentInviteCodes = codes;
        }

        return res.status(200).json({
            message: 'Receive success',
            teamReports: teamReports,
            status: true,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.error('Error in listTotalTeam function:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: timeNow,
        });
    }
};



const listAiLevelReport = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString();

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [user] = await connection.query('SELECT `id`, `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    let userId = user[0].id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [incomeReports] = await connection.query(
        `SELECT updated_at,bet, comm, remarks 
         FROM incomes 
         WHERE user_id = ? 
         AND remarks = 'AI Return Bonus' 
         ORDER BY updated_at DESC 
         LIMIT ? OFFSET ?`, 
        [userId, limit, offset]
    );

    const [[{ total }]] = await connection.query(
        `SELECT COUNT(*) as total 
         FROM incomes 
         WHERE user_id = ? 
         AND remarks = 'AI Return Bonus'`,
        [userId]
    );

    return res.status(200).json({
        message: 'Receive success',
        incomeReports: incomeReports,
        status: true,
        timeStamp: timeNow,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    });
};


const insertStreakBonus = async (req, res) => {
    const auth = req.cookies.auth;
    const { userId, number, periods } = req.body;
    const timeNow = new Date().toISOString();

    if (!auth || !userId || !number || !periods) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        const [user] = await connection.query('SELECT phone, id FROM users WHERE id_user = ?', [userId]);

        if (user.length === 0) {
            return res.status(200).json({
                message: 'Invalid user ID',
                status: false,
                timeStamp: timeNow,
            });
        }

        const phone = user[0].phone;
        const userIdInUsers = user[0].id;

        if (number < 5) {
            return res.status(200).json({
                message: 'Streak must be at least 5',
                status: false,
                timeStamp: timeNow,
            });
        }

        let amount = 0;
        let bonus = 0;

        if (number >= 7 && number < 10) {
            amount = 500;
            bonus = 500;
        } else if (number >= 10 && number < 15) {
            amount = 1000;
            bonus = 1000;
        } else if (number >= 15 && number < 20) {
            amount = 50000;
            bonus = 50000;
        } else if (number >= 20 && number < 25) {
            amount = 10000;
            bonus = 10000;
        } else if (number >= 25) {
            amount = 20000;
            bonus = 20000;
        }

        const sql = `INSERT INTO streak_bonus SET 
            phone = ?, 
            user_id = ?, 
            streak_number = ?, 
            streak_period_number = ?, 
            amount = ?, 
            bonus = ?, 
            status = 0`;

        await connection.execute(sql, [phone, userIdInUsers, number, periods, amount, bonus]);

        return res.status(200).json({
            message: 'Streak bonus inserted successfully',
            status: true,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.error('Error inserting streak bonus:', error.message, error.stack);
        return res.status(500).json({
            message: `Internal Server Error: ${error.message}`,
            status: false,
            timeStamp: timeNow,
        });
    }
};



const listStreakBonusReport = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [user] = await connection.query('SELECT `phone` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    let userPhone = user[0].phone;

    const [streakBonuses] = await connection.query(
        'SELECT `updated_at`, `amount`, `status` FROM streak_bonus WHERE `phone` = ? ORDER BY `updated_at` DESC', 
        [userPhone]
    );

    return res.status(200).json({
        message: 'Receive success',
        streakBonuses: streakBonuses,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};

const getVipDetails = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    try {
        const [user] = await connection.query('SELECT `id`, `experience`, `vip_level` FROM users WHERE `token` = ?', [auth]);
        let userInfo = user[0];
        if (!userInfo) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const [levelUpBonuses] = await connection.query(
            'SELECT amount, id, rname FROM incomes WHERE remarks = "Level Up Bonus" AND user_id = ?',
            [userInfo.id]
        );

        const numberOfRows = levelUpBonuses.length;

        return res.status(200).json({
            message: 'VIP details fetched successfully',
            status: true,
            experience: userInfo.experience,
            vip_level: userInfo.vip_level,
            levelUpBonuses: levelUpBonuses,
            numberOfRows: numberOfRows,
            timeStamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};


const claimLevelUpBonus = async (req, res) => {
    let auth = req.cookies.auth;
    let id = req.body.id;

    if (!auth || !id) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    try {
        const [user] = await connection.query('SELECT id FROM users WHERE token = ?', [auth]);
        if (user.length === 0) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }
        const userId = user[0].id;

        const [income] = await connection.query('SELECT amount, rname, user_id FROM incomes WHERE id = ?', [id]);
        if (income.length === 0) {
            return res.status(200).json({
                message: 'Invalid bonus ID',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const { amount, rname, user_id } = income[0];

        if (userId !== user_id) {
            return res.status(200).json({
                message: 'Unauthorized',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        if (rname === 1) {
            return res.status(200).json({
                message: 'Bonus Already claimed',
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        await connection.query('UPDATE incomes SET rname = 1 WHERE id = ?', [id]);
        await connection.query('UPDATE users SET money = money + ? WHERE id = ?', [amount, user_id]);

        return res.status(200).json({
            message: 'Bonus claimed successfully',
            status: true,
            timeStamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }
};

const vipHistory = async (req, res) => {
    let auth = req.cookies.auth;
    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];
    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const [history] = await connection.query(
        'SELECT updated_at, amount FROM incomes WHERE remarks IN ("Level Up Bonus", "Monthly VIP Bonus") AND user_id = ? ORDER BY updated_at DESC',
        [userInfo.id]
    );

    return res.status(200).json({
        message: 'Get success',
        datas: history,
        status: true,
        timeStamp: new Date().toISOString(),
    });
};


const monthlyVipBonus = async () => {
    try {
        // Select all users
        const [users] = await connection.query('SELECT id, phone, vip_level FROM users');

        for (const user of users) {
            if (user.vip_level !== 0) {
                // Select monthly_reward from vip_rules where vip_level matches user's vip_level
                const [vipRule] = await connection.query(
                    'SELECT monthly_reward FROM vip_rules WHERE vip_level = ?',
                    [user.vip_level]
                );

                if (vipRule.length > 0) {
                    const monthlyReward = vipRule[0].monthly_reward;

                    // Update money in users table
                    await connection.query(
                        'UPDATE users SET money = money + ? WHERE id = ?',
                        [monthlyReward, user.id]
                    );

                    // Insert into incomes
                    const sql = `
                        INSERT INTO incomes (user_id, amount, comm, remarks, rname, created_at, updated_at)
                        VALUES (?, ?, ?, "Monthly VIP Bonus", ?, NOW(), NOW())
                    `;
                    await connection.query(sql, [user.id, monthlyReward, monthlyReward, user.phone]);
                }
            }
        }

        console.log('Monthly VIP bonuses distributed successfully');
    } catch (error) {
        console.error('Error distributing monthly VIP bonuses:', error);
    }
};

const teamSubordinatesDetails = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    try {
        const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
        if (!user.length) {
            return res.status(200).json({
                message: 'Failed',
                status: false,
                timeStamp: timeNow,
            });
        }

        let userInfo = user[0];

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        console.log("Yesterday's date:", yesterdayStr);
                const todayStr = today.toISOString().slice(0, 10);
        const startOfDay = new Date(todayStr).getTime();
        const endOfDay = new Date(todayStr).setHours(23, 59, 59, 999);

        // Function to get subordinates of a given level
        const getSubordinates = async (codes) => {
            const [subordinates] = await connection.query('SELECT `id`, `phone`, `code`, `time` FROM users WHERE `invite` IN (?)', [codes]);
            return subordinates;
        };

        // Function to get recharge details for given phones and date
        const getRechargeDetails = async (phones) => {
            const [recharges] = await connection.query(
                'SELECT `phone`, `money`, `today` as `date` FROM recharge WHERE `phone` IN (?) AND `status` = 1',
                [phones]
            );
            return recharges;
        };

        // Function to get first deposit details for given phones and date
        const getFirstDepositDetails = async (phones) => {
            const [firstDepositChecks] = await connection.query(
                'SELECT `phone`, COUNT(*) as count, MIN(DATE(`today`)) as `firstDate` FROM recharge WHERE `phone` IN (?) AND `status` = 1 GROUP BY `phone`',
                [phones]
            );
            return firstDepositChecks;
        };

        // Initialize counts and sums
        let totalNumberOfRegister = 0;
        let totalDepositNumber = 0;
        let totalDepositAmount = 0;
        let totalFirstDepositCount = 0;
        let todayRegisterCount = 0;
        let todayDepositNumber = 0;
        let todayDepositAmount = 0;
        let todayFirstDepositCount = 0;
        let currentLevelCodes = [userInfo.code];

        // Iterate through 6 levels
        for (let level = 0; level < 6; level++) {
            let subordinates = await getSubordinates(currentLevelCodes);
            let phones = subordinates.map(sub => sub.phone);
            let codes = subordinates.map(sub => sub.code);

            if (subordinates.length > 0) {
                totalNumberOfRegister += subordinates.length;

                let recharges = await getRechargeDetails(phones);
                totalDepositNumber += recharges.length;
                totalDepositAmount += recharges.reduce((sum, recharge) => sum + recharge.money, 0);

                console.log(recharges);
                let todayRecharges = recharges.filter(recharge => recharge.date === yesterdayStr);
                todayDepositNumber += todayRecharges.length;
                todayDepositAmount += todayRecharges.reduce((sum, recharge) => sum + recharge.money, 0);

                let firstDepositChecks = await getFirstDepositDetails(phones);
                for (const check of firstDepositChecks) {
                    if (check.count === 1) {
                        totalFirstDepositCount++;
                        if (check.firstDate === todayStr) {
                            todayFirstDepositCount++;
                        }
                    }
                }

                // Count today's registrations for the current subordinates
                todayRegisterCount += subordinates.filter(sub => new Date(sub.time).getTime() >= startOfDay && new Date(sub.time).getTime() <= endOfDay).length;

                // Set the current level codes to the new set of subordinates for the next iteration
                currentLevelCodes = codes;

                
            } else {
                // If no subordinates at this level, break the loop early
                break;
            }
        }

        return res.status(200).json({
            message: 'Success',
            directSubordinates: {
                totalNumberOfRegister: totalNumberOfRegister,
                totalDepositNumber: totalDepositNumber,
                totalDepositAmount: totalDepositAmount,
                totalFirstDepositCount: totalFirstDepositCount,
                todayRegisterCount: todayRegisterCount,
                todayDepositNumber: todayDepositNumber,
                todayDepositAmount: todayDepositAmount,
                todayFirstDepositCount: todayFirstDepositCount
            },
            status: true,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            status: false,
            timeStamp: timeNow,
        });
    }
};

const directTeamDetails = async (req, res) => {
    let auth = req.cookies.auth;
    const timeNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!auth) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    const [user] = await connection.query('SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?', [auth]);
    if (!user.length) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }

    let userInfo = user[0];

    // Get today's date in YYYY-MM-DD format and as a timestamp range
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    console.log(yesterday);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    console.log("Yesterday's date:", yesterdayStr);
        const todayStr = today.toISOString().slice(0, 10);
    const startOfDay = new Date(todayStr).getTime();
    const endOfDay = new Date(todayStr).setHours(23, 59, 59, 999);

    // Query to get direct subordinates
    const [directSubordinates] = await connection.query('SELECT `id`, `phone`, `time` FROM users WHERE `invite` = ?', [userInfo.code]);
    const numberOfRegister = directSubordinates.length;

    // Initialize counts and sums
    let depositNumber = 0;
    let depositAmount = 0;
    let firstDepositCount = 0;
    let todayRegisterCount = 0;
    let todayDepositNumber = 0;
    let todayDepositAmount = 0;
    let todayFirstDepositCount = 0;

    if (numberOfRegister > 0) {
        // Extract phones of direct subordinates
        const phones = directSubordinates.map(sub => sub.phone);

        // Count today's registrations for direct subordinates
        todayRegisterCount = directSubordinates.filter(sub => sub.time >= startOfDay && sub.time <= endOfDay).length;

        // Query to get all recharges of direct subordinates
        const [recharges] = await connection.query(
            'SELECT `phone`, `money`, `today` FROM recharge WHERE `phone` IN (?) AND `status` = 1',
            [phones]
        );

        // Count the number of recharges and calculate today's recharges
        depositNumber = recharges.length;
        todayDepositNumber = recharges.filter(recharge => recharge.today === todayStr).length;

        // Sum the amount of recharges and calculate today's deposit amount
        depositAmount = recharges.reduce((sum, recharge) => sum + recharge.money, 0);
        todayDepositAmount = recharges.filter(recharge => recharge.today === yesterdayStr).reduce((sum, recharge) => sum + recharge.money, 0);

        // Count the number of first deposits and today's first deposits
        for (let phone of phones) {
            const [firstDepositCheck] = await connection.query(
                'SELECT COUNT(*) as count FROM recharge WHERE `phone` = ? AND `status` = 1',
                [phone]
            );
            if (firstDepositCheck[0].count === 1) {
                firstDepositCount++;
                const [todayFirstDepositCheck] = await connection.query(
                    'SELECT COUNT(*) as count FROM recharge WHERE `phone` = ? AND `status` = 1 AND `today` = ?',
                    [phone, todayStr]
                );
                if (todayFirstDepositCheck[0].count === 1) {
                    todayFirstDepositCount++;
                }
            }
        }
    }

    return res.status(200).json({
        message: 'Success',
        directSubordinates: {
            numberOfRegister: numberOfRegister,
            depositNumber: depositNumber,
            depositAmount: depositAmount,
            firstDepositCount: firstDepositCount,
            todayRegisterCount: todayRegisterCount,
            todayDepositNumber: todayDepositNumber,
            todayDepositAmount: todayDepositAmount,
            todayFirstDepositCount: todayFirstDepositCount
        },
        status: true,
        timeStamp: timeNow,
    });
};


const calculateTotal = async (phone, bet) => {
    try {
        const [totalResult] = await connection.query('SELECT SUM(comm) as total FROM incomes WHERE remarks = "Team Commission Bonus" AND bet = ? AND rname = ?', [bet, phone]);
        console.log(bet);
        console.log(phone);

        return totalResult[0].total || '0.00'; // If no total is found, return '0.00'
    } catch (error) {
        console.error("Error calculating total:", error);
        return '0.00'; // Return '0.00' in case of an error
    }
};

const updateTotalBet = async () => {
    try {
        console.log('Starting updateTotalBet function');

        // Fetch all users
        const [users] = await connection.query('SELECT `phone` FROM users');
        
        if (users.length === 0) {
            console.error('No users found');
            return;
        }

        for (let user of users) {
            let phone = user.phone;
            console.log('Processing user:', phone);

            // Calculate sumwingo: sum of money and fees in minutes_1 table where phone matches
            const [minutes1Result] = await connection.query('SELECT SUM(money) as sumMoney, SUM(fee) as sumFees FROM minutes_1 WHERE phone = ?', [phone]);
            let sumwingo = (minutes1Result[0].sumMoney || 0) + (minutes1Result[0].sumFees || 0);
            console.log('Sumwingo for user', phone, ':', sumwingo);

            // Calculate sumk3: sum of money in result_k3 table where phone matches
            const [resultK3Result] = await connection.query('SELECT SUM(money) as sumK3 FROM result_k3 WHERE phone = ?', [phone]);
            let sumk3 = resultK3Result[0].sumK3 || 0;
            console.log('Sumk3 for user', phone, ':', sumk3);

            // Calculate sumk5: sum of money in result_k5 table where phone matches
            const [resultK5Result] = await connection.query('SELECT SUM(money) as sumK5 FROM result_5d WHERE phone = ?', [phone]);
            let sumk5 = resultK5Result[0].sumK5 || 0;
            console.log('Sumk5 for user', phone, ':', sumk5);

            // Calculate total bet
            let totalBet = sumwingo + sumk3 + sumk5;
            console.log('Total bet for user', phone, ':', totalBet);

            // Update total_bet in users table where phone matches
            await connection.query('UPDATE users SET total_bet = ? WHERE phone = ?', [totalBet, phone]);
            console.log('Total bet updated for user:', phone);
        }

        console.log('updateTotalBet function completed');
    } catch (error) {
        console.error('Error in updateTotalBet function:', error);
    }
}

const updateUserTeamIncome = async () => {
    try {
        // Select code, invite, and phone of all users from the users table
        const [users] = await connection.query('SELECT code, invite, phone FROM users');

        // For each user, calculate the f1 to f6 totals
        for (let user of users) {
            let f1Total = await calculateTotal(user.phone, 1);
            let f2Total = await calculateTotal(user.phone, 2);
            let f3Total = await calculateTotal(user.phone, 3);
            let f4Total = await calculateTotal(user.phone, 4);
            let f5Total = await calculateTotal(user.phone, 5);
            let f6Total = await calculateTotal(user.phone, 6);

            // Fetch the current values from the team_income table
            const [currentValues] = await connection.query(
                'SELECT f1, f2, f3, f4, f5, f6 FROM team_income WHERE phone = ? AND code = ? AND invite = ?',
                [user.phone, user.code, user.invite]
            );

            if (currentValues.length) {
                const current = currentValues[0];

                // Parse current and calculated totals as floats
                const prevF1 = parseFloat(current.f1);
                const prevF2 = parseFloat(current.f2);
                const prevF3 = parseFloat(current.f3);
                const prevF4 = parseFloat(current.f4);
                const prevF5 = parseFloat(current.f5);
                const prevF6 = parseFloat(current.f6);

                const newF1 = prevF1 + parseFloat(f1Total);
                const newF2 = prevF2 + parseFloat(f2Total);
                const newF3 = prevF3 + parseFloat(f3Total);
                const newF4 = prevF4 + parseFloat(f4Total);
                const newF5 = prevF5 + parseFloat(f5Total);
                const newF6 = prevF6 + parseFloat(f6Total);

                // Log previous and new values
                console.log(`Updating user ${user.phone}:
                    f1: ${prevF1} -> ${newF1},
                    f2: ${prevF2} -> ${newF2},
                    f3: ${prevF3} -> ${newF3},
                    f4: ${prevF4} -> ${newF4},
                    f5: ${prevF5} -> ${newF5},
                    f6: ${prevF6} -> ${newF6}`);

                // Update the data into the team_income table
                await connection.execute(
                    'UPDATE team_income SET f1 = ?, f2 = ?, f3 = ?, f4 = ?, f5 = ?, f6 = ?, time = ? WHERE phone = ? AND code = ? AND invite = ?',
                    [newF1, newF2, newF3, newF4, newF5, newF6, new Date().getTime(), user.phone, user.code, user.invite]
                );
            } else {
                console.error(`No existing record found for user ${user.phone} in team_income table`);
            }
        }
        console.log("Team income updated successfully");
    } catch (error) {
        console.error("Error updating team income:", error);
    }
};


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
    console.log(stringToHash);

    // Generate the MD5 hash
    const keyG = crypto.createHash('md5').update(stringToHash).digest('hex');

    return keyG;
}

async function loginAviator(account, gameId) {
    const agentId = 'John_Le_BDGPRO_INR';

    // Step 1: Generate KeyG
    const keyG = await generateKeyG();
    console.log(keyG);

    // Step 2: Create the params string
    const params = `Account=${account}&GameId=${gameId}&Lang=en-US&AgentId=${agentId}`;
    console.log(params);

    // Step 3: Generate the key
    const key = `000000${crypto.createHash('md5').update(params + keyG).digest('hex')}000000`;

    // Step 4: Generate the final URL
    const finalUrl = `https://wb-api.jlfafafa2.com/api1/LoginWithoutRedirect?${params}&Key=${key}`;

    console.log(finalUrl);

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


async function getAviatorGame(req, res) {
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `id_user` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];

    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const account = `bdgpro${userInfo.id_user}`;
    const gameId = req.params.gameID; // Extract gameId from the request parameters

    try {
        // Call loginAviator with the account string and gameId
        const loginResponse = await loginAviator(account, gameId);

        return res.status(200).json({
            message: 'Login successful',
            status: true,
            data: loginResponse,
            timeStamp: new Date().toISOString(),
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Login failed',
            status: false,
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }
}



async function exchangeTransfer(account, transactionId, amount, transferType) {
    const agentId = 'John_Le_BDGPRO_INR';

    // Step 1: Generate KeyG
    const keyG = await generateKeyG();
    console.log(keyG);

    // Step 2: Create the params string
    const params = `Account=${account}&TransactionId=${transactionId}&Amount=${amount}&TransferType=${transferType}&AgentId=${agentId}`;
    console.log(params);

    // Step 3: Generate the key
    const key = `000000${crypto.createHash('md5').update(params + keyG).digest('hex')}000000`;

    // Step 4: Generate the final URL
    const finalUrl = `https://wb-api.jlfafafa2.com/api1/ExchangeTransferByAgentId?${params}&Key=${key}`;

    console.log(finalUrl);

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


async function aviatorMoneySend(req, res) {
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite`, `id_user`, `money`, `thirdparty_wallet` FROM users WHERE `token` = ?', [auth]);
    let userInfo = user[0];

    if (!userInfo) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: new Date().toISOString(),
        });
    }

    const account = `bdgpro${userInfo.id_user}`;
    const amount = parseFloat(userInfo.money);
    const transferType = 2; // TransferType is set to 2

    // Generate a unique transactionId
    const transactionId = `${Date.now()}-${account}-${crypto.randomBytes(8).toString('hex')}`;

    try {
        // Call exchangeTransfer with the account, transactionId, amount, and transferType
        const transferResponse = await exchangeTransfer(account, transactionId, amount, transferType);

        if (transferResponse.ErrorCode === 0) {
            // Update the user's money to 0 and increment thirdparty_wallet
            await connection.query(
                'UPDATE users SET money = 0, thirdparty_wallet = thirdparty_wallet + ? WHERE id_user = ?',
                [parseFloat(amount), userInfo.id_user]
            );

            // Insert the transaction into the money_transfer table
            await connection.query(
                'INSERT INTO money_transfer (uid, phone, amount, transfer_to, transfer_from, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userInfo.id_user, userInfo.phone, amount, 'JiLi', 'bdgpro', new Date(), new Date()]
            );

            return res.status(200).json({
                message: 'Transfer successful',
                status: true,
                data: transferResponse,
                timeStamp: new Date().toISOString(),
            });
        } else {
            // Handle cases where the transfer is not successful (ErrorCode is not 0)
            return res.status(500).json({
                message: 'Transfer failed',
                status: false,
                error: 'Transfer unsuccessful, please try again.',
                timeStamp: new Date().toISOString(),
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Transfer failed',
            status: false,
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }
}






module.exports = {
    userInfo,
    changeUser,
    promotion, 
    myTeam,
    recharge,
    rechargeCoin,
    rechargeCancel,
    createPayment,
    PaytmCallback,
    recharge2,
    checkRechargeStatus,
    listRecharge,
    listWithdraw,
    changePassword,
    checkInHandling,
    infoUserBank,
    addBank,
    withdrawal3,
    withdrawal4,
    callback_bank,
    listMyTeam,
    paymentPage,
    verifyCode,
    useRedenvelope,
    search,
    listMyInvation,
    listMyRebate,
    claimInterest,
    manualRecharge,
    fundTransfer,
    fundTransferGame,
    listFundTransferReport,
    listGameTransferReport,
    listStreakBonusReport,
    getAIBonus,
    getAIBalance,
    attendanceBonus,
    getAttendanceInfo,
    calculateTeamRecharge,
    calculateDailyEarnings,
    listIncomeReport,
    createPayment10,
    handlePlisioCallback,
    insertStreakBonus,
    getVipDetails,
    claimLevelUpBonus,
    vipHistory,
    monthlyVipBonus,
    directTeamDetails,
    listAiLevelReport,
    teamSubordinatesDetails,
    listTeamReport,
    updateUserTeamIncome,
    listTotalTeam,
    rebate,
    rebateBonus,
    searchRecharge,
    manualPayment,
    updateTotalBet,
    getAviatorGame,
    aviatorMoneySend
}