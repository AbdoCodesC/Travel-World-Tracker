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
  port: process.env.DB_PORT,
});

db.connect()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("error: ", err.stack));

let visited_countries = [];

async function getCountry(input) {
  if (input === "") return undefined;
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [input.toLowerCase()]
    );
    return result.rows[0];
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

async function getVisitedCountries() {
  try {
    visited_countries = [];
    const result = await db.query("SELECT country_code FROM visited_countries");
    result.rows.forEach((row) => {
      visited_countries.push(row.country_code);
    });
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
    total: visited_countries.length,
  });
});

app.post("/add", async (req, res) => {
  const country = await getCountry(req.body.country);
  console.log(country);
  if (!country) {
    res.render("index.ejs", {
      countries: visited_countries,
      total: visited_countries.length,
      error: "Country does not exist, try again!",
    });
    return;
  }

  const found = visited_countries.find((code) => code === country.country_code);

  if (found) {
    res.render("index.ejs", {
      countries: visited_countries,
      total: visited_countries.length,
      error: "Country has already been added, try again!",
    });
    return;
  }

  await insertIntoCountry(country.country_code);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
