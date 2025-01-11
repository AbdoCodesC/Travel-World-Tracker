import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("views");
app.set("views engine");

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: DB_PORT,
});

db.connect()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("error: ", err.stack));

let visited_countries = [];
let all_countries = [];
async function getAllCountries() {
  try {
    const result = await db.query(
      "SELECT country_code, country_name FROM countries"
    );
    all_countries = result.rows;
    // console.log(all_countries);
  } catch (err) {
    console.log(err);
  }
}
await getAllCountries();

let count;
async function getVisitedCountries() {
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");
    result.rows.forEach((row) => {
      visited_countries.push(row.country_code);
    });
    count = result.rowCount;
  } catch (err) {
    console.log(err);
  }
}

async function insertIntoCountry(code) {
  try {
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [
      code,
    ]);
    console.log("Inserted Successfully!");
  } catch (err) {
    console.log(err);
  }
}

app.get("/", async (req, res) => {
  await getVisitedCountries();
  res.render("index.ejs", {
    countries: visited_countries,
    total: count,
  });
});

app.post("/add", async (req, res) => {
  const country = all_countries.find(
    (code) => code.country_name.toLowerCase() === req.body.country.toLowerCase()
  );
  console.log(country);
  if (!country) {
    console.log("country does not exist!");
    res.redirect("/");
    return;
  }
  console.log(visited_countries);
  const found = visited_countries.find((code) => {
    console.log(code);
    return code === country.country_code;
  });
  if (!found) {
    await insertIntoCountry(country.country_code);
    await getVisitedCountries();
    res.render("index.ejs", {
      countries: visited_countries,
      total: count,
    });
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
