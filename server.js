const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/todoApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});

const User = mongoose.model("User", userSchema);

app.post("/api/signup", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(200).json({ message: "Signup successful", user: newUser });
    } catch (err) {
        res.status(500).json({ error: "Failed to register user" });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "User not found, please sign up" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        res.status(200).json({ message: "Login successful", user });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

const taskSchema = new mongoose.Schema({
    text: String,
    completed: Boolean,
    email: String, // Associate task with user email
});

const Task = mongoose.model("Task", taskSchema);

app.get("/tasks/:email", async (req, res) => {
    try {
        const tasks = await Task.find({ email: req.params.email });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

app.post("/tasks", async (req, res) => {
    const { text, email } = req.body;

    if (!text || !email) {
        return res.status(400).json({ error: "Task text and email are required" });
    }

    try {
        const newTask = new Task({ text, completed: false, email });
        await newTask.save();
        res.json(newTask);
    } catch (err) {
        res.status(500).json({ error: "Failed to add task" });
    }
});

app.put("/tasks/:id", async (req, res) => {
    try {
        await Task.findByIdAndUpdate(req.params.id, { completed: true });
        res.json({ message: "Task marked as done" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

app.delete("/tasks/:id", async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete task" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});
