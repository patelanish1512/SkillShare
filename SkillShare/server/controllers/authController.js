const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, email, password, skillsTeach, skillsLearn } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            email,
            password: hashedPassword,
            skillsTeach,
            skillsLearn
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(201).json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                skillsTeach: user.skillsTeach,
                skillsLearn: user.skillsLearn,
                rating: user.rating,
                sessionsCompleted: user.sessionsCompleted,
                totalRatings: user.totalRatings
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                skillsTeach: user.skillsTeach,
                skillsLearn: user.skillsLearn,
                rating: user.rating,
                sessionsCompleted: user.sessionsCompleted,
                totalRatings: user.totalRatings
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, skillsTeach, skillsLearn } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
            user.username = username;
        }

        if (skillsTeach) user.skillsTeach = skillsTeach;
        if (skillsLearn) user.skillsLearn = skillsLearn;

        await user.save();

        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                skillsTeach: user.skillsTeach,
                skillsLearn: user.skillsLearn,
                rating: user.rating,
                sessionsCompleted: user.sessionsCompleted,
                totalRatings: user.totalRatings
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } })
            .select('username skillsTeach skillsLearn rating sessionsCompleted isOnline')
            .sort({ rating: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
