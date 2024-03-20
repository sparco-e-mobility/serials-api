const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const apiUrl =
  "https://graphql.prepr.io/ce007e419ede0efbe2b2e048a9578250a5fd89769f82d3aef3edca0b1fa41766";

const query = (serial_number) => `
query Serials {
  Serials(where: {serial_number: "${serial_number}"}) {
    items {
      serial_number
      serial_production_date
      _id
    }
  }
}
`;

function createQuery(data) {
  return {
    model: {
      // customer model id
      id: "edab9701-385b-416c-81df-1b0ee03546c5",
    },
    publish_on: {
      "en-US": Math.floor(Date.now() / 1000),
    },
    locales: ["en-US"],
    workflow_stage: {
      "en-US": "Done",
    },
    status: {
      "en-US": {
        body: "Done",
      },
    },
    items: {
      "en-US": {
        customer_name: {
          body: data.fullName,
        },
        customer_email: {
          body: data.email,
        },
        customer_serial_number: {
          body: data.serial,
        },
        customer_purchase_location: {
          body: data.location,
        },
        customer_purchase_date: {
          format: "Y-m-d",
          value: data.purchaseDate,
        },
      },
    },
  };
}

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("yo");
});

app.post("/", async (req, res) => {
  const body = req.body;

  console.log(body);
  const preprRes = await axios.post(
    apiUrl,
    { query: query(body.serial) },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const isSerialValid = preprRes.data.data.Serials.items.length > 0;
  if (isSerialValid) {
    // write user data into prepr
    await axios.post(
      `https://api.eu1.prepr.io/content_items`,
      createQuery(body),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REST_TOKEN}`,
        },
      }
    );
    res.status(200).json(preprRes.data.data.Serials.items[0]);
    return;
  }

  res.status(401).json({ message: "Invalid serial number" });
});

app.listen(process.env.PORT || 3000);
