const Sequelize = require('sequelize');

const sequelize = new Sequelize('node_complete', 'root', 'root', {
    port: 3305, 
    host:'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;