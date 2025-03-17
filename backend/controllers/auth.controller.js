import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../emails/emailHandlers.js';

export const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      username,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });

    res.cookie('jwt-pronet', token, {
      httpOnly: true, // prevent client-side JavaScript from accessing the cookie
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: 'strict', // prevent CSRF attacks
      secure: process.env.NODE_ENV === 'production', //prevents man-in-the-middle attacks
    });

    res.status(201).json({ message: 'User created successfully' });
    const profileUrl = `${process.env.CLIENT_URL}/profile/${user.username}`;

    try {
      await sendWelcomeEmail(user.email, user.name, profileUrl);
    } catch (emailError) {
      console.log('Error in sending welcome email: ', emailError.message);
    }
  } catch (error) {
    console.log('Error in signup: ', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    //check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    //Check if password is correct
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });

    await res.cookie('jwt-pronet', token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error in login: ', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('jwt-pronet');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.log('Error in getCurrentUser: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
