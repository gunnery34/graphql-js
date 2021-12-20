const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const mysql = require('mysql');
const cors = require('cors')

const app = express();
app.use(cors())

const schema = buildSchema(`
  type User {
    id: String
    email: String
    name: String
  }
  type Product {
    id: String
    slug: String
    name: String
    price : Int
  }
  type Query {
    getUsers: [User],
    getProducts(limit: Int): [Product],
    getUserInfo(id: Int) : User
  }
`);

const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
    req.mysqlDb.query(sql, args, (err, rows) => {
        if (err)
            return reject(err);
        rows.changedRows || rows.affectedRows || rows.insertId ? resolve(true) : resolve(rows);
    });
});

const root = {
  getUsers: (args, req) => queryDB(req, "select * from users").then(data => data),
  getProducts: (args, req) => queryDB(req, "select * from products order by id desc limit ?", [args.limit]).then(data => data),
  getUserInfo: (args, req) => queryDB(req, "select * from users where id = ?", [args.id]).then(data => data[0]),
};

app.use((req, res, next) => {
  req.mysqlDb = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'graphql'
  });
  req.mysqlDb.connect();
  next();
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000);

console.log('Running a GraphQL API server at localhost:4000/graphql');
