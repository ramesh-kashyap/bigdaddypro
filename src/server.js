import express from 'express';
import configViewEngine from './config/configEngine';
import connection from "./config/connectDB";
import routes from './routes/web';
import cronJobContronler from './controllers/cronJobContronler';
// import models from './modal/CreateDatabase';
import socketIoController from './controllers/socketIoController';
const { getColor } = require('./helpers/helper');
const cookieParser = require('cookie-parser');
const i18n = require('./middleware/i18n');
const languageMiddleware = require('./middleware/languageMiddleware');

const xssMiddleware = require('./controllers/xssMiddleware');


require('dotenv').config();
const xss = require('xss');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 3000;
app.use(cookieParser());
app.use(languageMiddleware); // Use the correct middleware here
app.use(i18n.init);


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


app.use(xssMiddleware);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/change-language/:lang', (req, res) => {
    res.cookie('lang', req.params.lang);
    res.redirect('back');
});




app.get('/dynamic-styles.css', async (req, res) => {
    try {
      let colors = await getColor();

        // console.log(colors.base_color);
        let base_color =  colors.base_color;
        let secondary_color =  colors.secondary_color;
        let textColor =  colors.textColor;
        // console.log(colors);
        if (!base_color || !/^#[a-fA-F0-9]{6}$/i.test(base_color)) {
            base_color = "#336699";
        }
  
      const css = `
        .home[data-v-432e6ed0] {
            background-color: ${base_color}!important;
        }
        .home .gameList .item .info.i3[data-v-432e6ed0], .home .gameList .item .info.i2[data-v-432e6ed0] , .home .gameList .item .info.i4[data-v-432e6ed0]{
            background: ${secondary_color};
        }
        .home .gameList .item[data-v-432e6ed0] {
            color: #000;
        }
        .navbar[data-v-106b99c8]
        {
            background:${base_color};
        }
        .van-notice-bar {
            background:none!important;
        }
        .home .notice-box .txt[data-v-432e6ed0]
        {
            background:none!important;  
        }
        .home .gameList .item .userList[data-v-432e6ed0]
        {
            background-color: #3a3a3a;
        }
        .home .gameList .item .userList[data-v-432e6ed0] {
            color: ${textColor};
        }
        .van-tabs__nav
        {
            background-color: transparent;
        }
        .game-head .total-box[data-v-a9660e98]
        {
              background: #4D4D4C;
                background-image: url(/images/walletbg-dcbd4124.png);
                background-repeat: no-repeat;
                background-size: contain;
        }
        .game-betting[data-v-a9660e98] {
            background: ${base_color}!important;
        }
        .game[data-v-a9660e98] {
            background: ${base_color}!important;
        }
        .game .content[data-v-a9660e98] {
            background: ${base_color}!important;
        }
        .game-betting .tab .box[data-v-a9660e98] {
            background:${secondary_color}!important;     
        }
        .game-betting .tab[data-v-a9660e98] {
            box-shadow: 0 0 .21333rem .02667rem rgb(0 0 0 / 30%);
        }
        .game-betting .content .time-box[data-v-a9660e98] {
            
             background: url('/images/wingoissue-ba51f474.png');
                background-repeat: no-repeat;
                background-size: 100% 100%;
                background-position: .01333rem center;
           
        }
        .game-betting .content .time-box .info .number[data-v-a9660e98] {
            color: #8F5206;
            
        }
        .game-betting .content .time-box .info .txt[data-v-a9660e98] {
         
           color: #8F5206;
    border: .02667rem solid #8F5206;
        }
        .game-betting .content .time-box .out .txt[data-v-a9660e98] {
            color: #8F5206;
           
        }
        .TimeLeft__C-rule[data-v-ff68ae62]
        {
            border: 0.01333rem solid #8F5206 !important;
            color:#8F5206;
        }
        .game-betting .content .box[data-v-a9660e98] {
            background: #333332 !important;
            padding: .18667rem .26667rem .25333rem .18667rem;
        }
        .game-betting .content .box .number-box.action[data-v-a9660e98] {
          background: #242424 !important;
        }
        .game-list[data-v-a9660e98] {
       
            background: ${base_color}!important;
        }
        .game-list .list .hb .item[data-v-a9660e98] {
        
            background:${base_color}!important;     
        }
        .game-list .list-fooder[data-v-a9660e98] {
            background:${base_color}!important;     
        }
        .game-list .page-nav .arr.action[data-v-a9660e98] {
            background:${secondary_color}!important;     
        }
        .game-list .page-nav .number[data-v-a9660e98] {
            background:${base_color}!important;     
        }
        .game-head[data-v-a9660e98] {
            background:${base_color}!important;     
       
        }
        .van-tabbar {
            background:${secondary_color}!important;     
       
        }
        .game-head .total-box[data-v-42f27458] {
            background:#4D4D4C;
            background-image: url(/images/walletbg-dcbd4124.png);
            background-repeat: no-repeat;
        }
        .game-head[data-v-42f27458] {     
            background:${base_color}!important;  
        }
        .game-betting[data-v-42f27458] {
            background:${base_color}!important;  
        }
        .game-betting .content .page-box[data-v-42f27458] {
            background:#333332!important
        }
        .game-list .list .wrap[data-v-42f27458] {
            background:#000!important;
        }

        .game-list .list .hb[data-v-42f27458] {
            background:${base_color}!important;  
        }

        .game-list[data-v-42f27458] {
            background:${base_color}!important;  
        }
        .game-list .tab .li .txt.action[data-v-42f27458] {
            background:${secondary_color}!important;
            border: .02667rem solid ${textColor};
        }

        .game-list .tab .li .txt[data-v-42f27458] {
            background:${secondary_color}!important;
            border: .02667rem solid ${textColor};
        }
        .game-list .list .hb .item .info .tiem[data-v-42f27458] {
            color:${textColor};
        }
        .game-list .list .hb .details .detailLi[data-v-42f27458] {
            background:${secondary_color}!important;
        }
        .game-list .list-fooder[data-v-42f27458] {
            background-color:${base_color}!important;
        }
        .game-betting .tab .box[data-v-42f27458] {
            background:${secondary_color}!important;
        }
        .game .page-nav .number[data-v-42f27458] {
            background-color:${base_color}!important;
        }
        .game .page-nav .arr.action[data-v-42f27458] {
            background:${secondary_color}!important;
        }
        .game-list .list .hb .details .tit[data-v-42f27458] {
            color:${textColor};
        }
        .game-list .list .hb .li.circle-black[data-v-42f27458] {
            color:${textColor} !important;
        }
        .game-list .list .hb .details[data-v-a9660e98] {
            background-color:${base_color}!important;
        }
        .game-list .list .hb .details .li[data-v-a9660e98] {
            background:#4d4d4c!important;
        }

        .game-betting .content .box .color-box[data-v-a9660e98] {
            padding: .13333rem;
            background: #333332 !important;
        }
            .game-betting .content .box .random-box[data-v-a9660e98] {
             margin-top: .26667rem;
                background: #333332 !important;
            }
        .game-list .tab .li .txt.action[data-v-a9660e98] {
            background:${secondary_color}!important;
            border: .02667rem solid #3b3030;
        color: #8F5206;
        font-weight: bold;
        }
        .game-list .tab .li .txt[data-v-a9660e98] {
            background:${secondary_color}!important;
                    border: .02667rem solid #3b3030;
        color: #8F5206;
        font-weight: bold;
        }
        .van-popup {
            background:${base_color}!important;
        }
        .game .betting-mark .info .item .tit[data-v-a9660e98] {
            color:${textColor};
        }
        .game .betting-mark .box[data-v-a9660e98]:after {
            background-image: linear-gradient(10deg, ${base_color} 50%, transparent 0);
        }
        .game .betting-mark .box[data-v-a9660e98]:before {
            background-image: linear-gradient(-10deg, ${base_color}  50%, transparent 0);
        }
        .van-checkbox__label {
            color:${textColor};
        }
        .game .rule-box .info[data-v-a9660e98] {
            background:${base_color}!important;
        }
        .game .betting-mark .info .item .tit[data-v-42f27458] {
            color:${textColor};
        }
        .game-head[data-v-03b808c2] {
            background:${base_color}!important;
        }
        .game-head .total-box[data-v-03b808c2] {
            background-color:#4D4D4C;
            background-image: url(/images/walletbg-dcbd4124.png);
            background-repeat: no-repeat;
            background-size: contain;
        }
        .game-betting[data-v-03b808c2] {
            background:${base_color}!important;
        }
        .game-betting .tab .box[data-v-03b808c2] {
            background:${secondary_color}!important;
        }
        .game .content .page-box[data-v-03b808c2] {
            background:#333332!important;
        }
        .game-list[data-v-03b808c2] {
            background:${base_color}!important;
        }
         .game-list .list .hb[data-v-03b808c2]
          {
            background:${base_color}!important;
          }
        
        .game-list .list-fooder[data-v-03b808c2] {
            background:${base_color}!important;
        }
        .game .page-nav .number[data-v-03b808c2] {
            background:${base_color}!important;
        }

        .game .page-nav .arr.action[data-v-03b808c2] {
            background:${secondary_color}!important;
        }
        .game-list .tab .li .txt.action[data-v-03b808c2] {
            background:${secondary_color}!important;
            border: .02667rem solid ${textColor};
            box-shadow: none;
          
        }
        .game-list .tab .li .txt[data-v-03b808c2] {
            background:${secondary_color}!important;
            border: .02667rem solid ${textColor};
            box-shadow: .02667rem .02667rem .13333rem .13333rem  ${textColor};
            box-shadow: none;
           
        }
        .game .betting-mark .info .item .tit[data-v-03b808c2] {
            color:${textColor};
        }
        .home .web-info[data-v-432e6ed0] {
          background: #4D4D4C;
            background-image: url(/images/walletbg-dcbd4124.png);
            background-repeat: no-repeat;
            background-size: contain;
        }
        .home .running-time .flip-num .bottom-card .front[data-v-432e6ed0] {
            background:${secondary_color}!important;
        }

        .navbar-title[data-v-106b99c8] {
            background:#3f3f3f !important;
        }
        .mian .check-box .list[data-v-11ffe290] {
            background:#242424!important;
        }

        .mian[data-v-11ffe290] {
            background:#242424!important;
        }

        .mian .check-box .check-header[data-v-11ffe290] {
            background:${base_color}!important;
        }
        .activity-panel-content .content-title[data-v-30ca6441] {
            background:${base_color}!important;
        }

        .container[data-v-7fac80c7] {
            background:${base_color}!important;  
        }
        .container .tip[data-v-7fac80c7] {
            color:${textColor} !important;
        }

        .amount[data-v-7fac80c7] {
            color:${textColor} !important;
        }

        .container .amount_txt[data-v-7fac80c7] {
            background:${secondary_color}!important;        
        }
        .info_content[data-v-6cf5705a] {
            background:#333332!important;  
        }
        .mian .promotion[data-v-7c8bbbf4] {
            background:${base_color}!important;  
        }
        .container[data-v-7fac80c7]:after {
            background:${base_color}!important;  
        }
        .wallet-box .c-row-between {
            background:${base_color}!important;  
        }
        .mian .promotion .info-img .btn-list .btn[data-v-7c8bbbf4] {
              background: linear-gradient(90deg, #FAE59F 0%, #C4933F 100%);
                border: 1px solid #fff;
                color: #8F5206;
        }
        .promote__cell-item[data-v-fc2c35c1] {
            background:#333332!important;  
        }
        .mian[data-v-7c8bbbf4] {
            background:${base_color}!important;  
        }
        .box .c-row-between {
            background:${base_color}!important;  
        }
        .rechargeh__container-content__item[data-v-e4760c44] {
            background:#333332!important; 
         
        }
        .rechargeh__container-content__item-body[data-v-e4760c44] {
            color:${textColor} !important;
        }
        .mian .promotion .table[data-v-14912091] {
            background:${base_color}!important;  
        }
        .page-nav .arr.action[data-v-a9660e98] {
            background:${secondary_color}!important; 
        }
        .page-nav .arr[data-v-a9660e98] {
            background:${secondary_color}!important; 
        }
      
        .mian .promotion .ipt[data-v-0ff6946a] {
            background:${base_color}!important;  
        }
      
        .mian .box .list[data-v-8c7eba72] {
            background:${base_color}!important;  
        }
        .mian[data-v-8c7eba72] {
            background:${secondary_color}!important; 
        }

        .mian .wallet-user[data-v-7b283485] {
            background:${base_color}!important;  
        }

        .mian .wallet-user .name[data-v-7b283485] {
            color:${textColor} !important;
        }
        .mian[data-v-7b283485] {
            background:${base_color}!important;  
        }

        .mian .wallet-box[data-v-7b283485] {
            background:${base_color}!important;  
        }
        .mian .wallet-box .box[data-v-7b283485] {
            background:#333332!important; 
        }

        .boxx1 .c-row-between {
            background:transparent!important;
        }
        .van-tabbar .van-tabbar-item {
            background:transparent!important; 
        }
        .mian .wallet-box .box .balance[data-v-7b283485] {
            background:${base_color}!important;  
        }

        .mian .wallet-box .box .balance .balanceMoney .money[data-v-7b283485] {
            color:${textColor} !important;
        }

        .mian .wallet-box .box .balance .info .item[data-v-7b283485] {
            color:${textColor} !important;
        }
        .mian .wallet-box .box .balance .txt[data-v-7b283485] {
            color:${textColor} !important;
        }
        .mian .wallet-box .total-btn .item .li[data-v-7b283485] {
            background:${base_color}!important;  
            border: 1px solid;
        }
        .mian .box[data-v-3966082f] {
            background:${base_color}!important;  
        }
        .dailySignIn__container-hero[data-v-c4f3162c] {
            background:#3f3f3f!important; 
        }
        .mian .box .list[data-v-3966082f] {
            background:#292929 !important; 
        }

        .mian[data-v-3966082f] {
            background:${base_color}!important;  
        }
        .mian[data-v-67caa467] {
            background:${base_color}!important;  
        }
        .mian .selectBox .pay-box[data-v-67caa467] {
            background:${base_color}!important;  
        }
       
        .mian .selectBox .pay-box .list .li[data-v-67caa467] {
            background:#333332 !important; 
        }
        .Recharge__content-paymoney__money-input[data-v-723e6ff9] {
            background:#333332 !important; 
        }
        .Recharge__content-paymoney__money-input[data-v-723e6ff9] {
            color:${textColor} !important;
        }

        .mian .selectBox .txtBox[data-v-67caa467] {
            background:#3b3b3b!important; 
        }
        .mian .wallet-box .list[data-v-7b283485] {
            background: #292929 !important;
            box-shadow: 0 0 .8rem 0 rgba(58, 58, 58, .07);
        }
        .mian .wallet-box .list[data-v-7b283485]
        {
            background: #292929 !important;
            box-shadow: 0 0 .8rem 0 rgba(58, 58, 58, .07);
        
        }
       
        .Recharge__container-tabcard__items.active[data-v-d15449d7] {
            background:${secondary_color}!important; 
            color:${textColor} !important;
        }
        .Recharge__container-tabcard__items[data-v-d15449d7] {
            background:${base_color}!important;  
            color:${textColor} !important;
        }
        .mian .selectBox .pay-box .des[data-v-67caa467] {
            color:${textColor} !important;
        }
        .mian .selectBox .pay-box .list .item.action[data-v-67caa467] {
            background:${secondary_color}!important; 
        }
        .mian[data-v-25d9c352] {
            background:${base_color}!important;  
        }
        .mian .selectBox .colorBox[data-v-25d9c352] {
            background:${base_color}!important;  
        }

        .mian .selectBox .txtBox[data-v-25d9c352] {
            background:#2a2a2a!important; 
        }
        .mian .selectBox .requiredBox .box .input[data-v-25d9c352] {
            background:#3b3b3b!important; 
        }
        .mian .selectBox .conBox .box .add[data-v-25d9c352] {
            background:${secondary_color}!important; 
        }
        .mian .withdrawal-btn .btn[data-v-25d9c352] {
            background:${secondary_color}!important; 
        }
        .mian .selectBox .tab .box ul li.item.action[data-v-25d9c352] {
            background:${secondary_color}!important; 
        }
        .mian .selectBox .bankBox .box[data-v-25d9c352] {
            background:#3b3b3b!important; 
        }
        .mian .selectBox .conBox .box[data-v-25d9c352] {
            background:${base_color}!important;  
        }

        .mian .bank[data-v-7aa0f84a] {
            background:${base_color}!important;  
        }
        .mian .bank .box[data-v-7aa0f84a] {
            background:#3a3a3a!important; 
        }
        .mian .bank .box .item .input .ipt[data-v-7aa0f84a] {
            background:${base_color}!important;  
        }
        .mian .bank .bank-btn .btn[data-v-7aa0f84a] {
            background:${secondary_color}!important; 
        }
        .mian[data-v-8cd483ca] {
            background:${base_color}!important;  
        }
        .list[data-v-21f3500a] {
            background:${base_color}!important;  
        }
        .mian .menu-box[data-v-8cd483ca] {
            background:${base_color}!important;  
        }

        .mian .menu-box .total-box[data-v-8cd483ca] {
            background:#4D4D4C !important; 
        }
        .financialServices__container-box>div[data-v-7b659096] {
            background: #333332 !important; 
        }
        .navbar-fixed[data-v-2f448113] {
            background:${secondary_color}!important; 
        }
        .bet-container-lottery-card[data-v-4f01bad5] {
           background: #333332 !important;
        }
        .bet-container-lottery-note[data-v-4f01bad5] {
            background:#3a3a3a!important; 
        }
        .bet-container-lottery-note-box>div[data-v-4f01bad5] {
            background:${base_color}!important;  
        }
        .game .page-nav .number[data-v-a9660e98] {
            background:${base_color}!important;  
        }
        .ar {
            background:${base_color}!important;  
        }
        .ar-searchbar__selector>div {
            background:#333332 !important; 
        }
        .mian[data-v-51f72da1] {
            background:${base_color}!important;  
        }
        .mian-from .item input[data-v-51f72da1] {
            background:${base_color}!important;  
        }
      
        .mian-from .mian-btn .gradient[data-v-51f72da1] {
            background:${secondary_color}!important;
            color:${textColor} !important;
        }
        .mian[data-v-33e5e336] {
            background:${base_color}!important;  
        }
        .mian[data-v-439e6f58] {
            background:${base_color}!important;  
        }
        .mian .list .item[data-v-439e6f58] {
            background:${secondary_color}!important;
        }

        .mian[data-v-72438f70] {
            background:${base_color}!important;  
        }
        .mian .list[data-v-72438f70] {
            background:${base_color}!important;  
        }
        .mian .list .item[data-v-72438f70] {
            background:${secondary_color}!important;
        }
        .mian[data-v-9f3a9836] {
            background:${base_color}!important;  
        }
        .mian .login-box[data-v-a0753f48] {
            background:${base_color}!important;  
        }
        .signIn__container-button .active[data-v-4b0b5390]
        {
            background:${secondary_color}!important;    
            color:${textColor} !important;
            border: 1px solid;
        }
        .passwordInput__container-input input[data-v-9ee19ada] {
            background:#484848!important;    
        }
        .phoneInput__container-input input[data-v-93f53084] {
            background:#484848!important;    
        }
        .dropdown[data-v-6f85c91a] {
            background:#484848!important;    
        }
        .mian .login-banner[data-v-a0753f48]
        {
            background:#484848 !important;    
        }
        .mian[data-v-a0753f48] {
            background:${base_color}!important;  
        }
        .dropdown__list[data-v-6f85c91a] {
            background:#484848!important;    
            color:${textColor} !important;  
        }
        .mian .forgot-box[data-v-7ee4aaeb] {
            background:${base_color}!important;  
        }
        .dropdown__list-item[data-v-6f85c91a] {
            background:#484848!important;    
        }
        .register__container-invitation__input input[data-v-be086d67] {
           background:#484848!important;    
        }
        .register__container-button button[data-v-be086d67]
        {
            background:none;  
            border:1px solid !important;
        }
        .register__container-remember[data-v-be086d67] .van-checkbox .van-checkbox__label {
            color:${textColor} !important;  
        }
        .register__container-button .account[data-v-be086d67] {
            color:${textColor} !important;  
        }
        .mian[data-v-7ee4aaeb] {
            background:${base_color}!important;  
        }
        .vip-content-myWelfare[data-v-ed94a06c] {
            background:${base_color}!important;  
        }
        .mian[data-v-2973c506] {
            background:${base_color}!important;  
        }
        .mian .check-box .list1 .hd .item[data-v-2973c506] {
            background:${secondary_color}!important;  
        }
        .mian .check-box .list1 .hd[data-v-2973c506]{
            border-top: .05333rem solid ${base_color};
          
        }
        .mian .selectBox[data-v-25d9c352]
        {
            background:${base_color}!important;     
        }
        .c-tc.goItem span {
            font-size: 18px;
            font-weight: 800;
        }
        .game .betting-mark .info .item .amount-box .li[data-v-a9660e98] {
          font-weight: 900;
          font-size: .38rem;
         }
        .game .betting-mark .info .item .multiple-box .li[data-v-a9660e98] {
              font-weight: 900;
    font-size: .33rem;
        }
    .game .betting-mark .info .item .stepper-box .digit-box[data-v-a9660e98] .van-field__control {

            font-weight: 900;
        }
        .game .betting-mark .info .item .tit[data-v-a9660e98] {
           
            font-weight: 700;
        }
        .game .betting-mark .foot[data-v-a9660e98] {
            font-weight: 800;
        }
        .mian .menu-box .total-box .infoItem .infoBtn .item:last-child .li[data-v-8cd483ca] {
            background: #17B15E;
            box-shadow: none;
        }
        .mian .menu-box .total-box .infoItem .infoBtn .item .li[data-v-8cd483ca] {
            background: #D23838;
            box-shadow: none;
        }
       
        .game-betting .content .box .color-box .green[data-v-a9660e98]
        {
            box-shadow: none !important;
                font-weight: 900;
        }
            .game-betting .content .box .color-box .violet[data-v-a9660e98] {

                box-shadow: none !important;
                    font-weight: 900;
            }
        .game-betting .content .box .color-box .red[data-v-a9660e98] {

        box-shadow: none !important;
        font-weight: 900;
    }
        .game-betting .content .box .btn-box .yellow[data-v-a9660e98] {
  
                box-shadow: none !important;
                font-weight: 900;
            }

             .game-betting .content .box .btn-box .green[data-v-a9660e98] {
  
                box-shadow: none !important;
                font-weight: 900;
            }

            .game-list .list .wrap[data-v-a9660e98] {
                        
                    font-weight: 900;
                }


      `;
  
      res.setHeader('Content-Type', 'text/css');
      res.send(css);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });


    app.use(async (req, res, next) => {
        try {            
            const [rows] = await connection.query('SELECT * FROM general_settings WHERE id = 1');
            res.locals.siteName = rows[0].siteName;
            res.locals.Logo = rows[0].logo_path;
            res.locals.home_banner1 = rows[0].home_banner1;
            res.locals.home_banner2 = rows[0].home_banner2;
            res.locals.home_banner3 = rows[0].home_banner3;
            res.locals.home_banner4 = rows[0].home_banner4;
            res.locals.currency = rows[0].currency;
            res.locals.locale = req.getLocale();
            next();
        } catch (err) {
            next(err);
        }
    });



// setup viewEngine
configViewEngine(app);
// init Web Routes
routes.initWebRouter(app);

// Cron job game 1 minute
cronJobContronler.cronJobGame1p(io);

// Check who connects to the server
socketIoController.sendMessageAdmin(io);

// Listen for connections
server.listen(port, () => {
    console.log("Connected success port: " + port);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        // You can choose to use a different port or handle the error as needed
    } else {
        console.error(err);
    }
});
