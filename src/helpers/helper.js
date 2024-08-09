import connection from "../config/connectDB";

const getColor = async () => {
    try {
      const [rows] = await connection.query('SELECT * FROM general_settings WHERE id = 1');
      if (rows.length > 0) {
        return rows[0];
      } else {
        return "#336699"; // Default color
      }
    } catch (err) {
      console.error(err);
      return "#336699"; // Default color in case of error
    }
  };
  
  module.exports = {
    getColor
  };