const db = require("../Configs/postgre");

const getTransaction = (query, id) => {
  let sql = `SELECT t.id, t.from_user_id, u1.full_name AS "sender_full_name", u1.phone_number as "sender_phone_number", u1.photo_profile as "sender_photo_profile", t.from_deleted_at as "sender_deleted_at", t.to_user_id, u2.full_name AS "receiver_full_name", u2.phone_number as "receiver_phone_number", u2.photo_profile as "receiver_photo_profile", t.to_deleted_at as "receiver_deleted_at", tt.type_name as "transaction_type", t.transaction_amount, case when t.from_user_id = $2 then 'Expense' when t.to_user_id = $2 then 'Income' end as summary, t.created_at FROM "transaction" t JOIN users u1 ON t.from_user_id = u1.id JOIN users u2 ON t.to_user_id = u2.id join transaction_type tt on t.transaction_type_id = tt.id where (u1.id = $2 or u2.id = $2) `;
  const values = [parseInt(query.page) || 1, id];
  //   where (u1.id = $2 or u2.id = $2)
  if (query.name) {
    values.push(`%${query.name}%`);
    sql += "and ((u1.full_name ilike $3 or u2.full_name ilike $3) or (u1.phone_number ilike $3 or u2.phone_number ilike $3)) ";
  }

  sql += "and (u1.id = $2 and t.from_deleted_at is null or u2.id = $2 and t.to_deleted_at is null) ";
  sql += "order by t.created_at desc";
  sql += ` limit 7 offset ($1 * 7) - 7`;

  // console.log(sql);
  return db.query(sql, values);
};

const metaTransaction = (query, id) => {
  let sql = `SELECT t.from_user_id, u1.full_name AS "sender_full_name", t.from_deleted_at as "sender_deleted_at", t.to_user_id, u2.full_name AS "receiver_full_name", t.to_deleted_at as "receiver_deleted_at", t.created_at FROM "transaction" t JOIN users u1 ON t.from_user_id = u1.id JOIN users u2 ON t.to_user_id = u2.id join transaction_type tt on t.transaction_type_id = tt.id where (u1.id = $1 or u2.id = $1) `;
  // let sql = `select count(*) as total_data FROM "transaction" t JOIN users u1 ON t.from_user_id = u1.id JOIN users u2 ON t.to_user_id = u2.id join transaction_type tt on t.transaction_type_id = tt.id where (u1.id = $1 or u2.id = $1) `;
  const values = [id];

  if (query.name) {
    values.push(`%${query.name}%`);
    sql += "and (u1.full_name ilike $2 or u2.full_name ilike $2 or u1.phone_number ilike $2 or u2.phone_number ilike $2) ";
  }
  console.log(sql);
  return db.query(sql, values);
};

const getIncome = (query, params) => {
  let sql = `select
  sum(t.transaction_amount),
  CASE 
      WHEN t.to_user_id = $1 THEN 'Income'
  END AS "summary",
  to_char(t.created_at, 'DD-MM-YYYY') as "date" 
FROM
  "transaction" t
JOIN
  users u 
ON 
  t.from_user_id = u.id OR t.to_user_id = u.id
WHERE u.id = $1 and t.to_user_id = $1 `;
  const values = [params.userid];

  if (query.start && query.end) {
    values.push(query.start);
    values.push(query.end);
    sql += `and (t.created_at <= cast($2 as timestamp) + interval '1 day' and t.created_at > $3 ) `;
  } else {
    sql += `and (t.created_at <= current_date + interval '1 day' and t.created_at > current_date - interval '7 days' ) `;
  }
  sql += 'group by "date", "summary" ';

  return db.query(sql, values);
};

const getExpense = (query, params) => {
  let sql = `select
  sum(t.transaction_amount),
  CASE 
      WHEN t.from_user_id = $1 and t.to_user_id != $1 THEN 'Expense'
  END AS "summary",
  to_char(t.created_at, 'DD-MM-YYYY') as "date" 
FROM
  "transaction" t
JOIN
  users u 
ON 
  t.from_user_id = u.id OR t.to_user_id = u.id
WHERE u.id = $1 and t.from_user_id = $1 and t.to_user_id != $1 `;
  const values = [params.userid];

  if (query.start && query.end) {
    values.push(query.start);
    values.push(query.end);
    sql += `and (t.created_at <= cast($2 as timestamp) + interval '1 day' and t.created_at > $3 ) `;
  } else {
    sql += `and (t.created_at <= current_date + interval '1 day' and t.created_at > current_date - interval '7 days' ) `;
  }
  sql += 'group by "date", "summary" ';

  return db.query(sql, values);
};

const dashboardChartData = (query, params) => {
  let sql = `select
 sum(t.transaction_amount),
 CASE 
     WHEN t.from_user_id = $1 THEN 'Expense'
     WHEN t.to_user_id = $1 THEN 'Income'
 END AS "summary",
 to_char(t.created_at, 'DD-MM-YYYY') as "date" 
FROM
 "transaction" t
JOIN
 users u 
ON 
 t.from_user_id = u.id OR t.to_user_id = u.id
WHERE u.id = $1 `;
  const values = [params.userid];

  if (query.start && query.end) {
    values.push(query.start);
    values.push(query.end);
    sql += `and (t.created_at <= cast($2 as timestamp) + interval '1 day' and t.created_at > $3 ) `;
  } else {
    sql += `and (t.created_at <= current_date + interval '1 day' and t.created_at > current_date - interval '7 days' ) `;
  }
  sql += 'group by "date", "summary" ';

  return db.query(sql, values);
};

const getTotal7Days = (params) => {
  let sql = `select
  sum(t.transaction_amount),
  CASE 
  WHEN t.from_user_id = $1 and t.to_user_id != $1 THEN 'Expense'
      WHEN t.to_user_id = $1 THEN 'Income'
  END AS "summary"
FROM
  "transaction" t
JOIN
  users u 
ON 
  t.from_user_id = u.id OR t.to_user_id = u.id
WHERE u.id = $1 and t.created_at > current_date - interval '7 days' 
group by "summary"`;
  const values = [params.userid];

  return db.query(sql, values);
};

const getTotalLastWeek = (params) => {
  let sql = `select
  sum(t.transaction_amount),
  CASE 
      WHEN t.from_user_id = $1 and t.to_user_id != $1 THEN 'Expense'
      WHEN t.to_user_id = $1 THEN 'Income'
  END AS "summary"
FROM
  "transaction" t
JOIN
  users u 
ON 
  t.from_user_id = u.id OR t.to_user_id = u.id
WHERE u.id = $1 and (t.created_at < current_date - interval '7 days' and t.created_at > current_date - interval '14 days' ) 
group by "summary" `;
  const values = [params.userid];
  // console.log(sql);
  return db.query(sql, values);
};

const topUp = (id, body) => {
  const sql = `insert into transaction (from_user_id, to_user_id, transaction_amount, transaction_type_id, payment_type_id)
  values ($1, $1, $2, 2, $3)`;
  const values = [id, body.amount, body.payment_type];
  return db.query(sql, values);
};

const addBalance = (id, amount) => {
  // const values = [id, amount]
  // let sql = `update user_balance
  // set balance = balance + `
  // sql += parseInt(values[1])
  // sql += ` where user_id = $1;`
  // return db.query(sql, values)
  const sql = `update user_balance 
  set balance = balance + $2 
  where user_id = $1;`;
  const values = [id, amount];
  return db.query(sql, values);
};

const deleteFromUser = (params) => {
  let sql = 'update "transaction" t set from_deleted_at = now() where t.id = $1 ';
  const values = [params.transactionId];

  return db.query(sql, values);
};
const deleteToUser = (params) => {
  let sql = 'update "transaction" t set to_deleted_at = now() where t.id = $1 ';
  const values = [params.transactionId];

  return db.query(sql, values);
};
const deleteFromToUser = (params) => {
  let sql = 'update "transaction" t set to_deleted_at = now(), from_deleted_at = now() where t.id = $1 ';
  const values = [params.transactionId];

  return db.query(sql, values);
};

const getUserBalance = (client, userid) => {
  let sql = "select ub.balance from user_balance ub where  ub.user_id = $1";
  const values = [userid];

  return client.query(sql, values);
};
const createTransfer = (client, id, userid, body) => {
  let sql = `WITH inserted AS (INSERT INTO "transaction" (id, from_user_id, to_user_id, transaction_amount, transaction_type_id, note, payment_type_id) values ($1, $2, $3, $4, 1, $5, 0) RETURNING *) SELECT i.id, u1.full_name as "sender_full_name", u2.full_name as "receiver_full_name", i.transaction_amount, tt.type_name as "transaction_type", i.note, i.created_at FROM inserted i JOIN  users u1 ON i.from_user_id = u1.id JOIN  users u2 ON i.to_user_id = u2.id join transaction_type tt on i.transaction_type_id = tt.id;`;
  const values = [id, userid, body.to, body.amount, body.notes];

  return client.query(sql, values);
};
const updateSenderBalance = (client, userid, body) => {
  let sql = "update user_balance set balance = balance - $1, updated_at = now() where user_id = $2 returning balance";
  const values = [body.amount, userid];

  return client.query(sql, values);
};
const updateReceiverBalance = (client, body) => {
  let sql = "update user_balance set balance = balance + $1, updated_at = now() where user_id = $2";
  const values = [body.amount, body.to];

  return client.query(sql, values);
};

const getBalanceDashboard = (params) => {
  let sql = "select ub.balance from user_balance ub where  ub.user_id = $1";
  const values = [params.userid];

  return db.query(sql, values);
};

module.exports = {
  getTransaction,
  metaTransaction,
  getIncome,
  getExpense,
  dashboardChartData,
  getTotal7Days,
  getTotalLastWeek,
  topUp,
  addBalance,
  deleteFromUser,
  deleteToUser,
  deleteFromToUser,
  getUserBalance,
  createTransfer,
  updateSenderBalance,
  updateReceiverBalance,
  getBalanceDashboard,
};
