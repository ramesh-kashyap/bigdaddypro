import connection from "../config/connectDB";
import { format } from "date-fns";

const roiCalculation = async () => {
    try {
        // Fetch all active fund transfers
        const [activeFunds] = await connection.query('SELECT id, user_id, amount FROM fund_transfer WHERE status = "active" AND remarks="0"');

        for (let fund of activeFunds) {
            const { id: fundId, user_id: userId, amount } = fund;
            const maxRoi = 3 * amount;

            // Calculate total ROI given so far
            const [totalRoiResult] = await connection.query('SELECT SUM(comm) as total_roi_given FROM incomes WHERE fund_id = ?', [fundId]);
            const [aiReturnBonusResult] = await connection.query('SELECT SUM(comm) as ai_return_bonus_given FROM incomes WHERE user_id = ? AND remarks = "AI Return Bonus"', [userId]);
            
            const totalRoiGiven = (totalRoiResult[0].total_roi_given || 0) + (aiReturnBonusResult[0].ai_return_bonus_given || 0);

            if (totalRoiGiven > maxRoi) {
                // Update fund_transfer status to completed
                await connection.query('UPDATE fund_transfer SET status = "completed" WHERE id = ?', [fundId]);
                continue; // Skip to the next fund
            }

            // Calculate ROI
            const roi = 0.0033; // 0.33%
            const roiAmount = roi * amount;

            // Get the latest row from minutes_1 table where status is 1
            const [latestMinutes] = await connection.query('SELECT stage, bet FROM minutes_1 WHERE status = 1 ORDER BY id DESC LIMIT 1');
            if (latestMinutes.length === 0) continue; // Skip if no records found

            const { stage, bet } = latestMinutes[0];

            // Insert data into incomes table
            const remarks = "AI bonus";
            await connection.query(
                'INSERT INTO incomes (user_id, fund_id, stage, bet, comm, amount, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, fundId, stage, bet, roiAmount, amount, remarks, new Date().toISOString().slice(0, 19).replace('T', ' '), new Date().toISOString().slice(0, 19).replace('T', ' ')]
            );

            // Update the user's balance in the users table
            await connection.query('UPDATE users SET money = money + ? WHERE id = ?', [roiAmount, userId]);

            // Call rosesPlus function to handle commissions
            const [user] = await connection.query('SELECT phone FROM users WHERE id = ?', [userId]);
            if (user.length > 0) {
                const userPhone = user[0].phone;
                console.log(`User phone found: ${userPhone}`);
                await rosesPlus(userPhone, roiAmount);
            } else {
                console.log(`User with ID ${userId} not found.`);
            }
        }
        console.log("ROI calculation completed successfully.");
    } catch (error) {
        console.error("Error in ROI calculation: ", error);
    }
};



// The rosesPlus function with changes as requested
const rosesPlus = async (phone, money) => {
    try {
        console.log('Starting rosesPlus function');
        
        // Fetch the user information based on the provided phone
        const [user] = await connection.query('SELECT `id`, `phone`, `code`, `invite` FROM users WHERE phone = ? AND veri = 1 LIMIT 1', [phone]);
        if (user.length === 0) {
            console.error('User not found or not verified');
            return;
        }
        let userInfo = user[0];
        console.log('User info fetched:', userInfo);

        // Define the commission rates based on the provided table
        const commissionRates = [0,10, 5, 4, 3, 2, 1, 1,1, 1,1, 0.5, 0.5, 0.5, 0.5, 0.5];

        let currentUser = userInfo;
        let cnt = 1;

        while (currentUser.invite && cnt<=15 && currentUser.invite!=0) {
            const [inviter] = await connection.query('SELECT `id`, `phone`, `code`, `invite` FROM users WHERE code = ? AND veri = 1 LIMIT 1', [currentUser.invite]);
            if (inviter.length === 0) {
                console.log('Inviter not found or not verified');
                break;
            }
           
            let inviterInfo = inviter[0];
            console.log(`Level ${cnt} inviter info fetched:`, inviterInfo);

            let commission = (money / 100) * commissionRates[cnt];
            if (commission > 0 ) {
                // Update the inviter's money and roses information
                await connection.query('UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ?', 
                                       [commission, commission, commission, inviterInfo.phone]);
                console.log(`Level ${cnt} inviter money and roses updated:`, inviterInfo.phone, commission);

                // Insert the bonus details into the incomes table
                await connection.query('INSERT INTO incomes (user_id, amount, comm, rname, remarks,bet) VALUES (?, ?, ?, ?, ?,?)', 
                                       [inviterInfo.id, money, commission, userInfo.phone, 'AI Return Bonus',cnt]);
                console.log(`Income record inserted for Level ${cnt} inviter:`, inviterInfo.id, money, commission, userInfo.phone);
            }

            currentUser = inviterInfo;
            cnt++;
        }
        
    } catch (error) {
        console.error('Error in rosesPlus function:', error);
    }
};



export default roiCalculation;
