import connectionFactory from "./connectionFactory.js";

export default function connectionQuery(sql, values) {
    return new Promise((resolve, reject) => {
        connectionFactory.getConnection((err, connection) => {
            if (err) {
                console.log('Error getting database connection', err);
                reject(err);
            }
            connection.query(sql, values, (error, response) => {
                connection.release();
                if (error) {
                    reject(error);
                }
                resolve(response);
            });
        });
    });
};