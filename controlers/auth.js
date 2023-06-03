const { User } = require("../models/user");
const { HttpError, ctrlWrapper, sendEmail } = require("../helpers");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const path = require("path");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");

const { SECRET_KEY, BASE_URL } = process.env;

const register = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        throw HttpError(409, "Email in use");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(req.body.email, { s: "250" });
    const verificationToken = nanoid();


    const newUser = await User.create({ ...req.body, password: hashPassword, avatarURL, verificationToken, });

    const verifyEmail = {
        to: email,
        subject: "Verify email",
        html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click to verify email</a>`,
    };

    await sendEmail(verifyEmail);

    res.status(201).json({
        user: {
            email: newUser.email,
            subscription: newUser.subscription,
        },
    });
};

const resendVerifyEmail = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        throw HttpError(404, "User not found");
    }

    if (user.verify) {
        throw HttpError(400, "Verification has already been passed");
    }

    const verifyEmail = {
        to: email,
        subject: "Verify email",
        html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click to verify email</a>`,
    };

    await sendEmail(verifyEmail);

    res.status(200).json({
        message: "Verification email sent",
    });
};

const verifyEmail = async (req, res) => {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
        throw HttpError(404, "User not found");
    }
    await User.findByIdAndUpdate(user._id, {
        verificationToken: null,
        verify: true,
    });
    res.status(200).json({ message: "Verification successful" });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        throw HttpError(401, "Email or password is wrong");
    }

    if (!user.verify) {
        throw HttpError(401, "Email not verified");
    }

    const passwordCompare = await bcrypt.compare(password, user.password);

    if (!passwordCompare) {
        throw HttpError(401, "Email or password is wrong");
    }

    const payload = {
        id: user._id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });

    await User.findByIdAndUpdate(user._id, { token });

    res.status(201).json({
        token,
        user: {
            email: user.email,
            subscription: user.subscription,
        },
    });
};

const getCurrentUser = async (req, res) => {
    const { email, subscription } = req.user;

    res.json({
        email,
        subscription,
    });
};

const logout = async (req, res) => {
    const { _id: userId } = req.user;

    await User.findByIdAndUpdate(userId, { token: "" });

    res.status(204).json({});
};

const updateSubscription = async (req, res) => {
    const { _id: userId } = req.user;

    const result = await User.findByIdAndUpdate(userId, req.body);
    if (!result) {
        throw HttpError(404, "Not found");
    }
    res.json(result);
};

const updateAvatar = async (req, res) => {
    const { _id: userId } = req.user;
    const avatarDir = path.join(__dirname, "..", "public", "avatars");
    const { path: tempUpload, originalname } = req.file;
    const avatarName = `${userId}_${originalname}`;
    const resultUpload = path.join(avatarDir, avatarName);

    Jimp.read(tempUpload, (err, image) => {
        if (err) throw err;
        image.resize(250, 250).quality(100).write(resultUpload);
    });
    fs.unlink(tempUpload);

    const avatar = "avatars/" + avatarName;

    await User.findByIdAndUpdate(userId, { avatarURL: avatar });

    res.status(200).json({
        avatarURL: avatar,
    });
};

module.exports = {
    register: ctrlWrapper(register),
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
    verifyEmail: ctrlWrapper(verifyEmail),
    login: ctrlWrapper(login),
    getCurrentUser: ctrlWrapper(getCurrentUser),
    logout: ctrlWrapper(logout),
    updateSubscription: ctrlWrapper(updateSubscription),
    updateAvatar: ctrlWrapper(updateAvatar),
};