// Imports -------------------------------------------
import express from "express";

// Configure express app -----------------------------
const app = new express();

// Configure middleware ------------------------------
const helloController = (req, res) => res.send("Hi! My name is Graeme");

const addController = (req, res) => {
  const var1 = req.params.var1;
  const var2 = req.params.var2;
  const result = {
    operation: "addition",
    operant1: var1,
    operant2: var2,
    result: parseInt(var1) + parseInt(var2),
    message: "Have a great day!",
  };
  res.json(result);
};
// Controllers ---------------------------------------

// Endpoints -----------------------------------------
app.get("/hello", helloController);

app.get("/add/:var1,:var2", addController);

// Start server --------------------------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
