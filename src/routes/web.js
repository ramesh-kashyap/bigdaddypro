import express from 'express';
import accountController from '../controllers/accountController';
import homeController from '../controllers/homeController';
import winGoController from '../controllers/winGoController';
import userController from '../controllers/userController';
import middlewareController from '../controllers/middlewareController';
import adminController from '../controllers/adminController';
import dailyController from '../controllers/dailyController';
import k5Controller from '../controllers/k5Controller';
import k3Controller from '../controllers/k3Controller';
let router = express.Router();

const initWebRouter = (app) => {


    // page account
    router.get('/login', accountController.loginPage);
    router.get('/register', accountController.registerPage);
    router.get('/forgot', accountController.forgotPage);
    router.post('/api/sent/otp/verify', accountController.verifyCode);
    router.post('/api/sent/otp/verify/reset', accountController.verifyCodePass);
    router.post('/api/resetPasword', accountController.forGotPassword);

    // router.get('/api/addteamIncome', userController.updateUserTeamIncome);
    // router.get('/api/totalBet', userController.updateTotalBet);


    // page home
    router.get('/', (req, res) => {
            //Sanitize user input
   

        return res.redirect('/home');
    });
    router.get('/home', homeController.homePage);
    
    router.get('/checkIn', middlewareController, homeController.checkInPage);
    router.get('/rebatePage', middlewareController, homeController.rebatePage);

    router.get('/activity', middlewareController, homeController.activityPage);
    router.get('/InvitationBonus', middlewareController, homeController.InvitationBonus);
    router.get('/InvitationBonus/Rule', middlewareController, homeController.InvitationBonusRule);
    router.get('/InvitationBonus/Record', middlewareController, homeController.InvitationRecord);
    router.get('/InvitationBonus/rebateBonus', middlewareController, homeController.rebateBonus);
    router.get('/checkDes', middlewareController, homeController.checkDes);
    router.get('/checkRecord', middlewareController, homeController.checkRecord);
    router.get('/checkattendance', middlewareController, homeController.checkattendance);
    router.get('/investHistory', middlewareController, homeController.investHistory);
    router.get('/winingstreakbonus', middlewareController, homeController.winingstreakbonus);
    router.get('/VipDashboard', middlewareController, homeController.vipdashboard);
    router.get('/VipRule', middlewareController, homeController.viprule);
    router.get('/vipHistory', middlewareController, homeController.vipHistory);
    router.get('/gamehistory', middlewareController, homeController.gamehistory);
    router.get('/levelincome', middlewareController, homeController.levelincome);



    router.get('/promotion', middlewareController, homeController.promotionPage);
    router.get('/promotion/myTeam', middlewareController, homeController.promotionmyTeamPage);
    router.get('/promotion/promotionDes', middlewareController, homeController.promotionDesPage);
    router.get('/promotion/tutorial', middlewareController, homeController.tutorialPage);
    router.get('/promotion/bonusrecord', middlewareController, homeController.bonusRecordPage);

    router.get('/wallet', middlewareController, homeController.walletPage);
    router.get('/wallet/recharge', middlewareController, homeController.rechargePage);
    router.get('/wallet/rechargeCrypto', middlewareController, homeController.rechargeCryptoPage);

    router.get('/wallet/withdrawal', middlewareController, homeController.withdrawalCryptoPage);
    router.get('/wallet/withdrawalCrypto', middlewareController, homeController.withdrawalCryptoPage);
    router.get('/wallet/rechargerecord', middlewareController, homeController.rechargerecordPage);
    router.get('/wallet/withdrawalrecord', middlewareController, homeController.withdrawalrecordPage);
    router.get('/wallet/addBank', middlewareController, homeController.addBank);
    router.get('/wallet/addWallet', middlewareController, homeController.addWallet);

    //AI trade
    router.get('/ai/transferform', middlewareController, homeController.AiTransferPage);
    router.get('/ai/dashboard', middlewareController, homeController.AiDashboardPage);
    router.post('/api/webapi/fundtransfer', middlewareController, userController.fundTransfer); // register
    router.get('/api/webapi/fundTransferReport', middlewareController, userController.listFundTransferReport); // register
    router.get('/api/webapi/aiBonus', middlewareController, userController.getAIBonus); // register
    router.get('/api/webapi/getAIBalance', middlewareController, userController.getAIBalance); // get info account

    router.get('/api/webapi/directTeamDetails', middlewareController, userController.directTeamDetails); // register
    router.get('/api/webapi/teamSubordinatesDetails', middlewareController, userController.teamSubordinatesDetails); // register


// Game wallet Transfer
    router.get('/wallet/transferform', middlewareController, homeController.GameTransferPage);
    router.get('/promotion/teamCom', middlewareController, homeController.teamCom);

    router.post('/api/webapi/fundTransferGame', middlewareController, userController.fundTransferGame); // register
    router.get('/api/webapi/listGameTransferReport', middlewareController, userController.listGameTransferReport); // register
    router.post('/api/webapi/attendanceBonus', middlewareController, userController.attendanceBonus); // attendance
    router.get('/api/webapi/getAttendanceInfo', middlewareController, userController.getAttendanceInfo);
    router.get('/api/webapi/listIncomeReport', middlewareController, userController.listIncomeReport); // register
    router.get('/api/webapi/listTeamReport', middlewareController, userController.listTeamReport); // register
    router.get('/api/webapi/listTotalTeam', middlewareController, userController.listTotalTeam); // register

    router.get('/api/webapi/rebate', middlewareController, userController.rebate);
    router.post('/api/webapi/rebateBonus', middlewareController, userController.rebateBonus); // attendance


    router.get('/api/webapi/listAiLevelReport', middlewareController, userController.listAiLevelReport); // register


    //vip
    router.get('/api/webapi/getVipDetails', middlewareController, userController.getVipDetails);
    router.post('/api/webapi/claimLevelUpBonus', middlewareController, userController.claimLevelUpBonus); // attendance
    router.get('/api/webapi/vipHistory', middlewareController, userController.vipHistory); // register
   

    // hi

    router.post('/api/webapi/insertStreakBonus', middlewareController, userController.insertStreakBonus); // register
    router.get('/api/webapi/listStreakBonusReport', middlewareController, userController.listStreakBonusReport); // register


    router.get('/keFuMenu', middlewareController, homeController.keFuMenu);

    router.get('/mian', middlewareController, homeController.mianPage);

    router.get('/about', middlewareController, homeController.aboutPage);
    router.get('/redenvelopes', middlewareController, homeController.redenvelopes);
    router.get('/mian/forgot', middlewareController, homeController.forgot);
    router.get('/newtutorial', homeController.newtutorial); 
    router.get('/about/privacyPolicy', middlewareController, homeController.privacyPolicy);
    router.get('/about/riskAgreement', middlewareController, homeController.riskAgreement);
    
    router.get('/myProfile', middlewareController, homeController.myProfilePage);



    // BET wingo
    router.get('/win', middlewareController, winGoController.winGoPage);
    router.get('/win/3', middlewareController, winGoController.winGoPage3);
    router.get('/win/5', middlewareController, winGoController.winGoPage5);
    router.get('/win/10', middlewareController, winGoController.winGoPage10);

    // BET K5D
    router.get('/5d', middlewareController, k5Controller.K5DPage);
    router.post('/api/webapi/action/5d/join', middlewareController, k5Controller.betK5D); // register
    router.post('/api/webapi/5d/GetNoaverageEmerdList', middlewareController, k5Controller.listOrderOld); // register
    router.post('/api/webapi/5d/GetMyEmerdList', middlewareController, k5Controller.GetMyEmerdList); // register

    // BET K3
    router.get('/k3', middlewareController, k3Controller.K3Page);
    router.post('/api/webapi/action/k3/join', middlewareController, k3Controller.betK3); // register
    router.post('/api/webapi/k3/GetNoaverageEmerdList', middlewareController, k3Controller.listOrderOld); // register
    router.post('/api/webapi/k3/GetMyEmerdList', middlewareController, k3Controller.GetMyEmerdList); // register


    // login | register 
    router.post('/api/webapi/login', accountController.login); // login
    router.post('/api/webapi/register', accountController.register); // register
    router.get('/api/webapi/GetUserInfo', middlewareController, userController.userInfo); // get info account
    router.put('/api/webapi/change/userInfo',middlewareController, userController.changeUser); // get info account
    router.put('/api/webapi/change/pass',middlewareController, userController.changePassword); // get info account

    // bet wingo
    router.post('/api/webapi/action/join', middlewareController, winGoController.betWinGo); // register
    router.post('/api/webapi/GetNoaverageEmerdList', middlewareController, winGoController.listOrderOld); // register
    router.post('/api/webapi/GetMyEmerdList', middlewareController, winGoController.GetMyEmerdList); // register
    router.post('/api/webapi/WingoBetList', middlewareController, winGoController.WingoBetList); // register


    router.post('/api/webapi/checkPeriodAndStage', middlewareController, winGoController.checkPeriodAndStage); // register
    router.post('/api/webapi/checkPeriodAndStage3', middlewareController, winGoController.checkPeriodAndStage3); // register
    router.post('/api/webapi/checkPeriodAndStage5', middlewareController, winGoController.checkPeriodAndStage5); // register
    router.post('/api/webapi/checkPeriodAndStage10', middlewareController, winGoController.checkPeriodAndStage10); // register


    // promotion
    router.get('/wallet/paymentPage', middlewareController, userController.paymentPage); // register
    router.post('/api/webapi/promotion', middlewareController, userController.promotion); // register
    
    router.post('/api/webapi/checkIn', middlewareController, userController.checkInHandling); // register
    router.post('/api/webapi/claimInterest', middlewareController, userController.claimInterest); // register
    
    router.post('/api/webapi/check/Info', middlewareController, userController.infoUserBank); // register 
    router.post('/api/webapi/addBank', middlewareController, userController.addBank); // register
    router.post('/api/webapi/otp', middlewareController, userController.verifyCode); // register
    router.post('/api/webapi/use/redenvelope', middlewareController, userController.useRedenvelope); // register

    // wallet
    router.post('/api/webapi/recharge', middlewareController, userController.recharge); // register
    router.post('/api/webapi/manualPayment', middlewareController, userController.manualPayment); // register
    
    router.post('/api/webapi/manualRecharge', middlewareController, userController.manualRecharge); // register
    router.post('/api/webapi/checkrechargestatus', middlewareController, userController.checkRechargeStatus); // register
    router.post('/api/webapi/rechargeCoin', middlewareController, userController.rechargeCoin); // register
    router.post('/api/webapi/rechargeCancel', middlewareController, userController.rechargeCancel); // register

    router.post('/api/webapi/createPayment', middlewareController, userController.createPayment); // register
    router.post('/api/webapi/createPayment10', middlewareController, userController.createPayment10); // register
    router.post('/api/webapi/handlePlisioCallback',userController.handlePlisioCallback); // register
    router.post('/paytm/callback',userController.PaytmCallback); // register

    
    router.get('/api/webapi/myTeam', middlewareController, userController.listMyTeam); // register
    router.get('/api/webapi/rebateBonus', middlewareController, userController.listMyRebate); // register
    router.get('/api/webapi/myinvationteam', middlewareController, userController.listMyInvation); // register
    router.get('/api/webapi/recharge/list', middlewareController, userController.listRecharge); // register
    router.get('/api/webapi/withdraw/list', middlewareController, userController.listWithdraw); // register
    router.post('/api/webapi/recharge/check', middlewareController, userController.recharge2); // register
    router.post('/api/webapi/withdrawal', middlewareController, userController.withdrawal3); // register
    router.post('/api/webapi/withdrawalUsdt', middlewareController, userController.withdrawal4); // register
    router.post('/api/webapi/callback_bank', middlewareController, userController.callback_bank); // register

    router.post('/api/webapi/search', middlewareController, userController.search); // register
    router.post('/api/webapi/searchRecharge', middlewareController, userController.searchRecharge); // register



    // daily
    router.get('/manager/index', dailyController.middlewareDailyController, dailyController.dailyPage);
    router.get('/manager/listRecharge', dailyController.middlewareDailyController, dailyController.listRecharge);
    router.get('/manager/listWithdraw', dailyController.middlewareDailyController, dailyController.listWithdraw);
    router.get('/manager/members', dailyController.middlewareDailyController, dailyController.listMeber);
    router.get('/manager/profileMember', dailyController.middlewareDailyController, dailyController.profileMember);
    router.get('/manager/settings', dailyController.middlewareDailyController, dailyController.settingPage);
    router.get('/manager/gifts', dailyController.middlewareDailyController, dailyController.giftPage);
    
    router.get('/manager/support', dailyController.middlewareDailyController, dailyController.support);
    router.get('/manager/member/info/:phone', dailyController.middlewareDailyController, dailyController.pageInfo);

    router.post('/manager/member/info/:phone', dailyController.middlewareDailyController, dailyController.userInfo);
    router.post('/manager/member/listRecharge/:phone', dailyController.middlewareDailyController, dailyController.listRechargeMem);
    router.post('/manager/member/listWithdraw/:phone', dailyController.middlewareDailyController, dailyController.listWithdrawMem);
    router.post('/manager/member/redenvelope/:phone', dailyController.middlewareDailyController, dailyController.listRedenvelope);
    router.post('/manager/member/bet/:phone', dailyController.middlewareDailyController, dailyController.listBet);


    router.post('/manager/settings/list', dailyController.middlewareDailyController, dailyController.settings);
    router.post('/manager/createBonus', dailyController.middlewareDailyController, dailyController.createBonus);
    router.post('/manager/listRedenvelops', dailyController.middlewareDailyController, dailyController.listRedenvelops);

    router.post('/manager/listRecharge', dailyController.middlewareDailyController, dailyController.listRechargeP);
    router.post('/manager/listWithdraw', dailyController.middlewareDailyController, dailyController.listWithdrawP);

    router.post('/api/webapi/statistical', dailyController.middlewareDailyController, dailyController.statistical);
    router.post('/manager/infoCtv', dailyController.middlewareDailyController, dailyController.infoCtv); // get info account
    router.post('/manager/infoCtv/select', dailyController.middlewareDailyController, dailyController.infoCtv2); // get info account
    router.post('/api/webapi/manager/listMember', dailyController.middlewareDailyController, dailyController.listMember); // get info account

    router.post('/api/webapi/manager/buff', dailyController.middlewareDailyController, dailyController.buffMoney); // get info account


    // admin
    router.get('/admin/manager/index', adminController.middlewareAdminController, adminController.adminPage); // get info account
    router.get('/admin/manager/index/3', adminController.middlewareAdminController, adminController.adminPage3); // get info account
    router.get('/admin/manager/index/5', adminController.middlewareAdminController, adminController.adminPage5); // get info account
    router.get('/admin/manager/index/10', adminController.middlewareAdminController, adminController.adminPage10); // get info account

    router.get('/admin/manager/5d', adminController.middlewareAdminController, adminController.adminPage5d); // get info account
    router.get('/admin/manager/k3', adminController.middlewareAdminController, adminController.adminPageK3); // get info account


    router.get('/admin/manager/members', adminController.middlewareAdminController, adminController.membersPage); // get info account
    router.get('/admin/manager/createBonus', adminController.middlewareAdminController, adminController.giftPage); // get info account
    router.get('/admin/manager/salaryPage', adminController.middlewareAdminController, adminController.salaryPage); // get info account
    router.get('/admin/manager/ctv', adminController.middlewareAdminController, adminController.ctvPage); // get info account
    router.get('/admin/manager/ctv/profile/:phone', adminController.middlewareAdminController, adminController.ctvProfilePage); // get info account
    router.get('/admin/manager/settings', adminController.middlewareAdminController, adminController.settings); // get info account
    router.get('/admin/manager/listRedenvelops', adminController.middlewareAdminController, adminController.listRedenvelops); // get info account
    router.get('/admin/manager/listSalaryBonus', adminController.middlewareAdminController, adminController.listSalaryBonus); // get info account

    router.get('/admin/manager/recharge', adminController.middlewareAdminController, adminController.rechargePage); // get info account
    router.get('/admin/manager/rechargemanual', adminController.middlewareAdminController, adminController.rechargemanual); // get info account
    router.get('/admin/manager/withdraw', adminController.middlewareAdminController, adminController.withdraw); // get info account
    router.get('/admin/manager/withdrawCrytp', adminController.middlewareAdminController, adminController.withdrawCrytp); // get info account
    router.get('/admin/manager/rechargeRecord', adminController.middlewareAdminController, adminController.rechargeRecord); // get info account
    router.get('/admin/manager/withdrawRecord', adminController.middlewareAdminController, adminController.withdrawRecord); // get info account
    router.get('/admin/manager/statistical', adminController.middlewareAdminController, adminController.statistical); // get info account
    router.get('/admin/member/info/:id', adminController.middlewareAdminController, adminController.infoMember);
    router.get('/admin/member/dailybonusrecord', adminController.middlewareAdminController, adminController.dailybonusrecord);
    router.get('/admin/member/aibonusrecord', adminController.middlewareAdminController, adminController.aibonusrecord);
    router.get('/admin/member/incomebonusrecord', adminController.middlewareAdminController, adminController.incomebonusrecord);
    router.get('/admin/member/Streakbonusrecord', adminController.middlewareAdminController, adminController.Streakbonusrecord);
    router.get('/admin/manager/aiBonus', adminController.middlewareAdminController, adminController.aiBonus); // get info account
    router.get('/admin/manager/incomeBonus', adminController.middlewareAdminController, adminController.incomeBonus); // get info account
    router.get('/admin/manager/dailyBonus', adminController.middlewareAdminController, adminController.dailyBonus); // get info account
    router.get('/admin/manager/listStreakBonuses', adminController.middlewareAdminController, adminController.listStreakBonuses); // get info account


    router.post('/admin/manager/infoCtv', adminController.middlewareAdminController, adminController.infoCtv); // get info account
    router.post('/admin/manager/infoCtv/select', adminController.middlewareAdminController, adminController.infoCtv2); // get info account
    router.post('/admin/manager/settings/bank', adminController.middlewareAdminController, adminController.settingBank); // get info account
    router.post('/admin/manager/settings/cskh', adminController.middlewareAdminController, adminController.settingCskh); // get info account
    router.post('/admin/manager/settings/buff', adminController.middlewareAdminController, adminController.settingbuff); // get info account
    router.post('/admin/manager/create/ctv', adminController.middlewareMainAdminController, adminController.register); // get info account
    router.post('/admin/manager/settings/get', adminController.middlewareAdminController, adminController.settingGet); // get info account
    router.post('/admin/manager/createBonus', adminController.middlewareMainAdminController, adminController.createBonus); // get info account
    router.post('/admin/manager/createSalary', adminController.middlewareMainAdminController, adminController.createSalary); // get info account


    router.post('/admin/member/listRecharge/:phone', adminController.middlewareAdminController, adminController.listRechargeMem);
    router.post('/admin/member/listWithdraw/:phone', adminController.middlewareAdminController, adminController.listWithdrawMem);
    router.post('/admin/member/redenvelope/:phone', adminController.middlewareAdminController, adminController.listRedenvelope);
    router.post('/admin/member/bet/:phone', adminController.middlewareAdminController, adminController.listBet);



    

    router.post('/api/webapi/admin/listMember', adminController.middlewareAdminController, adminController.listMember); // get info account
    router.post('/api/webapi/admin/listctv', adminController.middlewareAdminController, adminController.listCTV); // get info account
    router.post('/api/webapi/admin/withdraw', adminController.middlewareAdminController, adminController.handlWithdraw); // get info account
    router.post('/api/webapi/admin/recharge', adminController.middlewareAdminController, adminController.recharge); // get info account
    router.post('/api/webapi/admin/rechargeDuyet', adminController.middlewareAdminController, adminController.rechargeDuyet); // get info account
    router.post('/api/webapi/admin/member/info', adminController.middlewareAdminController, adminController.userInfo); // get info account
    router.post('/api/webapi/admin/statistical', adminController.middlewareAdminController, adminController.statistical2); // get info account

    router.post('/api/webapi/admin/banned', adminController.middlewareMainAdminController, adminController.banned); // get info account


    router.post('/api/webapi/admin/totalJoin', adminController.middlewareAdminController, adminController.totalJoin); // get info account
    router.post('/api/webapi/admin/change', adminController.middlewareMainAdminController, adminController.changeAdmin); // get info account
    router.post('/api/webapi/admin/profileUser', adminController.middlewareMainAdminController, adminController.profileUser); // get info account

    // admin 5d 
    router.post('/api/webapi/admin/5d/listOrders', adminController.middlewareAdminController, adminController.listOrderOld); // get info account
    router.post('/api/webapi/admin/k3/listOrders', adminController.middlewareAdminController, adminController.listOrderOldK3); // get info account
    router.post('/api/webapi/admin/5d/editResult', adminController.middlewareMainAdminController, adminController.editResult); // get info account
    router.post('/api/webapi/admin/k3/editResult', adminController.middlewareMainAdminController, adminController.editResult2); // get info account

  
    router.post('/api/webapi/admin/updateIncomeStatus', adminController.middlewareMainAdminController, adminController.updateIncomeStatus); // get info account
    router.post('/api/webapi/admin/updateStreakStatus', adminController.middlewareMainAdminController, adminController.updateStreakStatus); // get info account

    
    return app.use('/', router); 
}

module.exports = {
    initWebRouter,
};